export function camt003(messageId: string, creationDateTime: Date, mobileNumber: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- PUT /parties/MSISDN/(+250)788301607 -->
<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:camt.003.001.07">
	<GetAcct>
		<MsgHdr>
			<MsgId>${messageId}</MsgId>	<!-- Required by ISO, not used by Moja -->
			<CreDtTm>${creationDateTime.toISOString()}</CreDtTm>	<!-- Required by ISO, not used by Moja -->
		</MsgHdr>
		<AcctQryDef>
			<AcctCrit>
				<NewCrit>
					<SchCrit>
						<AcctOwnr>
							<CtctDtls>
								<MobNb>${mobileNumber}</MobNb>		<!--	We want to know about this mobile number	-->
							</CtctDtls>
						</AcctOwnr>
					</SchCrit>
				</NewCrit>
			</AcctCrit>
		</AcctQryDef>
	</GetAcct>
</Document>`
}