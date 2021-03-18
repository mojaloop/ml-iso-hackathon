/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Coil
 - ..

 * Crosslake
 - ..

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
******/

'use strict'

import {
  ILogger,
  MojaLogger,
  Metrics,
  TMetricOptionsType,
  getEnvValueOrDefault,
  getEnvIntegerOrDefault,
  getEnvBoolOrDefault
} from '@mojaloop-iso-hackathon/lib-shared'
import * as dotenv from 'dotenv'
import { Command } from 'commander'
import { resolve as Resolve } from 'path'
import { Server } from './api'

// /* eslint-disable-next-line @typescript-eslint/no-var-requires */
// const pckg = require('../package.json')

const Program = new Command()
Program
  .version('0.1')
  .description('CLI example')
Program.command('api')
  .alias('h')
  .description('Start hello example') // command description
  .option('-c, --config [configFilePath]', '.env config file')
  // .option('--hello1', 'Start hello1 example') // TODO: change this to the proper name
  // .option('--hello2', 'Start hello2 example')

  // function to execute when command is uses
  .action(async (args: any): Promise<void> => {
    // #env file
    const configFilePath = args.config
    const dotenvConfig: any = {
      debug: true
    }
    if (configFilePath != null) {
      dotenvConfig.path = Resolve(process.cwd(), configFilePath)
    }
    dotenv.config(dotenvConfig)

    // # setup application config
    const appConfig = {
      metrics: {
        prefix: getEnvValueOrDefault('METRIC_PREFIX', 'hackiso_') as string
      },
      api: {
        host: getEnvValueOrDefault('MB_API_HOST', '0.0.0.0') as string,
        port: getEnvIntegerOrDefault('MB_API_PORT', 3003) as number
      },
      peerEndpoints: {
        mojaloop: getEnvValueOrDefault('MB_MOJALOOP_PEER_ENDPOINT', 'http://localhost:15000') as string,
        swift: getEnvValueOrDefault('MB_SWIFT_PEER_ENDPOINT', 'http://swift:3000') as string
      },
      activityService: {
        host: getEnvValueOrDefault('ACTIVITY_SERVER_HOST', null),
        port: getEnvValueOrDefault('ACTIVITY_SERVER_PORT', null)
      },
      activityEvents: {
        isEnabled: getEnvBoolOrDefault('ACTIVITY_MOJABANK_COMPONENT_EVENTS_ENABLED'),
        ISOSenderComponentName: getEnvValueOrDefault('ACTIVITY_SENDER_COMPONENT_NAME', null),
        MBComponentName: getEnvValueOrDefault('ACTIVITY_MOJABANK_COMPONENT_NAME', null),
        MBEgress: getEnvValueOrDefault('ACTIVITY_MOJABANK_EVENT_EGRESS', null)
      },
      redisUrl: getEnvValueOrDefault('MB_REDIS_URL', 'redis://localhost:6379') as string,
    }

    // Instantiate logger
    const logger: ILogger = new MojaLogger()

    // logger.isDebugEnabled() && logger.debug(`appConfig loaded: ${JSON.stringify(appConfig)}`)

    // Instantiate metrics factory
    const metricsConfig: TMetricOptionsType = {
      timeout: 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
      prefix: appConfig.metrics.prefix, // Set prefix for all defined metrics names
      defaultLabels: { // Set default labels that will be applied to all metrics
        serviceName: 'MojaBank'
      }
    }

    const metrics = new Metrics(metricsConfig)
    await metrics.init()

    logger.isDebugEnabled() && logger.debug(`Loaded config=${JSON.stringify(appConfig)}`)

    // Instantiate Server
    const server = new Server(appConfig, logger, metrics)

    await server.init()

    // lets clean up
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    const killProcess = async (): Promise<void> => {
      logger.isInfoEnabled() && logger.info('Exiting process...')

      // Insert cleanup code here
      logger.isInfoEnabled() && logger.info('Destroying API Server...')
      await server.destroy()

      logger.isInfoEnabled() && logger.info('Exit complete!')
      process.exit(0)
    }

    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    process.on('SIGINT', killProcess)
  })

if (Array.isArray(process.argv) && process.argv.length > 2) {
  // parse command line vars
  Program.parse(process.argv)
} else {
  // display default help
  Program.help()
}
