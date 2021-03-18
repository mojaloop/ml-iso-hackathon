import { MessageHeaderWithInitiatingParty, Participant, Party } from "./common";

export interface Quote {
  id: string,
  transactionId: string
  sendAmount: string
  sendCurrency: string
  sendingParticipant: Participant
  receivingParty: Party
}
export function pain001(header: MessageHeaderWithInitiatingParty, quote: Quote): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.10">
    <CstmrCdtTrfInitn>
        <GrpHdr>
            <MsgId>${header.messageId}</MsgId>
            <CreDtTm>${header.creationDateTime.toISOString()}</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <InitgPty>
                <Nm>${header.initiatingParty.name}</Nm>
                <Id>
                    <OrgId>
                        <AnyBIC>${header.initiatingParty.bic}</AnyBIC>
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
                  <BICFI>${quote.sendingParticipant.bic}</BICFI>
                  <Nm>${quote.sendingParticipant.name}</Nm>
                </FinInstnId>
            </DbtrAgt>
            <ChrgBr>DEBT</ChrgBr>
            <CdtTrfTxInf>
                <PmtId>
                    <EndToEndId>${quote.transactionId}</EndToEndId>
                </PmtId>
                <Amt>
                    <InstdAmt Ccy="${quote.sendCurrency}">${quote.sendAmount}</InstdAmt>
                </Amt>
                <Cdtr>
                    <CtctDtls>
                        <MobNb>${quote.receivingParty.msisdn}</MobNb>
                    </CtctDtls>
                </Cdtr>
            </CdtTrfTxInf>
        </PmtInf>
    </CstmrCdtTrfInitn>
</Document>`
}