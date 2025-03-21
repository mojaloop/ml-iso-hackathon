/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- ..

* Crosslake
- ..

* ModusBox
- Miguel de Barros <miguel.debarros@modusbox.com>
*****/

'use strict'

import {
  ILogger,
  IMetricsFactory,
  ApiServer,
  TApiServerOptions,
  TApiXmlRequest,
  TApiXmlReply,
  XSD,
  RouteXmlInterface,
  RedisPubSub,
  TRedisPubSubOptions,
  TPublishEvent
} from '@mojaloop-iso-hackathon/lib-shared'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'node:http'
import { ApiQuoteRequest, ApiQuoteResponse, ApiTransferResponse, ApiTransferRequest, API_QUOTE_REQUEST_SCHEMA, API_TRANSFER_REQUEST_SCHEMA } from '../domain/api'
import { Transaction } from '../domain/transaction'
import { Quote } from '../xml/pain001'
import {v4 as uuid} from 'uuid'
import { JSONPath } from 'jsonpath-plus'
import { MojaQuoteResponse, MojaTransferResponse, MOJA_QUOTE_RESPONSE_JPATHS, MOJA_TRANSFER_RESPONSE_JPATHS } from '../domain/moja'
import { Participant } from '../xml/common'
import { GlsLookupResponse } from '../domain/gls'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const PACKAGE = require('../../package.json')

//Fastify Endpoint Type Defs
type QuoteTypes = { Body: ApiQuoteRequest, Reply: ApiQuoteResponse }
type TransferTypes = { Body: ApiTransferRequest, Reply: ApiTransferResponse }

export class SenderServer {
  protected _config: any
  protected _logger: ILogger
  protected _metrics: IMetricsFactory
  protected _apiServer: ApiServer | undefined
  protected _activityService: RedisPubSub
  protected _transactions: Map<string, Transaction> = new Map<string, Transaction>()

  constructor (appConfig: any, logger: ILogger, metrics: IMetricsFactory) {
    this._config = appConfig
    this._logger = logger
    this._metrics = metrics
  }

  async init (): Promise<void> {
    // Init Activity Service
    const activityServiceOptions: TRedisPubSubOptions = {
      host: this._config.activityService.host,
      port: this._config.activityService.port
    }
    this._activityService = new RedisPubSub(activityServiceOptions, this._logger)

    await this._activityService.init()
    
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
  }

  private async _registerRoutes (): Promise<void> {
    await this._apiServer!.get('/health', this._getHealth.bind(this))
    await this._apiServer!.get('/metrics', this._getMetrics.bind(this))


    await this._apiServer!.route<QuoteTypes>({
      method: 'POST',
      url: '/api/quotes',
      schema: API_QUOTE_REQUEST_SCHEMA,
      handler: this._requestQuote.bind(this)
    })

    await this._apiServer!.route<TransferTypes>({
      method: 'POST',
      url: '/api/transfers',
      schema: API_TRANSFER_REQUEST_SCHEMA,
      handler: this._submitTransfer.bind(this)
    })

    await this._apiServer!.put<RouteXmlInterface>('/callbacks/quotes', this._handleQuoteResponseCallback.bind(this))
    await this._apiServer!.put<RouteXmlInterface>('/callbacks/transfers', this._handlerTransferResponseCallback.bind(this))

  }

  private async _getHealth (request: any, reply: any): Promise<any> {
    return {
      status: 'ok',
      version: PACKAGE.version,
      name: PACKAGE.name,
    }
  }

  private async _getMetrics (request: any, reply: any): Promise<string> {
    return await this._metrics.getMetricsForPrometheus()
  }

  private async _requestQuote (request: FastifyRequest<QuoteTypes, Server, IncomingMessage>, reply: FastifyReply<Server, IncomingMessage, ServerResponse, QuoteTypes, unknown>): Promise<ApiQuoteResponse> {
    let quoteResult: ApiQuoteResponse | undefined
    try {
      //Create a new Transaction
      const {msisdn, currency, amount} = request.body
      const tx = new Transaction(this._config, this._logger, this._activityService)
      this._transactions.set(tx.id, tx)

      const lookupResult = await tx.lookup(msisdn)

      // TODO Get these values from somewhere
      const initiatingParty: Participant = {
        name: 'LAKE CITY BANK',
        bic: 'LAKCUS33'
      }

      // Perform quote request
      quoteResult = await tx.quote(initiatingParty, amount, currency)
    } catch (err) {
      this._logger.error(err.stack)
      throw err
    }

    return reply
      .code(200)
      .send(quoteResult)
  }

