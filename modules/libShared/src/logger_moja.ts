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

* Coil
- Donovan Changfoot <donovan.changfoot@coil.com>

* Crosslake
- Pedro Sousa Barreto <pedrob@crosslaketech.com>

* ModusBox
- Miguel de Barros <miguel.debarros@modusbox.com>
- Roman Pietrzak <roman.pietrzak@modusbox.com>
*****/

'use strict'

import { ILogger } from './ilogger'

/* eslint-disable no-console */
export class MojaLogger implements ILogger {
  // trace(...anything) {
  //  console.trace.apply(this, anything);
  // }
  private readonly _logger: any

  constructor () {
    this._logger = require('@mojaloop/central-services-logger')
  }

  isDebugEnabled (): boolean {
    return this._logger.isDebugEnabled
  }

  isInfoEnabled (): boolean {
    return this._logger.isInfoEnabled
  }

  isWarnEnabled (): boolean {
    return this._logger.isWarnEnabled
  }

  isErrorEnabled (): boolean {
    return this._logger.isErrorEnabled
  }

  isFatalEnabled (): boolean {
    return this._logger.isErrorEnabled
  }

  debug (message?: any, ...optional: any[]): void {
    // #@ts-expect-error
    // console.log.apply(this, arguments)
    this._logger.debug(message, arguments)
  }

  info (message?: any, ...optionalParams: any[]): void {
    // #@ts-expect-error
    // console.info.apply(this, arguments)
    this._logger.info(message, arguments)
  }

  warn (message?: any, ...optional: any[]): void {
    // #@ts-expect-error
    // console.warn.apply(this, arguments)
    this._logger.warn(message, arguments)
  }

  error (message?: any, ...optional: any[]): void {
    // #@ts-expect-error
    // console.error.apply(this, arguments)
    this._logger.error(message, arguments)
  }

  fatal (message?: any, ...optional: any[]): void {
    // #@ts-expect-error
    // console.error.apply(this, arguments)
    this._logger.error(message, arguments)
  }
}
