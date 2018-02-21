/********************************
State Store
********************************/
terraform {
    backend "s3" {
      bucket = "weekly-email-state"
      key    = "weekly-email"
      region = "us-east-1"
    }
}

/* Use AWS */
provider "aws" {
    region = "${var.aws_region}"
    profile = "${var.profile}"
}

/* Lambda function */