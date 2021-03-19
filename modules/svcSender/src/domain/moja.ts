export interface MojaQuoteResponse {
  initiatingPartyName: string,
  initiatingPartyBic: string,
  quoteId: string,
  sendingPartyMsisdn: string,
  sendingParticipantBic: string,
  sendingParticipantName: string,
  transferCondition: string,
  transactionId: string,
  sendAmount: string,
  sendCurrency: string,
  receivingParticipantName: string,
  receivingParticipantBic: string,
  receivingPartyMsisdn: string,
}

export const MOJA_QUOTE_RESPONSE_JPATHS : MojaQuoteResponse = {
  initiatingPartyName: 'Document.CdtrPmtActvtnReq.GrpHdr.InitgPty.Nm',
  initiatingPartyBic: 'Document.CdtrPmtActvtnReq.GrpHdr.InitgPty.Id.OrgId.AnyBIC',
  quoteId: 'Document.CdtrPmtActvtnReq.PmtInf.PmtInfId',
  sendingPartyMsisdn: 'Document.CdtrPmtActvtnReq.PmtInf.Dbtr.CtctDtls.MobNb',
  sendingParticipantBic: 'Document.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.BICFI',
  sendingParticipantName: 'Document.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.Nm',
  transferCondition: 'Document.CdtrPmtActvtnReq.PmtInf.Cndtn.Condition',
  transactionId: 'Document.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId',
  sendAmount: 'Document.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.#text',
  sendCurrency: 'Document.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.attr.Ccy',
  receivingParticipantName: 'Document.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.Nm',
  receivingParticipantBic: 'Document.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.BICFI',
  receivingPartyMsisdn: 'Document.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Cdtr.CtctDtls.MobNb',
}

export interface MojaTransferResponse {
  transactionId: string
}

export const MOJA_TRANSFER_RESPONSE_JPATHS : MojaTransferResponse = {
  transactionId: ''
}