
/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* ModusBox
- Miguel de Barros <miguel.debarros@modusbox.com>
*****/

'use strict'
import { v4 as uuidv4 } from 'uuid'

export const ISO20022 = {
  Models: {
    Validation: {
      Regex: {
        PhoneNumber: /^\+[0-9]{1,3}-[0-9()+\-]{1,30}$/g /* eslint-disable-line */
      }
    }
  },
  Messages: {
    // Todo: Set the bellow values via an arbitrary param tuple list that contains something like this: (jsonpath, value).
    Camt004: (
      RtrAcctMsgHdrOrgnlBizQryMsgId: string | undefined,
      RtrAcctRptOrErrAcctRptAcctIdOthrNm: string | undefined,
      RtrAcctRptOrErrAcctRptAcctIdOthrSchmeNmCd: string | undefined,
      RtrAcctRptOrErrAcctRptAcctOrErrAcctSvcrFinInstnIdBICFI: string | undefined,
      RtrAcctRptOrErrAcctRptAcctOrErrAcctSvcrFinInstnIdNm: string | undefined,
      RtrAcctRptOrErrAcctRptAcctOrErrBizErrErrCd: string | null = null
    ) => {
      const xmlAcctId: any = {}
      if (RtrAcctRptOrErrAcctRptAcctIdOthrNm != null && RtrAcctRptOrErrAcctRptAcctIdOthrSchmeNmCd != null) {
        xmlAcctId.Othr = {
          Id: RtrAcctRptOrErrAcctRptAcctIdOthrNm,
          // Nm: RtrAcctRptOrErrAcctRptAcctIdOthrNm, // this is invalid
          SchmeNm: {
            Cd: RtrAcctRptOrErrAcctRptAcctIdOthrSchmeNmCd
          }
        }
      }

      const xmlAcctOrErr: any = {}
      if (RtrAcctRptOrErrAcctRptAcctOrErrBizErrErrCd != null) {
        xmlAcctOrErr.BizErr = {
          Err: {
            Cd: RtrAcctRptOrErrAcctRptAcctOrErrBizErrErrCd
          }
        }
      }
      if (RtrAcctRptOrErrAcctRptAcctOrErrAcctSvcrFinInstnIdBICFI != null && RtrAcctRptOrErrAcctRptAcctOrErrAcctSvcrFinInstnIdNm != null) {
        xmlAcctOrErr.Acct = {
          Svcr: {
            FinInstnId: {
              BICFI: RtrAcctRptOrErrAcctRptAcctOrErrAcctSvcrFinInstnIdBICFI,
              Nm: RtrAcctRptOrErrAcctRptAcctOrErrAcctSvcrFinInstnIdNm
            }
          }
        }
      }

      const xmlDocument: any = {
        Document: {
          attr: {
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            xmlns: 'urn:iso:std:iso:20022:tech:xsd:camt.004.001.08'
          },
          RtrAcct: {
            MsgHdr: {
              MsgId: uuidv4(),
              CreDtTm: (new Date()).toISOString(),
              OrgnlBizQry: {
                MsgId: RtrAcctMsgHdrOrgnlBizQryMsgId
              }
            },
            RptOrErr: {
              AcctRpt: {
                AcctId: xmlAcctId,
                AcctOrErr: xmlAcctOrErr
              }
            }
          }
        }
      }

      return xmlDocument
    }
  }
}
