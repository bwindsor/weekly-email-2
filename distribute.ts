import * as pug from "pug"
import * as inlineCss from "inline-css"
import sendMail from "./send-mail"
let createTextVersion = require("textversionjs");
import credentials from "./credentials"
import fetch from 'node-fetch'

const FROM_ADDRESS = credentials.email.from;
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
function checkForScriptTag(s: string) : boolean {
    return s.match(/<\s*script.*>/) != null
}
function cuocCalendarToTrainingSession(d: CUOCCalendarDetail): TrainingSession {

    return {
        date_start: extractDate(d.start_date).getTime() / 1000,
        date_end: null,
        location_name: d.location_name,
        address: null,
        description: d.description + ((d.extra_html && !checkForScriptTag(d.extra_html)) ? ("<br/>"+d.extra_html) : ""),
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

export default function distribute(toAddress: string, welcome_text?: string[], ) {

    fetch("https://cuoc.org.uk/api/calendar/items?type=3").then((res) => res.json()).then((data: CUOCCalendarItem[]) => {
        //let futureData = data.filter(d => getStart(d) > (new Date())).sort(compareCalendarItems)
        let futureData = data.filter(d=>d.calendar_id==4996)
        futureData = futureData.slice(0, Math.min(5, futureData.length))

        if (futureData.length == 0) {
            // If no data available then just return
            return
        }

        Promise.all(futureData.map(d => fetch(d.uri)))
            .then(res => Promise.all(res.map(r => r.json())))
            .then((data: CUOCCalendarDetail[]) => {
                render(data.map(d => cuocCalendarToTrainingSession(d)), toAddress, welcome_text)
            })
            .catch(err => console.log(err))
    })
}

function render(data: TrainingSession[], toAddress: string, welcome_text: string[]) {
    pug.renderFile('./views/weekly-email.pug', { data, welcome_text: (welcome_text) ? welcome_text : [] }, (err, html) => {
        if (err) {
            console.log(err)
        } else {
            inlineCss(html, { url: ' ' }).then(inlinedHtml => {
                sendMail({
                    from: FROM_ADDRESS,
                    to: toAddress,
                    subject: SUBJECT,
                    text: createTextVersion(html),
                    html: inlinedHtml
                }, (err, info) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("success")
                    }
                })
            }).catch(err => {
                console.log(err)
            })
        }
    })
}