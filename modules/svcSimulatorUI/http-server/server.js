/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
const express = require('express')
const app = express()
const http = require('http').Server(app)
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const Program = require('commander')

const initServer = (port) => {
  // For front-end UI
  if (fs.existsSync(path.join('build'))) {
    console.log('info', 'Folder build found: Serving Static Web UI')
    // app.use('*.(jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc|css|js)', express.static(path.join('build')))
    app.use(express.static(path.join('build')))
    app.get('*', (req, res) => {
      res.sendFile(process.cwd() + '/build/index.html')
    })
  } else {
    console.log('warn', 'Folder build not found')
  }

  http.listen(port)
  console.log('info', 'Sim UI HTTP Server started on port ' + port)
}

Program
  .version('0.1')
  .description('UI Simulator')
Program
  .option('-c, --config [configFilePath]', '.env config file')
  .action((args) => {
    // #env file
    const configFilePath = args.config
    const dotenvConfig = {
      debug: true
    }
    if (configFilePath != null) {
      dotenvConfig.path = path.resolve(process.cwd(), configFilePath)
    }
    dotenv.config(dotenvConfig)

    // # setup application config
    const appConfig = {
      httpPort: process.env.SIM_UI_HTTP_PORT ? process.env.SIM_UI_HTTP_PORT : '7070',
      apiBaseUrl: process.env.SIM_UI_ACTIVITY_LOGGER_API_URL ? process.env.SIM_UI_ACTIVITY_LOGGER_API_URL : 'http://localhost:7075',
      senderApiUrl: process.env.SIM_UI_SENDER_API_URL ? process.env.SIM_UI_SENDER_API_URL : 'http://localhost:3103'
    }

    initServer(appConfig.httpPort)

    const killProcess = async () => {

      // Insert cleanup code here
      process.exit(0)
    }

    process.on('SIGINT', killProcess)
  })

if (Array.isArray(process.argv) && process.argv.length > 2) {
  Program.parse(process.argv)
} else {
  Program.help()
}

