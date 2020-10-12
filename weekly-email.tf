/* Shared bucket for S3 state storage */
terraform {
  backend "s3" {
    bucket = "weekly-email-terraform-state"
    key    = "weekly-email-state"
    region = "us-east-1"
  }

  required_providers {
    archive = {
      source = "hashicorp/archive"
      version = "1.3.0"
    }
    aws = {
      source = "hashicorp/aws"
      version = "3.10.0"
    }
  }

  required_version = ">=0.13"
}

/*** Variables ***/
/* For AWS deployment */
variable "aws_region" {
    description = "AWS region to launch servers."
    default = "us-east-1"
}
variable "profile" {
    description = "Credentials profile to use."
    default = "weekly-email"
}
/* Variables for configuration of email addresses */
variable "from_address" {
    description = "Email address to send mail from, in the format 'My Name<myemail@domain.com>'"
}
variable "to_address_test" {
    description = "Email address to send test messages to, in the format 'My Name<myemail@domain.com>'"
}
variable "to_address_main_list" {
    description = "Email address to send the production message to, in the format 'List Name<list@domain.com>'"
}

/* Use AWS */
provider "aws" {
    region = var.aws_region
    profile = var.profile
}

/* Zip file to be uploaded for lambda function */
data "archive_file" "distribute_lambda" {
    type        = "zip"
    output_path = "${path.module}/distribute_lambda.zip"
    source_dir = "${path.module}/build-production"
}

/* Lambda function */
resource "aws_lambda_function" "distribute" {
    filename         = data.archive_file.distribute_lambda.output_path
    function_name    = "weekly_email_distribute"
    role             = aws_iam_role.iam_for_lambda.arn
    handler          = "index.handler"
    source_code_hash = filebase64sha256(data.archive_file.distribute_lambda.output_path)
    runtime          = "nodejs12.x"
    timeout          = 20
    memory_size      = 128
    description      = "Requests data from the CUOC API and sends it as an email"
}

/* Lambda execution role */
resource "aws_iam_role" "iam_for_lambda" {
  name = "weekly-email-lambda-executor"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

/* Policy attached to lambda execution role to allow logging */
resource "aws_iam_role_policy" "lambda_log_policy" {
  name = "lambda_log_policy"
  role = aws_iam_role.iam_for_lambda.id

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

/* Policy attached to lambda execution role to allow SES */
resource "aws_iam_role_policy" "lambda_ses_policy" {
  name = "lambda_ses_policy"
  role = aws_iam_role.iam_for_lambda.id

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

/* Cloudwatch role which is allowed to trigger lambda */
resource "aws_iam_role" "iam_for_cloudwatch" {
  name = "weekly-email-cloudwatch-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["events.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

/* Policy attached to cloudwatch execution role to allow lambda execution */
resource "aws_iam_role_policy" "cloudwatch_execute_policy" {
  name = "weekly_email_cloudwatch_execute_policy"
  role = aws_iam_role.iam_for_cloudwatch.id

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}


/*** Cloudwatch Triggers to run regularly ***/
/* Trigger to send a test message */
resource "aws_cloudwatch_event_rule" "send-test" {
  name        = "weekly-email-send-test"
  description = "Send test message for the weekly email"
  /* Send on Saturdays at midday */
  schedule_expression = "cron(0 12 ? * SAT *)"
  role_arn = aws_iam_role.iam_for_cloudwatch.arn
  is_enabled = true
}

resource "aws_cloudwatch_event_target" "send-test-target" {
  rule      = aws_cloudwatch_event_rule.send-test.name
  target_id = "weekly-email-cloudwatch-event-test-target"
  arn       = aws_lambda_function.distribute.arn
  input     = <<EOF
{
  "fromAddress": "${var.from_address}",
  "toAddress": "${var.to_address_test}",
  "isTestMessage": true
}
EOF
}

/* Trigger to send the actual weekly email */
resource "aws_cloudwatch_event_rule" "send-production" {
  name        = "weekly-email-send-production"
  description = "Send message to the main list for the weekly email"
  /* Send on Sundays at 5pm */
  schedule_expression = "cron(0 17 ? * SUN *)"
  role_arn = aws_iam_role.iam_for_cloudwatch.arn
  is_enabled = true
}

resource "aws_cloudwatch_event_target" "send-production-target" {
  rule      = aws_cloudwatch_event_rule.send-production.name
  target_id = "weekly-email-cloudwatch-event-production-target"
  arn       = aws_lambda_function.distribute.arn
  input     = <<EOF
{
  "fromAddress": "${var.from_address}",
  "toAddress": "${var.to_address_main_list}",
  "isTestMessage": false
}
EOF
}

/* Permission on lambda's end to allow cloudwatch to invoke it */
resource "aws_lambda_permission" "allow_cloudwatch_test" {
  statement_id   = "WeeklyEmailAllowExecutionFromCloudWatchTest"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.distribute.function_name
  principal      = "events.amazonaws.com"
  source_arn     = aws_cloudwatch_event_rule.send-test.arn
}
resource "aws_lambda_permission" "allow_cloudwatch_production" {
  statement_id   = "WeeklyEmailAllowExecutionFromCloudWatchProduction"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.distribute.function_name
  principal      = "events.amazonaws.com"
  source_arn     = aws_cloudwatch_event_rule.send-production.arn
}
