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
  XML
  // ISO20022
} from '@mojaloop-iso-hackathon/lib-shared'
import { MojaloopRequests, Logger } from '@mojaloop/sdk-standard-components'
import { v4 as uuidv4 } from 'uuid'
import { JSONPath } from 'jsonpath-plus'
import got from 'got'
import { createRedisService, Quote, RedisService } from '../services/redis'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const pckg = require('../../package.json')

type PutPartiesBody = {
  party: {
    partyIdInfo: {
      partyIdType: string,
      partyIdentifier: string,
      fspId: string
    },
    name: string,
    personalInfo: {
      complexName: {
        firstName: string
        middleName: string
        lastName: string
      }
    }
  }
}

type PutQuotesBody = {
  transferAmount: {
    amount: string,
    currency: string
  },
  expiration: string
  ilpPacket: string
  condition: string
}

export class Server {
  protected _config: any
  protected _logger: ILogger
  protected _metrics: IMetricsFactory
  protected _apiServer: ApiServer
  protected _redis: RedisService
  protected _mojaClient: MojaloopRequests

  constructor (appConfig: any, logger: ILogger, metrics: IMetricsFactory) {
    this._config = appConfig
    this._logger = logger
    this._metrics = metrics

    const apiServerOptions: TApiServerOptions = {
      host: this._config.api.host,
      port: this._config.api.port
    }

    this._apiServer = new ApiServer(apiServerOptions, this._logger)
    this._redis = createRedisService(appConfig.redisUrl)
    this._mojaClient = new MojaloopRequests({ dfspId: 'mojabank', logger: new Logger.Logger(), jwsSign: false, tls: { mutualTLS: { enabled: false }, creds: { ca: "", cert: "" } }, peerEndpoint: this._config.peerEndpoints.mojaloop })
  }

  async init (): Promise<void> {
    await this._registerRoutes()

    await this._apiServer.init()
  }

  async destroy (): Promise<void> {
    await this._apiServer.destroy()
  }

  private async _registerRoutes (): Promise<void> {
    await this._apiServer.get('/healthz', this._getHealth.bind(this))

    await this._apiServer.get('/metrics', this._getMetrics.bind(this))

    // Register SWIFT routes
    await this._apiServer.post('/quotes', this._swiftQuoteHandler.bind(this))
    await this._apiServer.post('/transfers', this._swiftTransferHandler.bind(this))

    // Register Mojaloop routes
    await this._apiServer.put('/parties/MSISDN/:msisdn', this._partiesResponseHandler.bind(this))
    await this._apiServer.put('/quotes/:id', this._quoteResponseHandler.bind(this))
    await this._apiServer.put('/transfers/:id', this._transferResponseHandler.bind(this))
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

  private async _swiftQuoteHandler (request: any, reply: any): Promise<void> {
    this._logger.debug(`request.body=${JSON.stringify(request.body)}`)

    const pmtId = JSONPath({ path: '$..CdtTrfTxInf.PmtId', json: request.body })
    const transactionId = pmtId?.[0]

    const pmtInfId = JSONPath({ path: '$..PmtInf.PmtInfId', json: request.body })
    const quoteId = pmtInfId?.[0]

    const instdAmt = JSONPath({ path: '$..CdtTrfTxInf.Amt.InstdAmt', json: request.body })
    const amtObject = instdAmt?.[0]
    const amount = amtObject['#text']
    const currency = amtObject?.attr?.Ccy

    const dbtrMobNb = JSONPath({ path: '$..Dbtr.CtctDtls.MobNb', json: request.body })
    const payerMsisdn = dbtrMobNb?.[0]
    
    const crdtrMobNb = JSONPath({ path: '$..Cdtr.CtctDtls.MobNb', json: request.body })
    const payeeMsisdn = crdtrMobNb?.[0]

    const dbtrBicfi = JSONPath({ path: '$..Dbtr.DbtrAgt.FinInstnId.BICFI', json: request.body })
    const payerFspId = dbtrBicfi?.[0]

    const quote: Quote = {
      amount,
      currency,
      payerMsisdn,
      payerFspId,
      payeeMsisdn,
      payeeFspId: '',
      quoteId,
      transactionId,
      condition: '',
      ilpPacket: ''
    }
    this._logger.debug(`storing quote info=${JSON.stringify(quote)}`)
    await this._redis.setQuote(quote)
    await this._redis.associatePayeeMsisdnToQuote(quote.payeeMsisdn, quote.quoteId)
    await this._mojaClient.getParties('MSISDN', payeeMsisdn)

    return reply.code(200).send(JSON.stringify({}))
  }

  private async _partiesResponseHandler (request: any, reply: any): Promise<void> {
    const payload = request.body as PutPartiesBody
    this._logger.debug(`parties response=${JSON.stringify(payload)}`)

    // find corresponding swift quote request
    const payerMsisdn = request.params.msisdn
    const quote = await this._redis.getQuoteForMsisdn(payerMsisdn)
    if (quote) {
      // send post quotes to ttk
      quote.payeeFspId = payload.party.partyIdInfo.fspId
      await this._redis.setQuote(quote)
      
      await this._mojaClient.postQuotes({
        transactionId: quote.transactionId,
        quoteId: quote.quoteId,
        payee: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: quote.payeeMsisdn
          }
        },
        payer: {
          partyIdType: 'MSISDN',
          partyIdentifier: quote.payerMsisdn,
          fspId: payload.party.partyIdInfo.fspId
        },
        amountType: 'SEND',
        amount: {
          currency: quote.currency,
          amount: quote.amount
        },
        transactionType: {
          scenario: 'TRANSFER',
          initiator: 'PAYER',
          initiatorType: 'CONSUMER'
        }
      }, payload.party.partyIdInfo.fspId)
    } else {
      this._logger.error(`No swift pain.001 found for msisdn=${payerMsisdn}`)
    }

