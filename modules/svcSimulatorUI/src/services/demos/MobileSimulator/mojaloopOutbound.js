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
import getConfig from '../../../utils/getConfig'
import { TraceHeaderUtils } from '@mojaloop/ml-testing-toolkit-shared-lib'

class OutboundService {

  apiBaseUrl = ''
  inputValues = {}
  sessionId = '123'

  constructor (sessionId = '123') {
    const { apiBaseUrl } = getConfig()
    this.apiBaseUrl = apiBaseUrl
    this.sessionId = sessionId
    this.reloadEnvironment()
  }

  getSessionId () {
    return this.sessionId
  }

  getTraceId () {
    const traceIdPrefix = TraceHeaderUtils.getTraceIdPrefix()
    const currentEndToEndId = TraceHeaderUtils.generateEndToEndId()
    return traceIdPrefix + this.sessionId + currentEndToEndId
  }
  
  async reloadEnvironment () {
    const environmentURL = '/api/samples/loadFolderWise?environment=examples/environments/hub-k8s-local-environment.json'
    const resp = await axios.get(this.apiBaseUrl + environmentURL)
    if (resp.data && resp.data.body && resp.data.body.environment) {
      this.inputValues =  resp.data.body.environment
    }
  }

  async getParties (idNumber) {
    const traceId = this.getTraceId()
    const template = require('./template_getParties.json')
    template.inputValues = this.inputValues
    // Replace corresponding values in inputValues
    template.inputValues.toIdValue = idNumber + ''
    const resp = await axios.post(this.apiBaseUrl + "/api/outbound/template/" + traceId, template , { headers: { 'Content-Type': 'application/json' } })
    // if(typeof response.data === 'object') {
    //   return response.data
    // }
    // return null
    return resp
  }
  async postQuotes (amount) {
    const traceId = this.getTraceId()
    const template = require('./template_postQuotes.json')
    template.inputValues = this.inputValues
    // Replace corresponding values in inputValues
    template.inputValues.amount = amount + ''
    const resp = await axios.post(this.apiBaseUrl + "/api/outbound/template/" + traceId, template , { headers: { 'Content-Type': 'application/json' } })
    // if(typeof response.data === 'object') {
    //   return response.data
    // }
    // return null
    return resp
  }
  async postTransfers (amount, transactionId, expiration, ilpPacket, condition) {
    const traceId = this.getTraceId()
    const template = require('./template_postTransfers.json')
    template.inputValues = this.inputValues
    // Replace corresponding values in inputValues
    template.inputValues.amount = amount + ''
    template.inputValues.quotesCallbackTransactionId = transactionId + ''
    template.inputValues.quotesCallbackExpiration = expiration + ''
    template.inputValues.quotesCallbackIlpPacket = ilpPacket + ''
    template.inputValues.quotesCallbackCondition = condition + ''
    const resp = await axios.post(this.apiBaseUrl + "/api/outbound/template/" + traceId, template , { headers: { 'Content-Type': 'application/json' } })
    // if(typeof response.data === 'object') {
    //   return response.data
    // }
    // return null
    return resp
  }
  async startProvisioning () {
    const traceId = this.getTraceId()
    const template = require('./template_provisioning.json')
    template.inputValues = this.inputValues
    const resp = await axios.post(this.apiBaseUrl + "/api/outbound/template/" + traceId, template , { headers: { 'Content-Type': 'application/json' } })
    return resp
  }
  async getDFSPValues () {
    const traceId = this.getTraceId()
    const template = require('./template_getDFSPValues')
    template.inputValues = this.inputValues
    const resp = await axios.post(this.apiBaseUrl + "/api/outbound/template/" + traceId, template , { headers: { 'Content-Type': 'application/json' } })
    return resp
  }

  async getSettlements () {
    const traceId = this.getTraceId()
    const template = require('./template_getSettlements')
    template.inputValues = this.inputValues
    const resp = await axios.post(this.apiBaseUrl + "/api/outbound/template/" + traceId, template , { headers: { 'Content-Type': 'application/json' } })
    return resp
  }

  async executeSettlement () {
    const traceId = this.getTraceId()
    const template = require('./template_executeSettlement')
    template.inputValues = this.inputValues
    const resp = await axios.post(this.apiBaseUrl + "/api/outbound/template/" + traceId, template , { headers: { 'Content-Type': 'application/json' } })
    return resp
  }

}

export default OutboundService
