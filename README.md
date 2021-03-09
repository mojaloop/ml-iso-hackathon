# ml-iso-hackathon

Team Mojaloop's Incredible Submission for the ISO 2022 Hackathon

<!-- TODO: replace with better url -->
Go to http://hackathon.moja-lab.live:6060 to see a live demo.

![](./docs/arch.png)


## Quick Start

```bash
git clone git@github.com:mojaloop/ml-iso-hackathon.git
cd ml-iso-hackathon
docker-compose up

# now go to: [ todo ] in your browser to see it running!
```

## Running this Demo

### Components
[ todo - Michael... what are the components, what do they do, how do they fit together?]


## Developing

[ todo - Miguel ]


## Deploying

We deploy the application with `docker-compose` on an AWS ec2 instance.

We use terraform to automate the creation of the instance and required bits and pieces (security groups, dns records etc.).

See [`./infra`](./infra) for more information.



## TODO:

- [x] Deploy a landing page, or even just the ttk UI to get started
- [ ] Some circleci config that deploys this project when we push a new tag (is this _really_ necessary?)
- [ ]
