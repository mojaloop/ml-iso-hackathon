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
  TApiXmlRequest,
  TApiXmlReply,
  XSD,
  RouteXmlInterface
} from '@mojaloop-iso-hackathon/lib-shared'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'node:http'
import { ApiQuoteRequest, ApiQuoteResponse, ApiTransferResponse, ApiTransferRequest, API_QUOTE_REQUEST_SCHEMA, API_TRANSFER_REQUEST_SCHEMA } from '../domain/api'
import { Transaction } from '../domain/transaction'
import { InitiatingParty, Quote } from '../xml/pain001'
import {v4 as uuid} from 'uuid'
import { JSONPath } from 'jsonpath-plus'
import { MojaQuoteResponse, MojaTransferResponse, MOJA_QUOTE_RESPONSE_JPATHS, MOJA_TRANSFER_RESPONSE_JPATHS } from '../domain/moja'

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
  protected _transactions: Map<string, Transaction> = new Map<string, Transaction>()

  constructor (appConfig: any, logger: ILogger, metrics: IMetricsFactory) {
    this._config = appConfig
    this._logger = logger
    this._metrics = metrics
  }

  async init (): Promise<void> {
    const apiServerOptions: TApiServerOptions = {
      host: this._config.api.host,
      port: this._config.api.port
    }

    this._apiServer = new ApiServer(apiServerOptions, this._logger)

    await this._registerRoutes()

    await this._apiServer.init()
  }

  async destroy (): Promise<void> {
    await this._apiServer!.destroy()
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
    await this._apiServer!.put('/callbacks/transfers', this._handlerTransferResponseCallback.bind(this))

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

    //Create a new Transaction
    const {msisdn, currency, amount} = request.body
    const tx = new Transaction()
    this._transactions.set(tx.id, tx)

    const lookupResult = await tx.lookup(msisdn)

    // TODO Get these values from somewhere
    const initiatingParty: InitiatingParty = {
      name: 'LAKE CITY BANK',
      bic: 'LAKCUS33'
    }

    const quote: Quote = {
      id: uuid(),
      payeeMsisdn: msisdn,
      sendAmount: amount,
      sendCurrency: currency
    }

    // Perform quote request
    const quoteResult = await tx.quote(initiatingParty, quote)

    return reply
      .code(200)
      .send(quoteResult)
  }

  private async _submitTransfer (request: FastifyRequest<TransferTypes, Server, IncomingMessage>, reply: FastifyReply<Server, IncomingMessage, ServerResponse, TransferTypes, unknown>): Promise<ApiTransferResponse> {

    // TODO 

    const tx = this._transactions.get(request.body.transactionId)
    if(tx === undefined) {
      throw new Error(`Request to execute transfer for unknown tx id: ${request.body.transactionId}`)
    }

    const transferResult = await tx.transfer()

    return reply
      .code(200)
      .send(transferResult)
  }

  private async _handleQuoteResponseCallback (request: TApiXmlRequest, reply: TApiXmlReply): Promise<any> {

    // TODO - Skipping validation for now
    // const validationResults = XSD.validate('', request.body!.raw as string)
    // if (validationResults != null) {
    //   throw new Error(JSON.stringify(validationResults))
    // }
    // let json = request.body!.parsed

    /**
     * TEST DATA
     */
     const requestXml = `<?xml version="1.0" encoding="utf-8"?>
     <!-- PUT /quotes/7d04b391-0c90-4ad4-9ba8-46232b04e18a -->
     <Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.013.001.06">
         <CdtrPmtActvtnReq>
             <GrpHdr>
                 <MsgId>ca7797b6-c3be-4bfd-a101-904da8b75207</MsgId>
                 <CreDtTm>2021-02-10T15:07:38.6875000+03:00</CreDtTm>
                 <NbOfTxs>1</NbOfTxs>
                 <InitgPty>
                     <Nm>EQUITY BANK RWANDA LIMITED</Nm>
                     <Id>
                         <AnyBIC>EQBLRWRWXXX</AnyBIC>
                     </Id>
                 </InitgPty>
             </GrpHdr>
             <PmtInf>
                 <PmtInfId>7e2599df-80a1-4f6e-b381-99536c4d2691</PmtInfId>
                 <PmtMtd>TRF</PmtMtd>
                 <ReqdExctnDt>2021-02-10</ReqdExctnDt>
                 <SvcLvl>
                     <Cd>SDVA</Cd>
                 </SvcLvl>
                 <Dbtr>
                     <CtctDtls>
                         <MobNb>+1-574-265-1752</MobNb>	                    <!-- Debtor is identified by a mobile number -->
                     </CtctDtls>
                 </Dbtr>
                 <DbtrAgt>
                   <FinInstnId>
                     <BICFI>LAKCUS33</BICFI>
                     <Nm>LAKE CITY BANK</Nm>	            <!-- Included for information - not required by ISO or Moja -->
                   </FinInstnId>
                 </DbtrAgt>
                 <ChrgBr>DEBT</ChrgBr>                                       <!-- Amount is the amount the creditor will receive... -->
                 <Cndtn>fH9pAYDQbmoZLPbvv3CSW2RfjU4jvM4ApG_fqGnR7Xs</Cndtn>  <!--    The condition for the quote response           -->
                 <CdtTrfTxInf>
                     <PmtId>                                                 <!-- This is the transaction ID -->
                         <EndToEndId>7e2599df-80a1-4f6e-b381-99536c4d2691</EndToEndId>
                     </PmtId>
                     <Amt>
                         <InstdAmt Ccy="RWF">20200</InstdAmt>                <!-- Amount to send -->
                     </Amt>
                     <CdtrAgt>
                         <FinInstnId>
                             <BICFI>EQBLRWRWXXX</BICFI>
                             <Nm>EQUITY BANK RWANDA LIMITED</Nm>	            <!-- Creditor's DFSP -->
                         </FinInstnId>
                    </CdtrAgt>
                    <Cdtr>
                         <CtctDtls>
                             <MobNb>+250-70610388</MobNb>	                    <!-- Debtor is identified by a mobile number -->
                         </CtctDtls>
                    </Cdtr>
                 </CdtTrfTxInf>
             </PmtInf>
         </CdtrPmtActvtnReq>
     </Document>`
     let json = {}
     
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

    reply.code(200).send()
  }

  private async _handlerTransferResponseCallback (request: TApiXmlRequest, reply: TApiXmlReply): Promise<any> {

    // TODO - Skipping validation for now
    // const validationResults = XSD.validate('', request.body!.raw as string)
    // if (validationResults != null) {
    //   throw new Error(JSON.stringify(validationResults))
    // }
    // let json = request.body!.parsed

    /**
     * TEST DATA
     */
     const requestXml = ``
     let json = {}
     
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

    reply.code(200).send()
  }



}
