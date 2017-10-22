import * as pug from "pug"
import * as inlineCss from "inline-css"
import sendMail from "./send-mail"
import createTextVersion = require("textversionjs");
import credentials from "./credentials"
import fetch from 'node-fetch'

const FROM_ADDRESS = credentials.email.from;
const SUBJECT = 'Orienteering This Week';

export default function distribute(toAddress: string, welcome_text? : string[], ) {

    fetch("").then((res) => res.json()).then(data => {

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
    })
}