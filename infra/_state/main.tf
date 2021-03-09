provider "aws" {
  region = "eu-west-2"
}
resource "aws_s3_bucket" "ml-iso-hackathon-tf-state-storage" {
    bucket = "ml-iso-hackathon-tf-state-storage"
    versioning {
      enabled = true
    }
    lifecycle {
      prevent_destroy = true
    }
    tags = {
      "mojaloop/cost_center" = "oss-hackathon"
      "mojaloop/owner" = "lewis"
    }
}
# create a dynamodb table for locking the state file
resource "aws_dynamodb_table" "ml-iso-hackathon-dynamodb-tf-state-lock" {
  name = "ml-iso-hackathon-dynamodb-tf-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
  point_in_time_recovery {
    enabled = false
  }
  tags = {
      "mojaloop/cost_center" = "oss-hackathon"
      "mojaloop/owner" = "lewis"
    }

}