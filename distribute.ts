import * as pug from "pug"
import * as inlineCss from "inline-css"
import sendMail from "./send-mail"
let createTextVersion = require("textversionjs");
import fetch from 'node-fetch'

const SUBJECT = 'Orienteering This Week';

interface CUOCCalendarItem {
    calendar_id: number
    start_date: string
    modified: string
    name: string
    uri: string
}
interface CuocBofInfo {
    type: string
    id: number
    links: string[] | null
}
interface CUOCCalendarDetail {
    calendar_id: number
    name: string,
    location_name: string,
    location_lat: number,
    location_lon: number
    location_zoom: number,
    location_marker: boolean
    start_date: string
    start_time: string
    end_date: string
    end_time: string
    club: string
    item_type: string
    item_type_id: number
    modified: string
    description: string
    status: string
    bof: CuocBofInfo
    extra_html: string
}
interface TrainingSession {
    date_start: number;
    date_end: number | null;
    location_name: string;
    address: string | null;
    description: string | null;
    start_lat: number | null;
    start_lon: number | null;
    first_start_time: string | null;
    last_start_time: string | null;
    parking_lat: number | null;
    parking_lon: number | null;
    parking_info: string | null;
    organiser_name: string | null;
    organiser_email: string | null;
    organiser_phone: string | null;
    club: string | null;
    juniors: boolean | null;
    cost_adult: number | null;
    cost_junior: number | null;
    bof_id: number
    bof_type: string
    cuoc_id: number
}
interface DistributeOptions {
    welcome_text?: string[]   // Array of paragraphs of custom text to put at the top
    limitToWeek: boolean      // If true, only send the email if there is data within the next week
    sendDebugInfo: boolean    // If true, an email is always sent containing debug info, even if the weekly email will not be sent.
}
interface RenderedData {
    inlinedHtml: string,
    html: string
}

function extractDate(s: string) {
    return new Date(s + " 12:00:00")
}
function getStart(d: CUOCCalendarItem) {
    return extractDate(d.start_date)
}
function compareCalendarItems(d1: CUOCCalendarItem, d2: CUOCCalendarItem) {
    let s1 = getStart(d1)
    let s2 = getStart(d2)
    return s1.getTime() - s2.getTime()
}
function checkForScriptTag(s: string): boolean {
    return s.match(/<\s*script.*>/) != null
}
function cuocCalendarToTrainingSession(d: CUOCCalendarDetail): TrainingSession {

    return {
        date_start: extractDate(d.start_date).getTime() / 1000,
        date_end: null,
        location_name: d.location_name,
        address: null,
        description: d.description + ((d.extra_html && !checkForScriptTag(d.extra_html)) ? ("<br/>" + d.extra_html) : ""),
        start_lat: d.location_lat,
        start_lon: d.location_lon,
        first_start_time: d.start_time.slice(0, 5),
        last_start_time: null,
        parking_lat: null,
        parking_lon: null,
        parking_info: null,
        organiser_name: null,
        organiser_email: null,
        organiser_phone: null,
        club: d.club,
        juniors: null,
        cost_adult: null,
        cost_junior: null,
        bof_id: d.bof ? d.bof.id : null,
        bof_type: d.bof ? d.bof.type : null,
        cuoc_id: d.calendar_id
    }
}

export default async function distribute(fromAddress: string, toAddress: string, opts: Partial<DistributeOptions>) {

    let res = await fetch("https://cuoc.org.uk/api/calendar/items?type=3")
    let data: CUOCCalendarItem[] = await res.json()

    let futureData = data.filter(d => getStart(d) > (new Date())).sort(compareCalendarItems)

    if (futureData.length == 0) {
        // If no data available then just return
        if (opts.sendDebugInfo === true) {
            await sendDebug(fromAddress, toAddress, "Email will not be sent because there is no future data.")
        }
        console.log('Email not sent because no data available.')
        return
    }

    let dataToRender: CUOCCalendarDetail[] = [];
    let numToRender = 5
    let count = 0;
    while (dataToRender.length < numToRender) {
        let next5 = futureData.slice(count * numToRender, Math.min((count + 1) * numToRender, futureData.length))
        if (next5.length == 0) {
            break
        }
        let res2 = await Promise.all(next5.map(d => fetch(d.uri)))
        let data2: CUOCCalendarDetail[] = await Promise.all(res2.map(r => r.json()))
        data2 = data2.filter(d => d.status == "scheduled")
        for (let i = 0; i < data2.length; i++) {
            if (dataToRender.length >= numToRender) {
                break
            }
            dataToRender.push(data2[i])
        }
        count++
    }


    // Limit to one week - return if no data
    if (opts.limitToWeek === true) {
        let timeNow = (new Date()).getTime() / 1000
        let midnightTonight = Math.ceil(timeNow / 86400) * 86400
        if (extractDate(dataToRender[0].start_date) > new Date((midnightTonight + 7 * 86400) * 1000)) {
            if (opts.sendDebugInfo === true) {
                await sendDebug(fromAddress, toAddress, "Email will not be sent because there is no data in the coming week")
            }
            console.log('Email not sent because no data in the coming week')
            return
        }
    }

    let {html, inlinedHtml} = await render(dataToRender.map(d => cuocCalendarToTrainingSession(d)), fromAddress, toAddress, opts.welcome_text)
    
    let info = await sendMail({
        from: fromAddress,
        to: toAddress,
        subject: SUBJECT,
        text: createTextVersion(html),
        html: inlinedHtml
    })
    console.log("Main email sent successfully")
}

async function sendDebug(fromAddress: string, toAddress: string, message: string) {
    let info = await sendMail({
        from: fromAddress,
        to: toAddress,
        subject: SUBJECT,
        text: message,
        html: message
    })
    console.log("debug email sent")
}

async function render(data: TrainingSession[], fromAddress: string, toAddress: string, welcome_text: string[]) {
    return new Promise<RenderedData>((resolve, reject) => {
        pug.renderFile('./views/weekly-email.pug', { data, welcome_text: (welcome_text) ? welcome_text : [] }, (err, html) => {
            if (err) {
                reject(err)
            } else {
                inlineCss(html, { url: ' ' })
                    .then(inlinedHtml => resolve({inlinedHtml: inlinedHtml, html: html}))
                    .catch(err => reject(err))
            }
        })
    })

}