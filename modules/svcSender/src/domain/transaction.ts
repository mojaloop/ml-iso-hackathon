import {
  ApiServerError,
  XML,
  XSD
} from '@mojaloop-iso-hackathon/lib-shared'
import { ApiQuoteResponse, ApiTransferResponse } from "./api"
import { camt003 } from "../xml/camt003"
import {v4 as uuid} from 'uuid'
import { JSONPath } from 'jsonpath-plus'
import { InitiatingParty, pain001, Quote } from '../xml/pain001'
import { GlsLookupResponse, LOOKUP_RESPONSE_JPATHS } from './gls'
import { MojaQuoteResponse, MojaTransferResponse } from './moja'

interface Result<ResponseType> {
  success:  (response: ResponseType) => void,
  fail: (response: Error) => void
}

export class Transaction {

  public readonly id: string

  constructor () {
    this.id = uuid()
  }

  private _lookupResult: GlsLookupResponse = {
    digitalFinancialServiceProviderId: "",
    financialInstitutionId: "",
    financialInstitutionIdType: "",
    financialInstitutionName: ""
  }

  private _quoteResponse?: MojaTransferResponse
  private _quoteResultHandler?: Result<ApiQuoteResponse>
  private _transferResultHandler?: Result<ApiTransferResponse>

  public async lookup(msisdn: string): Promise<GlsLookupResponse> {

    //Construct XML
    const requestMessage = camt003(uuid(), new Date(), msisdn)

    // TODO call GLS for MSISDN info
    const responseMessage = `<?xml version="1.0" encoding="utf-8"?>
    <!-- PUT /parties/MSISDN/(+250)788301607 -->
    <Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:camt.004.001.08">
      <RtrAcct>
        <MsgHdr>
          <MsgId>a2c5e594-973f-45be-b138-987934156db3</MsgId>
          <CreDtTm>2020-05-14T15:07:38.6875000+03:00</CreDtTm>
          <OrgnlBizQry>
            <MsgId>575b3623-5adf-4752-8da9-a159a179ec9f</MsgId>
          </OrgnlBizQry>
        </MsgHdr>
        <RptOrErr>
          <AcctRpt>
            <AcctId>
              <Othr>
                <Nm>dfsp.username.5678</Nm>
                <SchmeNm>BBAN</SchmeNm>
              </Othr>
            </AcctId>
            <AcctOrErr>
              <Acct>
                <Svcr>
                  <FinInstnId>
                    <BICFI>EQBLRWRWXXX</BICFI>
                    <Nm>EQUITY BANK RWANDA LIMITED</Nm>
                  </FinInstnId>
                </Svcr>
              </Acct>
            </AcctOrErr>
          </AcctRpt>
        </RptOrErr>
      </RtrAcct>
    </Document>`

    const validationResults = XSD.validate("", responseMessage)
    if (validationResults != null) {
      throw new Error("Invalid XML response" + validationResults.join("\n"))
    }

    // Find data from request message
    const json = XML.jsonify(responseMessage, true)

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

  public async quote(initiatingParty: InitiatingParty, quote: Quote): Promise<ApiQuoteResponse> {
    if(this._quoteResultHandler) {
        throw new Error("Can't call 'agreement' more than once.")
    }

    //Construct XML
    const requestMessage = pain001(uuid(), new Date(), initiatingParty, quote, this.id)

    // TODO call Mojabank
    //const response = await 

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

    // TODO call Mojabank
    

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
      return
    }
    this._transferResultHandler.success(response)
  }

}