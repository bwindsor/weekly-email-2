import distribute from './distribute'
import { Handler, Context, Callback } from 'aws-lambda'

interface HandlerResponse {
    statusCode: number
    body: string
}

export function handler(event: any, context: Context, callback: Callback<HandlerResponse>) {
    distribute(event.fromAddress, event.toAddress, {
        limitToWeek: true,
        sendDebugInfo: event.isTestMessage
    }).then(() => {
        callback(undefined, {statusCode: 200, body: ""})
    })
    .catch(err => {
        callback(err, null)
        console.log(err)
    });
    
}
