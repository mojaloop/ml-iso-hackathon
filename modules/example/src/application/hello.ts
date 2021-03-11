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
  IMetricsFactory
} from '@mojaloop-iso-hackathon/lib-utilities'

export const sayHello = (message: string, appConfig: any, logger: ILogger, metrics: IMetricsFactory): void => {
  logger.isDebugEnabled() && logger.debug(`sayHello::start - appConfig=${JSON.stringify(appConfig)}`)
  const metric = metrics.getHistogram( // Create a new Histogram instrumentation
    'sayHellp', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
    'Instrumentation for sayHello example', // Description of metric
    ['success', 'error'] // Define a custom label 'success'
  )
  const histTimer = metric.startTimer()

  logger.info(`Hello ${appConfig.example.name as string} - ${message}`)

  histTimer({ success: 'true' })
  logger.isDebugEnabled() && logger.debug('sayHello::end')
}
