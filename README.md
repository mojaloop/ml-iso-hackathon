# ml-iso-hackathon

Team Mojaloop's Incredible Submission for the ISO 2022 Hackathon

<!-- TODO: replace with better url -->
Go to http://hackathon2.moja-lab.live to see a live demo.

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

### Building project

This Mono-repo is managed by [Lerna](https://github.com/lerna/lerna), but we have abstracted all Lerna specific commands where possible.

Most standard NPM commands will work normally, except for __install__ command. The usual `build`, `lint`, `start` commands can be run from both the project root and inside each of the module folders. Check the __package.json__ for avaialable scripts.

See more information in the next section.

### Installing dependencies

Ensure you run the following command at the project root:

`$ npm install`

This will install:
1. mono-repo tools,
2. run the bootstrap to symbolically link project modules, and
3. run install for each of the project modules

> **NOTE**:<br/>
> Do not run `npm install` directly in a modules folder. This will break the symbolic links created by the mono-repo tools (lerna). <br/><br/>
> Instead, run `npm install` from the project root!<br/><br/>

###  Build

`$ npm run build`

#### Building a specific module

`$ cd ./modules/<MODULE_NAME>`
`$ npm run build`
`$ npm start`

> **NOTE**:<br/>
> `npm run watch`is supported at root or for each module. <br/><br/>

### Running application(s)

#### Start all
`$ npm start`

Note: If run at root, all __executable__ applications will be started.

With debug log level

`$ LOG_LEVEL=debug npm start`

#### Start module
It is also possible to start a specific module:

`$ npm run start:example`

Refer to the main package.json for what applications can be started individually.

### Linting

Check for lint errors:
`$ npm run lint`

Auto-Fix lint errors:
`$ npm run lint:fix`

Note: If run at root, all modules will be __linted__.

### Tests

Test:
`$ npm run test:unit`

Note: If run at root, all modules will be __tested__.

### Checking / Updating dependencies

Check for any outdated dependencies:
`$ npm run dep:check`

Update all dependencies to latest versions:
`$ npm run dep:update`

Note: If run at root, all modules __dependencies__ will be either be __checked__ or __updated__.

### Cleaning build dependencies and dependencies

Clean all build files:
`$ npm run clean:dist`

Clean all dependencies:
`$ npm run clean:npm`

## Deploying

We deploy the application with `docker-compose` on an AWS ec2 instance.

We use terraform to automate the creation of the instance and required bits and pieces (security groups, dns records etc.).

See [`./infra`](./infra) for more information.

## TODO:

- [x] Deploy a landing page, or even just the ttk UI to get started
- [ ] Some circleci config that deploys this project when we push a new tag (is this _really_ necessary?)
- [ ]

## Sequence / Flow

The sequence of steps for this cross border scenario is depicated below as a sequence diagram
![P2P in a ISO20022 <-> Mojaloop Cross network scenario](docs/iso20022-mojaloop-sequence.svg)

## Customizations, changes made to ISO 20022 messages

1. Increased UUID size to 36
2. Added ILPData element to pain.013, pacs.008 and pain.002 messages to support ILP Packet, Condition and Fulfilment (to support Interledger Protocol that Mojaloop uses)
