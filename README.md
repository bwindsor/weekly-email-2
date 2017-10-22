# weekly-email-2
This is based on WeeklyEmail, but uses CUOC's API to get the data, therefore there is no front end or web interface for this version, it simply pulls data from CUOC and formats it into the weekly email.

## Set up from scratch
1. `git clone https://github.com/bwindsor/weekly-email-2.git`
2. `npm install`
3. Create `credentials.json`, see below
4. `npm run build`
5. `npm start`

## Credentials
AWS SES service is used to send the messages. Create a `credentials.json` file in the top level of this project with your credentials, in the same format as the `credentials-template.json` file.