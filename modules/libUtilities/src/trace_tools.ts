/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'
import base64url from 'base64url'
import { getEnvValueOrDefault } from './index'
import { Crypto } from './crypto'

/* env variables are initiated when application reads the ".env" configs, so we delay that step */
let isEnvInitiated = false
let EVENT_SDK_VENDOR_PREFIX: string = 'acmevendor'

const initEnvVars = (): void => {
  if (!isEnvInitiated) {
    EVENT_SDK_VENDOR_PREFIX = getEnvValueOrDefault('EVENT_SDK_VENDOR_PREFIX', 'acmevendor')
    isEnvInitiated = true
  }
}

export const extractTraceStateFromMessage = (message: any): any => {
  let theTraceState = null

  initEnvVars()

  /* Get the trace state if present in the message */
  const traceState: string | undefined = message.traceInfo?.traceState
  if (traceState !== undefined) {
    /* expecting something like "acmevendor=eyJzcGF..." where "eyJzcGF" is base64 encoded msg */
    const vendorWithSign = EVENT_SDK_VENDOR_PREFIX + '='
    if (traceState.includes(vendorWithSign)) {
      const payloadEncoded = traceState.substr(traceState.indexOf(vendorWithSign) + vendorWithSign.length)
      const payloadDecoded = base64url.toBuffer(payloadEncoded)
      try {
        theTraceState = JSON.parse(payloadDecoded.toString())
      } catch (err) {
        /* eslint-disable-next-line no-console */
        console.error('extractTraceStateFromMessage Error when JSON.parse()-ing message')
      }
    }
  }

  return theTraceState
}

export const injectTraceStateToMessage = (message: any, toInject: any): void => {
  initEnvVars()
  const payloadEncoded = base64url.encode(JSON.stringify(toInject))
  const vendorWithSign = EVENT_SDK_VENDOR_PREFIX + '='

  if (message.traceInfo != null) {
    message.traceInfo.traceState = vendorWithSign + payloadEncoded
  } else {
    /* expecting something like "acmevendor=eyJzcGF..." where "eyJzcGF" is base64 encoded msg */
    message.traceInfo = {
      traceParent: `00-${Crypto.randomBytes(16)}-${Crypto.randomBytes(8)}-${Crypto.randomBytes(1)}`,
      traceState: vendorWithSign + payloadEncoded
    }
  }
}

export const mergeObjectIntoTraceStateToMessage = (message: any, toInject: any): void => {
  const currentMsg = extractTraceStateFromMessage(message)
  const newMsg = {
    ...currentMsg,
    ...toInject
  }
  injectTraceStateToMessage(message, newMsg)
}
