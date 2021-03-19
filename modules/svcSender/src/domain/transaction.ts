import got from 'got'
import {
  ApiServerError,
  ILogger,
  RedisPubSub,
  TPublishEvent,
  TRedisPubSubOptions,
  XML,
  XSD
} from '@mojaloop-iso-hackathon/lib-shared'
import { ApiQuoteResponse, ApiTransferResponse } from "./api"
import { camt003 } from "../xml/camt003"
import {v4 as uuid} from 'uuid'
import { JSONPath } from 'jsonpath-plus'
import { pain001, Quote } from '../xml/pain001'
import { GlsLookupResponse, LOOKUP_RESPONSE_JPATHS } from './gls'
import { MojaQuoteResponse, MojaTransferResponse } from './moja'
import { Participant } from '../xml/common'
import { pacs008, Transfer } from '../xml/pacs.008'

interface Result<ResponseType> {
  success:  (response: ResponseType) => void,
  fail: (response: Error) => void
}

export class Transaction {

  public readonly id: string

  private _config: any
  private _activityService: RedisPubSub
  private _logger: ILogger

  constructor (config: any, logger: ILogger, activityService: RedisPubSub) {
    this.id = uuid()
    this._config = config
    this._logger = logger

    const activityServiceOptions: TRedisPubSubOptions = {
      host: this._config.activityService.host,
      port: this._config.activityService.port
    }
    this._activityService = activityService
  }

  private _receivingPartyMsisdn: string
  private _lookupResult: GlsLookupResponse = {
    digitalFinancialServiceProviderId: "",
    financialInstitutionId: "",
    financialInstitutionIdType: "",
    financialInstitutionName: ""
  }

  private _quoteResponse?: MojaQuoteResponse
  private _quoteResultHandler?: Result<ApiQuoteResponse>
  private _transferResultHandler?: Result<ApiTransferResponse>

  public async lookup(msisdn: string): Promise<GlsLookupResponse> {

    this._receivingPartyMsisdn = msisdn

    //Construct XML
    const requestMessage = camt003({ messageId: uuid(), creationDateTime: new Date()}, msisdn )

    // TODO: This is already handled by the onSend hook on the ApiServer. Need to re-work this later!
    const parsedXmlResponse: string = requestMessage
    this._logger.debug(`Server::txLookup - parsedXmlResponse - ${parsedXmlResponse}`)
    if (this._config.activityEvents.isEnabled === true) {
      // Publish Activity Egress Event

      const egressActivityEvent: TPublishEvent = {
        fromComponent: this._config.activityEvents.ISOSenderComponentName,
        toComponent: this._config.activityEvents.GalsComponentName,
        xmlData: parsedXmlResponse
      }

      await this._activityService.publish(this._config.activityEvents.SenderEgress, egressActivityEvent)
    }

    const response = await got.post(`${this._config.peerEndpoints.gls}/v1/participants`, {
      headers: {
        'content-type': 'application/xml'
      },
      body: requestMessage
    })

    const responseMessage = response.body

    console.log(`TrxId=${this.id}. Got lookup response from GLS ${responseMessage}`)

    // const validationResults = XSD.validate(this._config.xsd.camt004, responseMessage)
    // if (validationResults != null) {
    //   throw new Error("Invalid XML response" + validationResults.join("\n"))
    // }

    // // Find data from request message
    // const json = XML.jsonify(responseMessage, true)

    const json = JSON.parse(responseMessage)

    Object.keys(LOOKUP_RESPONSE_JPATHS).map((key: string) => {
      const path = LOOKUP_RESPONSE_JPATHS[key as keyof GlsLookupResponse]
      const jsonPathResult = JSONPath({ path, json})
      const value : string | undefined = (jsonPathResult.length > 0) ? jsonPathResult[0] : undefined
      if (value === undefined) {
        throw new Error(`No value found in response at path ${path}`)
      }
      this._lookupResult[key as keyof GlsLookupResponse] = value
    })
    
    return this._lookupResult

  }

