import distribute from './distribute'
import credentials from './credentials'

distribute(credentials.email.productionTo, {limitToWeek: true}).catch(err => console.log(err))