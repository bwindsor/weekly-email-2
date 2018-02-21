import * as nodemailer from 'nodemailer'
import * as AWS from 'aws-sdk'

// configure AWS SDK
//AWS.config.region = credentials.aws.region

// create Nodemailer SES transporter
let transporter = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01'
    })
});

// send some mail
async function sendMail(mailOptions: nodemailer.SendMailOptions) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err: Error, info: nodemailer.SentMessageInfo) => {
            if (err) {
                reject(err)
            } else {
                resolve(info)
            }
        })
    })
}

export default sendMail;