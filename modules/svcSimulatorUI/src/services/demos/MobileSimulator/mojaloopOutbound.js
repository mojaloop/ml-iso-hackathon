/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * ModusBox
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
import axios from 'axios'
import https from 'https'
import getConfig from '../../../utils/getConfig'
import { TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib'

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})

class OutboundService {

  apiBaseUrl = ''
  senderApiUrl = ''
  inputValues = {}
  sessionId = '123'

  constructor (sessionId = '123') {
    const { apiBaseUrl, senderApiUrl } = getConfig()
    this.apiBaseUrl = apiBaseUrl
    this.senderApiUrl = senderApiUrl
    this.sessionId = sessionId
    // this.reloadEnvironment()
  }

  getSessionId () {
    return this.sessionId
  }

  getTraceId () {
    const traceIdPrefix = TraceHeaderUtils.getTraceIdPrefix()
    const currentEndToEndId = TraceHeaderUtils.generateEndToEndId()
    return traceIdPrefix + this.sessionId + currentEndToEndId
  }
  
  // async reloadEnvironment () {
  //   const environmentURL = '/api/samples/loadFolderWise?environment=examples/environments/hub-k8s-local-environment.json'
  //   const resp = await axios.get(this.apiBaseUrl + environmentURL)
  //   if (resp.data && resp.data.body && resp.data.body.environment) {
  //     this.inputValues =  resp.data.body.environment
  //   }
  // }

  async postQuotes (idNumber, amount, currency) {
    const httpBody = {
      msisdn: idNumber,
      amount: amount,
      currency: currency
    }
    const resp = await axiosInstance.post(this.senderApiUrl + "/api/quotes", httpBody , { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    return resp
  }
  async postTransfers (transactionId) {
    const httpBody = {
      transactionId: transactionId
    }
    const resp = await axiosInstance.post(this.senderApiUrl + "/api/transfers", httpBody , { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    return resp
  }

}

export default OutboundService
