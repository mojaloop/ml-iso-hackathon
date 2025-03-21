
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

import { fastify as Fastify, FastifyInstance, FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify'
import { RouteGenericInterface, RouteOptions } from 'fastify/types/route'
import { Server, IncomingMessage, ServerResponse } from 'http'
import { ILogger } from './ilogger'
// const XmlParser = require('fast-xml-parser')
import { XML } from './xml_tools'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const FastifyCors = require('fastify-cors')

export class ApiServerError extends Error {
  statusCode: number = 500
  static regex = /^(.*)statusCode(.*)error(.*)$/g
  constructor (m: string) {
    super(m)
    Object.setPrototypeOf(this, ApiServerError.prototype)
  }
}

export type TApiServerOptions = {
  host: string
  port: number
}

export type XmlRequestBody = {
  raw: string | Buffer,
  parsed: any,
}
export interface RouteXmlInterface extends RouteGenericInterface {
  Body?: XmlRequestBody
}

export type THandlerCallback<T extends RouteGenericInterface = RouteGenericInterface> = RouteHandlerMethod<Server, IncomingMessage, ServerResponse, T, unknown>
export type TApiXmlRequest = FastifyRequest<RouteXmlInterface, Server, IncomingMessage>
export type TApiXmlReply = FastifyReply<Server, IncomingMessage, ServerResponse, RouteXmlInterface, unknown>

export class ApiServer {
  private readonly _logger: ILogger
  private readonly _options: TApiServerOptions
  private _serverOptions: TApiServerOptions
  private readonly _server: FastifyInstance<Server, IncomingMessage, ServerResponse>

  constructor (opts: TApiServerOptions, logger: ILogger) {
    this._logger = logger
    this._options = opts
    this._server = Fastify({
      // logger: { level: 'debug' }
    })
  }

  async init (): Promise<void> {
    const defaultHttpServerOptions: TApiServerOptions = {
      host: '0.0.0.0',
      port: 3000
    }

    // copy default config
    this._serverOptions = { ...defaultHttpServerOptions }
    // override any values with the options given to the client
    Object.assign(this._serverOptions, this._options)

    this._logger.isInfoEnabled() && this._logger.info(`ApiServer::init - Http Server starting with opts: ${JSON.stringify(this._serverOptions)}`)

    // Handle multiple content types with the same function
    this._server.addContentTypeParser(['text/xml', 'application/xml'], { parseAs: 'string' }, this._xmlContentTypeParser.bind(this))
    this._server.addContentTypeParser(['application/vnd.interoperability.parties+json;version=1.0', 'application/vnd.interoperability.parties+json;version=1.1', 'application/vnd.interoperability.quotes+json;version=1.0', 'application/vnd.interoperability.quotes+json;version=1.1', 'application/vnd.interoperability.transfers+json;version=1.0', 'application/vnd.interoperability.transfers+json;version=1.1'], { parseAs: 'string' }, this._interoperabilityContentTypeParser.bind(this))

    this._server.addHook('preHandler', this._onPreHandler.bind(this))
    this._server.addHook('onSend', this._onSend.bind(this))

    await this._server.register(FastifyCors, {
      // put your options here
    })

    await this._server.listen(this._serverOptions.port, this._serverOptions.host)

    this._logger.isInfoEnabled() && this._logger.info('ApiServer::init - Routes\n' + this._server.printRoutes())

    this._logger.isInfoEnabled() && this._logger.info(`ApiServer::init - Http Server start on port:${this._serverOptions.port}, host: ${this._serverOptions.host}`)
  }

  private async _xmlContentTypeParser (request: FastifyRequest, payload: string | Buffer): Promise<any> {
    try {
      this._logger.debug(`ApiServerError::_xmlContentTypeParser - headers = ${JSON.stringify(request.headers)}`)
      let body: XmlRequestBody | null = null

      // convert serialised XML into a JSON representation, and validate XML integrity
      body = {
        parsed: XML.jsonify(payload, true),
        raw: payload
      }
      // this._logger.info(`WTFContent-type = ${JSON.stringify(request.headers)}`)
      return body
    } catch (err) {
      err.statusCode = 400
      throw err
    }
  }

  private async _interoperabilityContentTypeParser (request: FastifyRequest, payload: string | Buffer): Promise<any> {
    try {
      this._logger.debug(`ApiServerError::_interoperabilityContentTypeParser - headers = ${JSON.stringify(request.headers)}`)
      const body: object | null = JSON.parse(payload as string)
      return body
    } catch (err) {
      err.statusCode = 400
      throw err
    }
  }

  private async _onPreHandler (request: FastifyRequest, reply: any): Promise<void> {
    this._logger.isInfoEnabled() && this._logger.info(`ApiServer::hook.preHandler - request.headers=${JSON.stringify(request.headers)}, request.body=${JSON.stringify(request.body)}`)
  }

  private async _onSend (request: FastifyRequest, reply: any, payload: string): Promise<string | Buffer | null> {
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::hook.onSend - payload=${payload}`)
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::hook.onSend - request.headers['accept']=${request.headers.accept as string}`)

    // remove content-type from reply so that it can be re-calculated correctly
    reply.header('content-length', null)
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::hook.onSend - reply.headers=${JSON.stringify(reply.getHeaders())}`)

    const acceptContentType = request.headers.accept
    switch (acceptContentType) {
      case '*/*': {
        // Lets try match the request content-type due to the wild-card accept
        if (request.headers['content-type'] === 'application/xml') {
          reply.header('content-type', 'application/xml')
          // TODO: This is terrible and will need to be reworked!!!
          let jsonPayload = JSON.parse(payload)
          if (jsonPayload?.statusCode > 0) {
            // add a route element for XML world
            jsonPayload = { error: jsonPayload }
          }
          const responseBody = XML.fromJson(jsonPayload)
          this._logger.isInfoEnabled() && this._logger.info(`ApiServer::hook.onSend - reply.headers=${JSON.stringify(reply.getHeaders())}, reply.headers=${responseBody as string}`)
          return responseBody
        } else {
          return payload
        }
      }
      case 'application/xml': {
        // Match on accept, so set it below as the reply content-type
        reply.header('content-type', 'application/xml')
        // TODO: This is terrible and will need to be reworked!!!
        let jsonPayload = JSON.parse(payload)
        if (ApiServerError.regex.test(payload)) {
          // add a route element for XML world
          jsonPayload = { error: jsonPayload }
        }
        const responseBody = XML.fromJson(jsonPayload)
        this._logger.isInfoEnabled() && this._logger.info(`ApiServer::hook.onSend - reply.headers=${JSON.stringify(reply.getHeaders())}, reply.headers=${responseBody as string}`)
        return responseBody
      }
      default: {
        this._logger.isInfoEnabled() && this._logger.info(`ApiServer::hook.onSend - reply.headers=${JSON.stringify(reply.getHeaders())}, reply.headers=${payload}`)
        return payload
      }
    }
  }

  async get (path: string, handlerCallback: THandlerCallback): Promise<any> {
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::get - Registering GET:(${path})`)
    const res = this._server.get(path, handlerCallback)
    return res
  }

  async post<T extends RouteGenericInterface = RouteGenericInterface>  (path: string, handlerCallback: THandlerCallback<T>): Promise<any>{
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::post - Registering POST:(${path})`)
    const res = this._server.post(path, handlerCallback)
    return res
  }

  async put<T extends RouteGenericInterface = RouteGenericInterface> (path: string, handlerCallback: THandlerCallback<T>): Promise<any> {
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::put -  Registering PUT:(${path})`)
    const res = this._server.put(path, handlerCallback)
    return res
  }

  async delete (path: string, handlerCallback: THandlerCallback): Promise<any> {
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::delete - Registering DELETE:(${path})`)
    const res = this._server.delete(path, handlerCallback)
    return res
  }

  async patch (path: string, handlerCallback: THandlerCallback): Promise<any> {
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::patch - Registering PATCH:(${path})`)
    const res = this._server.patch(path, handlerCallback)
    return res
  }

  async options (path: string, handlerCallback: THandlerCallback): Promise<any> {
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::options - Registering OPTIONS:(${path})`)
    const res = this._server.options(path, handlerCallback)
    return res
  }


  route<T> (opts: RouteOptions<Server, IncomingMessage, ServerResponse, T>) {
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::${(opts.method as string).toLowerCase()} - Registering ${opts.method}:(${opts.url})`)
    return this._server.route<T>(opts)
  }

  async destroy (): Promise<void> {
    await this._server.close()
  }
}