  public async quote(initiatingParty: Participant, amount: string, currency: string): Promise<ApiQuoteResponse> {
    if(this._quoteResultHandler) {
        throw new Error("Can't call 'agreement' more than once.")
    }
    const quote: Quote = {
      id: uuid(),
      transactionId: this.id,
      receivingParty: {
        msisdn: this._receivingPartyMsisdn
      },
      sendingParticipant: initiatingParty,
      sendAmount: amount,
      sendCurrency: currency
    }

    //Construct XML
    const requestMessage = pain001({ messageId: uuid(), creationDateTime: new Date(), initiatingParty}, quote)
    // TODO: This is already handled by the onSend hook on the ApiServer. Need to re-work this later!
    const parsedXmlResponse: string = requestMessage
    this._logger.debug(`Server::txQuote - parsedXmlResponse - ${parsedXmlResponse}`)
    if (this._config.activityEvents.isEnabled === true) {
      // Publish Activity Egress Event

      const egressActivityEvent: TPublishEvent = {
        fromComponent: this._config.activityEvents.ISOSenderComponentName,
        toComponent: this._config.activityEvents.MBComponentName,
        xmlData: parsedXmlResponse
      }

      await this._activityService.publish(this._config.activityEvents.SenderEgress, egressActivityEvent)
    }

    // call Mojabank
    const response = await got.post(`${this._config.peerEndpoints.mojabank}/quotes`, {
      headers: {
        'content-type': 'application/xml'
      },
      body: requestMessage
    })
    if(response.statusCode !== 202) {
      throw new Error(`Invalid response to quote request: ${response.statusCode} ${response.statusMessage}`)
    }

    return new Promise((success: (response: ApiQuoteResponse) => void, fail: (response: Error) => void ) => {
      this._quoteResultHandler = {
        success, fail
      }
    })

  }

  public async transfer() {

    if(!this._quoteResponse) {
      throw new Error("Can't call 'transfer' before we have a quote response")
    }

    if(this._transferResultHandler) {
      throw new Error("Can't call 'transfer' more than once.")
    }

    const transfer: Transfer = {
      id: uuid(),
      condition: this._quoteResponse.transferCondition,
      receiveAmount: this._quoteResponse.sendAmount,
      receiveCurrency: this._quoteResponse.sendCurrency,
      receivingParticipant: {
        bic: this._quoteResponse.receivingParticipantBic,
        name: this._quoteResponse.receivingParticipantName
      },
      receivingParty: {
        msisdn: this._quoteResponse.receivingPartyMsisdn
      },
      sendingParticipant: {
        bic: this._quoteResponse.sendingParticipantBic,
        name: this._quoteResponse.sendingParticipantName
      },
      sendingParty: {
        msisdn: this._quoteResponse.sendingPartyMsisdn
      },
      transactionId: this._quoteResponse.transactionId
    }

    //Construct XML
    const requestMessage = pacs008({ messageId: uuid(), creationDateTime: new Date()}, transfer)
    // TODO: This is already handled by the onSend hook on the ApiServer. Need to re-work this later!
    const parsedXmlResponse: string = requestMessage
    this._logger.debug(`Server::txTransfer - parsedXmlResponse - ${parsedXmlResponse}`)
    if (this._config.activityEvents.isEnabled === true) {
      // Publish Activity Egress Event

      const egressActivityEvent: TPublishEvent = {
        fromComponent: this._config.activityEvents.ISOSenderComponentName,
        toComponent: this._config.activityEvents.MBComponentName,
        xmlData: parsedXmlResponse
      }

      await this._activityService.publish(this._config.activityEvents.SenderEgress, egressActivityEvent)
    }

    // call Mojabank
    const response = await got.post(`${this._config.peerEndpoints.mojabank}/transfers`, {
      headers: {
        'content-type': 'application/xml'
      },
      body: requestMessage
    })
    
    if(response.statusCode !== 202) {
      throw new Error(`Invalid response to transfer request: ${response.statusCode} ${response.statusMessage}`)
    }

    return new Promise((success: (response: ApiTransferResponse) => void, fail: (response: Error) => void ) => {
      this._transferResultHandler = {
        success, fail
      }
    })

  }

  public handleQuoteResponse(response: MojaQuoteResponse) {
    if(!this._quoteResultHandler) {
      throw new Error('Received quote response but no request was sent.')
    }

    this._quoteResponse = response
    // TODO Right now the Moja Quote Response is simply used as the API Quote Response, maybe that's a bad idea?
    this._quoteResultHandler.success(response)
  }

  public handleTransferResponse(response: ApiTransferResponse) {
    if(!this._transferResultHandler) {
      throw new Error('Received transfer response but no request was sent.')
    }
    this._transferResultHandler.success(response)
  }

}