export interface InitiatingParty {
  name: string,
  bic: string
}
export interface Quote {
  id: string,
  payeeMsisdn: string,
  sendAmount: string
  sendCurrency: string
}
export function pain001(messageId: string, creationDateTime: Date, initiatingParty: InitiatingParty, quote: Quote, transactionId: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- POST /quotes -->
<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.10">
    <CstmrCdtTrfInitn>
        <GrpHdr>
            <MsgId>${messageId}</MsgId>
            <CreDtTm>${creationDateTime.toISOString()}</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <InitgPty>
                <Nm>${initiatingParty.name}</Nm>
                <Id>
                    <OrgId>
                        <AnyBIC>${initiatingParty.bic}</AnyBIC>
                    </OrgId>
                </Id>
            </InitgPty>
        </GrpHdr>
        <PmtInf>
            <PmtInfId>${quote.id}</PmtInfId>
            <PmtMtd>TRF</PmtMtd>
            <ReqdExctnDt>
                <Dt>${new Date().toISOString().substr(0,10)}</Dt>
            </ReqdExctnDt>
            <Dbtr>
                <CtctDtls>
                    <MobNb>${quote.id}</MobNb>
                </CtctDtls>
            </Dbtr>
            <DbtrAcct>
                <Id>
                    <Othr>
                        <Id>NOTPROVIDED</Id>
                    </Othr>
                </Id>
            </DbtrAcct>
            <DbtrAgt>
                <FinInstnId>
                  <BICFI>${initiatingParty.bic}</BICFI>
                  <Nm>${initiatingParty.name}</Nm>
                </FinInstnId>
            </DbtrAgt>
            <ChrgBr>DEBT</ChrgBr>
            <CdtTrfTxInf>
                <PmtId>
                    <EndToEndId>${transactionId}</EndToEndId>
                </PmtId>
                <Amt>
                    <InstdAmt Ccy="${quote.sendCurrency}">${quote.sendAmount}</InstdAmt>
                </Amt>
                <Cdtr>
                    <CtctDtls>
                        <MobNb>${quote.payeeMsisdn}</MobNb>
                    </CtctDtls>
                </Cdtr>
            </CdtTrfTxInf>
        </PmtInf>
    </CstmrCdtTrfInitn>
</Document>`
}