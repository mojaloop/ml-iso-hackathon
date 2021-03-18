import { GlsLookupResponse } from "./gls"
import { MojaQuoteResponse } from "./moja"

export interface ApiQuoteRequest {
  msisdn: string,
  amount: string,
  currency: string,
}

export const API_QUOTE_REQUEST_SCHEMA = {
  body: {
    type: 'object',
    properties: {
      msisdn: {
        type: 'string'
      },
      amount: {
        type: 'string'
      },
      currency: {
        type: 'string'
      }
    }
  }
}

export interface ApiQuoteResponse extends MojaQuoteResponse {
  
}

export interface ApiTransferRequest {
  transactionId: string
}

export const API_TRANSFER_REQUEST_SCHEMA = {
  body: {
    type: 'object',
    properties: {
      transactionId: {
        type: 'string'
      }
    }
  }
}

export interface ApiTransferResponse {
  
}



