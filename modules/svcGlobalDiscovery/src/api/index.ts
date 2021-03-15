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

 * Coil
 - ..

 * Crosslake
 - ..

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
******/

'use strict'

import {
  ILogger,
  IMetricsFactory,
  ApiServer,
  TApiServerOptions,
  ApiServerError
  // ISO20022
} from '@mojaloop-iso-hackathon/lib-shared'
import { Accounts } from '../domain/accounts'
import { v4 as uuidv4 } from 'uuid'
import { JSONPath } from 'jsonpath-plus'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const pckg = require('../../package.json')

export class Server {
  protected _config: any
  protected _logger: ILogger
  protected _metrics: IMetricsFactory
  protected _apiServer: ApiServer | undefined
  protected _accountsAgg: Accounts

  constructor (appConfig: any, logger: ILogger, metrics: IMetricsFactory) {
    this._config = appConfig
    this._logger = logger
    this._metrics = metrics
  }

  async init (): Promise<void> {
    this._accountsAgg = new Accounts(this._config.account.mapStringList, this._logger, this._metrics)

    const apiServerOptions: TApiServerOptions = {
      host: this._config.api.host,
      port: this._config.api.port
    }

    this._apiServer = new ApiServer(apiServerOptions, this._logger)

    await this._registerRoutes()

    await this._apiServer.init()
  }

  async destroy (): Promise<void> {
    await this._apiServer!.destroy()
  }

  private async _registerRoutes (): Promise<void> {
    await this._apiServer!.get('/healthz', this._getHealth.bind(this))

    await this._apiServer!.get('/metrics', this._getMetrics.bind(this))

    await this._apiServer!.post('/v1/account:get', this._cmdGetAccount.bind(this))
  }

  private async _getHealth (request: any, reply: any): Promise<any> {
    return {
      status: 'ok',
      version: pckg.version,
      name: pckg.name
    }
  }

  private async _getMetrics (request: any, reply: any): Promise<string> {
    return await this._metrics.getMetricsForPrometheus()
  }

  private async _cmdGetAccount (request: any, reply: any): Promise<void> {
    this._logger.debug(`request.body=${JSON.stringify(request.body)}`)

    // const accounts = new Accounts(appConfig.account.mapStringList, logger, metrics)

    const idResult = JSONPath({ path: '$..MobNb', json: request.body })
    this._logger.debug(`idResult=${JSON.stringify(idResult)}`)

    const id: string | undefined = (idResult.length > 0) ? idResult[0] : undefined

    // replace validations with XSD schema checks
    if (id === undefined) {
      const err = new ApiServerError('MobNb is missing from request')
      err.statusCode = 400
      throw err
    }

    // // replace validations with XSD schema checks
    // if (!ISO20022.Models.Validation.Regex.PhoneNumber.test(id)){
    //   const err = new ApiServerError(`MobNb:${id} failed regex test against ${ISO20022.Models.Validation.Regex.PhoneNumber}`)
    //   err.statusCode=400
    //   throw err
    // }

    const resMsgIdResult = JSONPath({ path: '$..MsgId', json: request.body })
    this._logger.debug(`resMsgId=${JSON.stringify(resMsgIdResult)}`)

    const resMsgId: string | undefined = (resMsgIdResult.length > 0) ? resMsgIdResult[0] : undefined

    // replace validations with XSD schema checks
    // if (resMsgId === undefined) {
    //   const err = new ApiServerError('MsgId is missing from request')
    //   err.statusCode = 400
    //   throw err
    // }

    const account = await this._accountsAgg.getAccount(id)

    if (account == null) {
      const err = new ApiServerError(`Account with id:${id} was not found`)
      err.statusCode = 404
      throw err
    }

    const xmlJsonBodyRepresentation = {
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
              MsgId: resMsgId
            }
          },
          RptOrErr: {
            AcctRpt: {
              AcctId: {
                Othr: {
                  Nm: account.dfspId,
                  SchmeNm: account.type
                }
              },
              AcctOrErr: {
                Acct: {
                  Svcr: {
                    FinInstnId: {
                      BICFI: 'EQBLRWRWXXX',
                      Nm: 'EQUITY BANK RWANDA LIMITED'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return reply
      .code(200)
      .send(xmlJsonBodyRepresentation)
  }
}
