import * as nodemailer from 'nodemailer'
import * as AWS from 'aws-sdk'
import credentials from './credentials'

// configure AWS SDK
AWS.config.credentials = new AWS.Credentials(credentials.aws.accessKeyId, credentials.aws.secretAccessKey)
AWS.config.region = credentials.aws.region

// create Nodemailer SES transporter
let transporter = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01'
    })
});

// send some mail
function sendMail(mailOptions: nodemailer.SendMailOptions, done: (err: Error, info: nodemailer.SentMessageInfo)=>void) {
	transporter.sendMail(mailOptions, done)
}

export default sendMail;