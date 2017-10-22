import * as fs from 'fs';

export interface AWSCredentials {
    accessKeyId : string
    secretAccessKey: string
    region : string
}
export interface EmailCredentials {
    from: string,
    testTo: string,
    productionTo: string
}

export interface Credentials {
    aws: AWSCredentials,
    email: EmailCredentials
}

let content = fs.readFileSync('./credentials.json');
let credentials : Credentials = JSON.parse(content.toString());

export default credentials