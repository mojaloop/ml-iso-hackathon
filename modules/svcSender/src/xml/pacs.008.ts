import { MessageHeader, Participant, Party } from "./common";

export interface Transfer {
  id: string,
  transactionId: string
  condition: string,
  receiveAmount: string,
  receiveCurrency: string,
  sendingParty: Party,
  sendingParticipant: Participant,
  receivingParty: Party,
  receivingParticipant: Participant,


}

export function pacs008(header: MessageHeader, transfer: Transfer): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.09">
    <FIToFICstmrCdtTrf>
        <GrpHdr>
            <MsgId>${header.messageId}</MsgId>
            <CreDtTm>${header.creationDateTime.toISOString()}</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <SttlmInf>
                <SttlmMtd>CLRG</SttlmMtd>
            </SttlmInf>
        </GrpHdr>
        <CdtTrfTxInf>
            <PmtId>
                <EndToEndId>${transfer.id}</EndToEndId>
            </PmtId>
            <Cndtn>
                <Condition>${transfer.condition}</Condition>
            </Cndtn>
            <IntrBkSttlmAmt Ccy="${transfer.receiveCurrency}">${transfer.receiveCurrency}</IntrBkSttlmAmt>
            <ChrgBr>DEBT</ChrgBr>
           <Dbtr>
                <CtctDtls>
                    <MobNb>${transfer.sendingParty.msisdn}</MobNb>
                </CtctDtls>
            </Dbtr>
            <DbtrAgt>
              <FinInstnId>
                <BICFI>${transfer.sendingParticipant.bic}</BICFI>
                <Nm>${transfer.sendingParticipant.bic}</Nm>
              </FinInstnId>
            </DbtrAgt>
            <CdtrAgt>
                <FinInstnId>
                    <BICFI>${transfer.receivingParticipant.bic}</BICFI>
                    <Nm>${transfer.receivingParticipant.bic}</Nm>
                </FinInstnId>
            </CdtrAgt>
           <Cdtr>
                <CtctDtls>
                    <MobNb>${transfer.receivingParty.msisdn}</MobNb>
                </CtctDtls>
            </Cdtr>
        </CdtTrfTxInf>
    </FIToFICstmrCdtTrf>
</Document>`
}