    return reply.code(200).send("")
  }

  private async _quoteResponseHandler (request: any, reply: any): Promise<void> {
    // find quote
    const payload = request.body as PutQuotesBody
    const quoteId = request.params.id
    const quote = await this._redis.getQuote(quoteId)

    if (quote) {
      // store condition
      quote.condition = payload.condition
      quote.ilpPacket = payload.ilpPacket

      // transform to pain 013
      const pain013 = {
        Document: {
          attr: {
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            xmlns: 'urn:iso:std:iso:20022:tech:xsd:camt.004.001.08'
          },
          CdtrPmtActvtnReq: {
            GrpHdr: {
              MsgId: uuidv4(),
              CreDtTm: (new Date()).toISOString(),
              NbOfTxs: 1
            },
            PmtInf: {
              PmtInfId: quote.quoteId,
              PmtMtd: 'TRF',
              ReqdExctnDt: (new Date()).toISOString(),
              SvcLvl: {
                Cd: "SDVA"
              },
              Dbtr: {
                CtctDtls: {
                  MobNb: quote.payerMsisdn
                },
                DbtrAgt: {
                  FinInstnId: {
                    BICFI: quote.payerFspId
                  }
                }
              },
              ChrgBr: 'DEBT',
              Condtn: quote.condition,
              CdtTrfTxInf: {
                PmtId: "", // is this the transaction id?
                amt: {
                  '#text': payload.transferAmount.amount,
                  'Ccy': payload.transferAmount.currency
                },
                CrdtrAgt: {
                  FinInstnId: {
                    BICFI: quote.payeeFspId
                  }
                },
                Crdtr: {
                  CtctDtls: {
                    MobNb: quote.payeeMsisdn
                  }
                }
              }
            }
          }
        }
      }
      
      // send to swift peer
      console.log(XML.fromJson(pain013))
      await got.put(`${this._config.peerEndpoints.swift}/quotes`, {
        body: XML.fromJson(payload),
        headers: {
          'content-type': 'application/xml'
        }
      })
    } else {
      this._logger.error(`No quote found for Mojaloop quote response. quoteId=${quoteId}`)
    }
    
    return reply.code(200).send("")
  }

  private async _swiftTransferHandler (request: any, reply: any): Promise<void> {
    // TODO
    return reply.code(201).send(JSON.stringify({}))
  }

  private async _transferResponseHandler (request: any, reply: any): Promise<void> {
    // TODO
    return reply.code(201).send("")
  }
}
