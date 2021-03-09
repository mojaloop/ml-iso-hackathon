# ask Lewis for the key if you need it!
SSH_KEY_PATH = ~/.ssh/ml-iso-hackathon-id_rsa

# We store some important, useful, somewhat ephemeral state in .env
# update it with `make update-env`
$(shell touch .env)
include .env

init:
	terraform init

plan:
	aws-mfa
	terraform plan

apply:
	aws-mfa
	terraform apply

install-app:
	scp -i ${SSH_KEY_PATH} ./playbooks/deploy_app.sh ubuntu@${EC2_IP}:/home/ubuntu/deploy_app.sh
	ssh -i ${SSH_KEY_PATH} ubuntu@${EC2_IP}  "/home/ubuntu/deploy_app.sh"

##
# utils
## 

ssh:
	ssh -i ${SSH_KEY_PATH} ubuntu@${EC2_IP}

ansible-test:
	ANSIBLE_INVENTORY=./inventory.ini ansible -m ping main

# Update the local env file from terraform
update-env:
	terraform output > /tmp/terraform_output
	cat /tmp/terraform_output | grep 'ec2_ip' | awk '{print "EC2_IP="$$3}' > .env

