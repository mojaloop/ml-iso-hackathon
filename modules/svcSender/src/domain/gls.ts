export interface GlsLookupResponse {
  digitalFinancialServiceProviderId: string, 
  financialInstitutionIdType: string, 
  financialInstitutionId: string, 
  financialInstitutionName: string
}

export const LOOKUP_RESPONSE_JPATHS : GlsLookupResponse = {
  digitalFinancialServiceProviderId: 'Document.RtrAcct.RptOrErr.AcctRpt.AcctId.Othr.Id',
  financialInstitutionIdType: 'Document.RtrAcct.RptOrErr.AcctRpt.AcctId.Othr.SchmeNm',
  financialInstitutionId: 'Document.RtrAcct.RptOrErr.AcctRpt.AcctOrErr.Acct.Svcr.FinInstnId.BICFI',
  financialInstitutionName: 'Document.RtrAcct.RptOrErr.AcctRpt.AcctOrErr.Acct.Svcr.FinInstnId.Nm',
}