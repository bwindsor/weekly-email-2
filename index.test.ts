import distribute from './distribute'
import credentials from './credentials'

distribute(credentials.email.testTo, {limitToWeek: true, sendDebugInfo: true}).catch(err => console.log(err))