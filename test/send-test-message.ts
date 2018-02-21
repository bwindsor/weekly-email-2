import { handler } from '../index'
import { FROM_ADDRESS, TO_ADDRESS } from './testconfig'

handler({fromAddress: FROM_ADDRESS, toAddress: TO_ADDRESS, isTestMessage: true}, null, (err, res) => {
    if (err) {
        console.log(err)
    } else {
        console.log("Test succeeded")
    }
})

