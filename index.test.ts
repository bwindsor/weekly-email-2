import distribute from './distribute'
import credentials from './credentials'

distribute(credentials.email.testTo, {limitToWeek: true}).catch(err => console.log(err))