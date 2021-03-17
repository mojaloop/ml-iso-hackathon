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
  IMetricsFactory,
  ApiServer,
  TApiServerOptions,
  ApiServerError,
  XML,
  XSD,
  ISO20022,
  RedisPubSub,
  TRedisPubSubOptions,
  TPublishEvent
} from '@mojaloop-iso-hackathon/lib-shared'
import { Accounts } from '../domain/accounts'
import { JSONPath } from 'jsonpath-plus'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const pckg = require('../../package.json')

export class Server {
  protected _config: any
  protected _logger: ILogger
  protected _metrics: IMetricsFactory
  protected _apiServer: ApiServer | undefined
  protected _accountsAgg: Accounts
  protected _activityService: RedisPubSub

  constructor (appConfig: any, logger: ILogger, metrics: IMetricsFactory) {
    this._config = appConfig
    this._logger = logger
    this._metrics = metrics
  }

  async init (): Promise<void> {
    // Init Account Aggregator
    this._accountsAgg = new Accounts(this._config.account.mapStringList, this._logger, this._metrics)

    // Init Activity Serverice

    const activityServiceOptions: TRedisPubSubOptions = {
      host: this._config.activityService.host,
      port: this._config.activityService.port
    }
    this._activityService = new RedisPubSub(activityServiceOptions, this._logger)

    await this._activityService.init()

    // Init API Server
    const apiServerOptions: TApiServerOptions = {
      host: this._config.api.host,
      port: this._config.api.port
    }

    this._apiServer = new ApiServer(apiServerOptions, this._logger)

    await this._registerRoutes()

    await this._apiServer.init()
  }

  async destroy (): Promise<void> {
    await this._apiServer?.destroy()
    await this._activityService?.destroy()
    // await this._accountsAgg?.destroy()
  }

  private async _registerRoutes (): Promise<void> {
    await this._apiServer!.get('/healthz', this._getHealth.bind(this))

    await this._apiServer!.get('/metrics', this._getMetrics.bind(this))

    // await this._apiServer!.post('/v1/account:get', this._cmdGetAccount.bind(this))
    await this._apiServer!.post('/v1/participants', this._cmdGetAccount.bind(this))
  }

  private async _getHealth (request: any, reply: any): Promise<any> {
    return {
      status: 'ok',
      version: pckg.version,
      name: pckg.name
    }
  }

  private async _getMetrics (request: any, reply: any): Promise<string> {
    return await this._metrics.getMetricsForPrometheus()
  }

  private async _cmdGetAccount (request: any, reply: any): Promise<void> {
    this._logger.debug(`Server::cmdGetAccount - request.body=${JSON.stringify(request.body)}`)

    try {
      // if (this._config.activityEvents.isEnabled === true) {
      //   // Publish Activity Ingress Event
      //   const ingressActivityEvent: TPublishEvent = {
      //     fromComponent: this._config.activityEvents.ISOSenderComponentName,
      //     toComponent: this._config.activityEvents.GALSComponentName,
      //     xmlData: request.body.raw
      //   }

      //   await this._activityService.publish(this._config.activityEvents.GALSIngress, ingressActivityEvent)
      // }

      // TODO: Correctly map errors to the appropriate XSD message
      let xmlResponse: any = {}

      const validateIngressResults = XSD.validate(this._config.xsd.camt003, request.body.raw)
      this._logger.debug(`Server::cmdGetAccount - validate Ingress Result - ${JSON.stringify(validateIngressResults)}`)
      if (validateIngressResults != null) {
        const err = new ApiServerError(JSON.stringify(Array.from(validateIngressResults)))
        err.statusCode = 400
        throw err
      }

      const requestPayload = request.body.parsed

      // Find data from request message
      const resMsgIdResult = JSONPath({ path: '$..MsgId', json: requestPayload })
      this._logger.debug(`Server::cmdGetAccount - resMsgId=${JSON.stringify(resMsgIdResult)}`)
      const resMsgId: string | undefined = (resMsgIdResult.length > 0) ? resMsgIdResult[0] : undefined

      const idResult = JSONPath({ path: '$..MobNb', json: requestPayload })
      this._logger.debug(`Server::cmdGetAccount - idResult=${JSON.stringify(idResult)}`)
      const id: string | undefined = (idResult.length > 0) ? idResult[0] : undefined

      // Validate data from request message
      if (resMsgId === undefined) {
        const err = new ApiServerError('MsgId is missing from request')
        err.statusCode = 400
        throw err
      }

      if (id === undefined) {
        const err = new ApiServerError('MobNb is missing from request')
        err.statusCode = 400
        throw err
      }

      // Retrieve Account information
      this._logger.debug(`Server::cmdGetAccount - Retreiving account for ID=${id}`)
      const account = await this._accountsAgg.getAccount(id)
      this._logger.debug(`Server::cmdGetAccount - Retreived account[${id}] for ID=${JSON.stringify(account)}`)

      if (account == null) {
        const err = new ApiServerError(`Account with id:${id} was not found`)
        err.statusCode = 404
        throw err
      }

      xmlResponse = ISO20022.Messages.Camt004(resMsgId, account.dfspId, account.type, account.finId, account.finName, null)

      // TODO: This is already handled by the onSend hook on the ApiServer. Need to re-work this later!
      const parsedXmlResponse: string = XML.fromJson(xmlResponse)
      this._logger.debug(`Server::cmdGetAccount - parsedXmlResponse - ${parsedXmlResponse}`)
      if (this._config.activityEvents.isEnabled === true) {
        // Publish Activity Egress Event

        const egressActivityEvent: TPublishEvent = {
          fromComponent: this._config.activityEvents.GALSComponentName,
          toComponent: this._config.activityEvents.ISOSenderComponentName,
          xmlData: parsedXmlResponse
        }

        await this._activityService.publish(this._config.activityEvents.GALSIngress, egressActivityEvent)
      }

      // TODO: Should this be handled by the onSend hook on the ApiServer? Need to re-work this later!
      const validateEgressResults = XSD.validate(this._config.xsd.camt004, parsedXmlResponse)
      this._logger.debug(`Server::cmdGetAccount - validate Egress Result - ${JSON.stringify(validateEgressResults)}`)
      if (validateEgressResults != null) {
        const err = new ApiServerError(`Response is not valid xml: ${JSON.stringify(Array.from(validateEgressResults))}`)
        err.statusCode = 400
        throw err
      }

      // return response
      return reply
        .code(200)
        .send(xmlResponse)
    } catch (error) {
      this._logger.error(error.stack)

      const parsedXmlError: string = XML.fromJson({
        error: {
          statusCode: error.statusCode,
          message: error.message,
          stack: error.stack
        }
      })

      this._logger.debug(`Server::cmdGetAccount - parsedXmlError - ${parsedXmlError}`)
      if (this._config.activityEvents.isEnabled === true) {
        // Publish Activity Egress Event
        const egressActivityEvent: TPublishEvent = {
          fromComponent: this._config.activityEvents.GALSComponentName,
          toComponent: this._config.activityEvents.ISOSenderComponentName,
          xmlData: parsedXmlError
        }

        await this._activityService.publish(this._config.activityEvents.GALSIngress, egressActivityEvent)
      }
      throw error
    }
  }
}
