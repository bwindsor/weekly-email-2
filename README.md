# weekly-email-2
This is based on WeeklyEmail, but uses CUOC's API to get the data, therefore there is no front end or web interface for this version, it simply pulls data from CUOC and formats it into the weekly email.

## Set up from scratch
1. `git clone https://github.com/bwindsor/weekly-email-2.git`
2. `npm install`
3. Rename `test/testconfig.ts.template` to `test/testconfig.ts` and insert your desired from/to addresses.
4. `npm run build`

### To test locally
1. Make sure you have an AWS IAM account with SES send permissions configured with the AWS CLI
2. Set environment variables
    1. `export AWS_PROFILE=weekly-email`, where `weekly-email` should be replaced by the name of your profile
    2. `export AWS_REGION=us-east-1` where `us-east-1` should be the AWS region you are using
3. `npm run send-test` to send a test email
4. `npm run send-production` to send a production email

### To deploy to AWS
1. Run the steps in the [set up from scratch](#set-up-from-scratch) section above
1. Download [terraform](https://www.terraform.io/)
2. Make sure you have an AWS IAM account with admin permissions on your account so that you can deploy the infrastructure using it, and configure this with the AWS CLI.
3. `export AWS_PROFILE=weekly-email` where `weekly-email` should be replaced by the name of your AWS credentials profile
4. `terraform init`
5. Rename `terraform.tfvars.template` to `terraform.tfvars` and replace the values with your ones.
6. Make sure the email address your are sending from is verified by adding it in the AWS console [here](https://console.aws.amazon.com/ses#verified-senders-email).
7. `npm run deploy`

Note that `npm run deploy` just builds a special `build-production` folder which contains the build and all dependencies required for the lambda function on AWS, and then runs `terraform apply`. You can do these steps separately, for example if you just want to plan, then run `npm run build-production` then `terraform plan`.