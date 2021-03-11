# Tell terraform to use remote stae
terraform {
  backend "s3" {
    encrypt=true
    bucket = "ml-iso-hackathon-tf-state-storage"
    dynamodb_table = "ml-iso-hackathon-dynamodb-tf-state-lock"
    key    = "state-lock-storage.keypath"
    region = "eu-west-2"
  }
}
provider "aws" {
  region = "eu-west-2"
}

resource "aws_instance" "ml-iso-hackathon-ec2" {
  # ubuntu 18.04
  ami           = "ami-0244a5621d426859b"
  instance_type = "m4.large"
  tags = {
    "mojaloop/cost_center" = "oss-hackathon"
    "mojaloop/owner" = "lewis"
    "name" = "ml-iso-hackathon"
  }
  key_name = "admin-key"
  # TODO: set to true
  disable_api_termination = false
  security_groups = [ aws_security_group.ml-iso-hackathon-security-group.name ]
  user_data = "${file("userdata.sh")}"
}

resource "aws_security_group" "ml-iso-hackathon-security-group" {
  name        = "ml-iso-hackathon-security-group"
  description = "Allow TLS inbound traffic on 22, 80 and 443"

  ingress {
    description = "SSH Acccess"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Http"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Https"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Https"
    from_port   = 6060
    to_port     = 6060
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    "mojaloop/cost_center" = "oss-hackathon"
    "mojaloop/owner" = "lewis"
  }
}
resource "aws_key_pair" "admin-key" {
  key_name   = "admin-key"
  public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC9qFBCUfPkaJjAivhlyzRun1Lathp+PuF0K03RtmWpUQOLuvVygjyvDpwBPq0qfwDNedQvHMcyGD49/8ryYKf8BxVrW1y2nDGKBRFcHGlIdQ46J3qGupQZMTerUrXRJzcK5MQpBqeXGJE0lpaMZsohEbsSO1dUEIW09m05+JFP6A/CbWtxBqiJ96pfzF41vSye87eHxIRKjSo0zcUxCapC6dAfKRTeBLD0I+WY9UxBMogZSLKcjjTax9r1NaTPK0Ox8Qd+6VtFUTszWyh6SBRV6h7zXr6xSPdJMKL75J+2FfbtyeinQLLWyA4PnDDPOnIplOs92qBKmyO6+D5dlW3O63plu52dVcIeS3APR3dP+OGId69KYfFKEfO1CBNSlyUuHdEOnzjL8M1ObWY+UnSdQ0t5G8d9X7K2ptlT4J5FP6Qc8MAK8NW/KUxHmCbAqtoG95hE/fz3GaZNHCVZrQz+UueCD6zUQCQCQwSYshBlL/C465eiT8/JrSpU7azYmCr4z4puGK1s7J23lWORkAMnLRLqSArbY1JZe7fpjlQFasB5RfzzQw2OUOI9l978zGtx7CfAbwscheXR/6skMFlkRWvP7t8HZOXaN1SburjH7zDxrlWS4+y6yYThDe/eYzRgiTPy/TzD4Kk4GYQGNTnpJ6RH6vvhPRSlfDXKip+FrQ== lewisd@crosslaketech.com"
}

resource "aws_route53_record" "dns-record" {
  # You can grab this manually from the console
  zone_id = "ZI6YUDJG99KZL"
  name    = "hackathon.moja-lab.live"
  type    = "A"
  ttl     = "300"
  records = [aws_instance.ml-iso-hackathon-ec2.public_ip]
}
resource "aws_route53_record" "dns-record-wildcard" {
  # You can grab this manually from the console
  zone_id = "ZI6YUDJG99KZL"
  name    = "*.hackathon.moja-lab.live"
  type    = "A"
  ttl     = "300"
  records = [aws_instance.ml-iso-hackathon-ec2.public_ip]
}

## Outputs
output "ec2_ip" {
  value = aws_instance.ml-iso-hackathon-ec2.public_ip
}
