import distribute from './distribute'
import { Handler, Context, Callback } from 'aws-lambda'

interface HandlerResponse {
    statusCode: number
    body: string
}

interface HandlerEvent {
    fromAddress: string
    toAddress: string
    isTestMessage: boolean
}

export function handler(event: HandlerEvent, context: Context, callback: Callback<HandlerResponse>) {
    distribute(event.fromAddress, event.toAddress, {
        limitToWeek: true,
        sendDebugInfo: event.isTestMessage,
        welcome_text: event.isTestMessage ? ["THIS IS A TEST EMAIL. The following email will be sent tomorrow to the training mailing list. You are receiving this email so that you can check and correct any information before the email goes out."] : undefined
    }).then(() => {
        callback(undefined, {statusCode: 200, body: ""})
    })
    .catch(err => {
        callback(err, null)
        console.log(err)
    });
    
}
