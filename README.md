# weekly-email-2
This is based on WeeklyEmail, but uses CUOC's API to get the data, therefore there is no front end or web interface for this version, it simply pulls data from CUOC and formats it into the weekly email.

## Set up from scratch
1. `git clone https://github.com/bwindsor/weekly-email-2.git`
2. `npm install`
3. Rename `test/testconfig.ts.template` to `test/testconfig.ts` and insert your desired from/to addresses.
4. `npm run build`

### To test locally
1. Make sure you have an AWS IAM account with SES send permissions configured with the AWS CLI
2. Set environment variable `export AWS_PROFILE=weekly-email`, where `weekly-email` should be replaced by the name of your profile
3. `npm run send-test` to send a test email
4. `npm run send-production` to send a production email

### To deploy to AWS
1. Download [terraform](https://www.terraform.io/)
2. Make sure you have an AWS IAM account with admin permissions on your account so that you can deploy the infrastructure using it, and configure this with the AWS CLI.
3. `terraform init`
4. Rename `terraform.tfvars.template` to `terraform.tfvars` and replace the values with your ones
5. `terraform apply`