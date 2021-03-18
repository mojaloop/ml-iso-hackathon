import { MessageHeader } from "./common";

export function camt003(header: MessageHeader, mobileNumber: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:camt.003.001.07">
  <GetAcct>
    <MsgHdr>
      <MsgId>${header.messageId}</MsgId>	<!-- Required by ISO, not used by Moja -->
      <CreDtTm>${header.creationDateTime.toISOString()}</CreDtTm>	<!-- Required by ISO, not used by Moja -->
    </MsgHdr>
    <AcctQryDef>
      <AcctCrit>
        <NewCrit>
          <SchCrit>
            <AcctOwnr>
              <CtctDtls>
                <MobNb>${mobileNumber}</MobNb>
              </CtctDtls>
            </AcctOwnr>
          </SchCrit>
        </NewCrit>
      </AcctCrit>
    </AcctQryDef>
  </GetAcct>
</Document>`
}