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

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
******/

'use strict'
import { ILogger } from './ilogger'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const NRP = require('node-redis-pubsub')

export type TRedisPubSubOptions = {
  host?: string
  port?: number
  scope?: string
}

export type TPublishEvent = {
  fromComponent: string
  toComponent: string
  xmlData?: string
  description?: string
  status?: string
  isResponse?: boolean
}

export class RedisPubSub {
  private readonly _logger: ILogger
  private readonly _options: TRedisPubSubOptions
  private _clientOptions: TRedisPubSubOptions
  private _nrpClient: any

  constructor (opts: TRedisPubSubOptions, logger: ILogger) {
    this._logger = logger
    this._options = opts
  }

  async init (): Promise<void> {
    const defaultServerOptions: TRedisPubSubOptions = {
      host: 'localhost',
      port: 6379,
      scope: 'mojaloop'
    }

    // copy default config
    this._clientOptions = { ...defaultServerOptions }
    // override any values with the options given to the client
    Object.assign(this._clientOptions, this._options)

    this._nrpClient = new NRP(this._clientOptions)

    this._logger.isInfoEnabled() && this._logger.info(`RedisPubSub::init - opts: ${JSON.stringify(this._clientOptions)}`)
  }

  async publish (topic: string, event: TPublishEvent): Promise<void> {
    this._logger.isDebugEnabled() && this._logger.debug(`RedisPubSub::publish(topic: ${topic}, event: ${JSON.stringify(event)})`)
    this._nrpClient.emit(topic, event)
  }

  async destroy (): Promise<void> {
    await this._nrpClient.quit()
  }
}