  private async _submitTransfer (request: FastifyRequest<TransferTypes, Server, IncomingMessage>, reply: FastifyReply<Server, IncomingMessage, ServerResponse, TransferTypes, unknown>): Promise<ApiTransferResponse> {
    // TODO 
    let transferResult: ApiTransferResponse | undefined
    try {
      const tx = this._transactions.get(request.body.transactionId)
      if(tx === undefined) {
        throw new Error(`Request to execute transfer for unknown tx id: ${request.body.transactionId}`)
      }

      transferResult = await tx.transfer()
    } catch (err) {
      this._logger.error(err.stack)
      throw err
    }

    return reply
      .code(200)
      .send(transferResult)
  }

  private async _handleQuoteResponseCallback (request: TApiXmlRequest, reply: TApiXmlReply): Promise<any> {
    console.log('Handling quote response from MojaBank (pain013). raw body', request.body?.raw)

    await reply.code(200).send(JSON.stringify({}))

    try {
      const validationResults = XSD.validate(this._config.xsd.pain013, request.body!.raw as string)
      if (validationResults != null) {
        throw new Error(JSON.stringify(validationResults))
      }
      let json = request.body!.parsed
      
      const quoteResponse : MojaQuoteResponse = {
        initiatingPartyName: '',
        initiatingPartyBic: '',
        quoteId: '',
        sendingPartyMsisdn: '',
        sendingParticipantBic: '',
        sendingParticipantName: '',
        transferCondition: '',
        transactionId: '',
        sendAmount: '',
        sendCurrency: '',
        receivingParticipantName: '',
        receivingParticipantBic: '',
        receivingPartyName: '',
        receivingPartyMsisdn: '',
      }

      Object.keys(MOJA_QUOTE_RESPONSE_JPATHS).map((key: string) => {
        const path = MOJA_QUOTE_RESPONSE_JPATHS[key as keyof MojaQuoteResponse]
        const jsonPathResult = JSONPath({ path, json })
        const value : string | undefined = (jsonPathResult.length > 0) ? jsonPathResult[0] : undefined
        if (value === undefined) {
          throw new Error(`No value found in response at path ${path}`)
        }
        quoteResponse[key as keyof MojaQuoteResponse] = value
      })

      const tx = this._transactions.get(quoteResponse.transactionId)
      if(tx === undefined) {
        throw new Error(`Quote response received with unknown tx id: ${quoteResponse.transactionId}`)
      }

      await tx.handleQuoteResponse(quoteResponse)

      if (this._config.activityEvents.isEnabled === true) {
        // Publish Activity Egress Event

        const egressActivityEvent: TPublishEvent = {
          fromComponent: this._config.activityEvents.ISOSenderComponentName,
          toComponent: this._config.activityEvents.MBComponentName,
          // xmlData: '<?xml version="1.0" encoding="utf-8"?><Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.013.001.06"></Document>'
          description: '200',
          isResponse: true
        }

        await this._activityService.publish(this._config.activityEvents.SenderEgress, egressActivityEvent)
      }
    } catch (err) {
      this._logger.error(err.stack)
      throw err
    }
  }

  private async _handlerTransferResponseCallback (request: TApiXmlRequest, reply: TApiXmlReply): Promise<any> {
    console.log('Handling transfer response from MojaBank (pain002). raw body', request.body?.raw)

    await reply.code(200).send(JSON.stringify({}))
    
    try {
      const validationResults = XSD.validate(this._config.xsd.pain002, request.body!.raw as string)
      if (validationResults != null) {
        throw new Error(JSON.stringify(validationResults))
      }
      let json = request.body!.parsed
      
      const transferResponse : MojaTransferResponse = {
        transactionId: ''
      }

      Object.keys(MOJA_TRANSFER_RESPONSE_JPATHS).map((key: string) => {
        const path = MOJA_TRANSFER_RESPONSE_JPATHS[key as keyof MojaTransferResponse]
        const jsonPathResult = JSONPath({ path, json })
        const value : string | undefined = (jsonPathResult.length > 0) ? jsonPathResult[0] : undefined
        if (value === undefined) {
          throw new Error(`No value found in response at path ${path}`)
        }
        transferResponse[key as keyof MojaTransferResponse] = value
      })

      const tx = this._transactions.get(transferResponse.transactionId)
      if(tx === undefined) {
        throw new Error(`Transfer response received with unknown tx id: ${transferResponse.transactionId}`)
      }

      await tx.handleTransferResponse(transferResponse)

      if (this._config.activityEvents.isEnabled === true) {
        // Publish Activity Egress Event

        const egressActivityEvent: TPublishEvent = {
          fromComponent: this._config.activityEvents.ISOSenderComponentName,
          toComponent: this._config.activityEvents.MBComponentName,
          // xmlData: '<?xml version="1.0" encoding="utf-8"?><Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.013.001.06"></Document>'
          description: '200',
          isResponse: true
        }
        await this._activityService.publish(this._config.activityEvents.SenderEgress, egressActivityEvent)
      }
    } catch (err) {
      this._logger.error(err.stack)
      throw err
    }
  }
}
