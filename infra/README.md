# infra

Configuration and tools for managing the deployment of this demo.

## Prerequisites
- `terraform`
- `aws` account for Mojaloop's Organization
- `aws-mfa` tool
-  A `~/.aws/config` file like the following:

```
...

[mojaloop-long-term]
aws_access_key_id = <<hidden>>
aws_secret_access_key = <<hidden>>

...
```



## Setting up
```bash
make init
```

## Deploy infrastructure

```bash
make plan
# check the output for nothing outrageous

# deploy the infra
make apply
```

## Deploy the application

```bash
# this copiess the `./playbooks/deploy_app.sh` script across and runs it.
# which clones the repo, and runs `docker-compose up -d`
make install-app
```


## Handy Snippets

### Testing the traefik load balancer:


```bash
docker-compose up -d 
curl -k -H "Host: hackathon2.moja-lab.live" http://localhost
curl -k -H "Host: ttk.hackathon2.moja-lab.live" http://localhost
```