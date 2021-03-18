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
const dotenv = require('dotenv')
const Program = require('commander')
const path = require('path')

const apiServer = require('./lib/api-server')
const TTKSocketMessageCollector = require('./collectors/ttkSocketMessageCollector')
const RedisMessageCollector = require('./collectors/redisMessageCollector')

const initServer = (appConfig) => {
  apiServer.startServer(appConfig.httpPort)
  this.ttkSocketMessageCollectorObj = new TTKSocketMessageCollector(appConfig)
  this.redisMessageCollectorObj = new RedisMessageCollector(appConfig)
  console.log('info', 'Activity Log Collector started on port ' + appConfig.httpPort)
}

Program
  .version('0.1')
  .description('Activity Log Collector')
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
      httpPort: process.env.ACTIVITY_LOG_COLLECTOR_HTTP_PORT ? process.env.ACTIVITY_LOG_COLLECTOR_HTTP_PORT : '7075',
      ttkApiBaseUrl: process.env.ACTIVITY_LOG_COLLECTOR_TTK_API_URL ? process.env.ACTIVITY_LOG_COLLECTOR_TTK_API_URL : 'http://localhost:5050',
      redisConfig: {
        port: process.env.ACTIVITY_LOG_COLLECTOR_REDIS_PORT ? process.env.ACTIVITY_LOG_COLLECTOR_REDIS_PORT : '6379',
        host: process.env.ACTIVITY_LOG_COLLECTOR_REDIS_HOST ? process.env.ACTIVITY_LOG_COLLECTOR_REDIS_HOST : 'localhost',
        scope: 'mojaloop'
      }
    }

    initServer(appConfig)

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

