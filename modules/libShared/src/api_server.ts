
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

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
******/

'use strict'

// import { fastify as Fastify, FastifyInstance, RouteShorthandOptions } from 'fastify'
import { fastify as Fastify, FastifyInstance, FastifyRequest, RouteHandlerMethod } from 'fastify'
import { RouteGenericInterface } from 'fastify/types/route'
import { Server, IncomingMessage, ServerResponse } from 'http'
import { ILogger } from './ilogger'
// const XmlParser = require('fast-xml-parser')
import { XML } from './xml_parser'

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

type THandlerCallback = RouteHandlerMethod<Server, IncomingMessage, ServerResponse, RouteGenericInterface, unknown>

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

    // const self = this

    // Handle multiple content types with the same function
    // this._server.addContentTypeParser(['text/xml', 'application/xml'], { parseAs: 'string' }, (request, payload, done) => {
    this._server.addContentTypeParser(['text/xml', 'application/xml'], { parseAs: 'string' }, async (request: FastifyRequest, payload: string | Buffer) => {
      try {
        let body: object | null = null
        body = XML.jsonify(payload)
        return body
      } catch (err) {
        err.statusCode = 400
        throw err
      }
    })

    // this._server.addHook('preSerialization', async (request, reply, payload: any) => {

    this._server.addHook('preHandler', this._preHandler.bind(this))
    this._server.addHook('onSend', this._onSend.bind(this))

    // this._server.ready().then(async () => {
    //   this._logger.isInfoEnabled() && this._logger.info(this._server.printRoutes())
    // })

    await this._server.listen(this._serverOptions.port, this._serverOptions.host)

    this._logger.isInfoEnabled() && this._logger.info('ApiServer::init - Routes\n' + this._server.printRoutes())

    this._logger.isInfoEnabled() && this._logger.info(`ApiServer::init - Http Server start on port:${this._serverOptions.port}, host: ${this._serverOptions.host}`)
  }

  private async _preHandler (request: FastifyRequest, reply: any): Promise<void> {
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

  async post (path: string, handlerCallback: THandlerCallback): Promise<any> {
    this._logger.isDebugEnabled() && this._logger.debug(`ApiServer::post - Registering POST:(${path})`)
    const res = this._server.post(path, handlerCallback)
    return res
  }

  async put (path: string, handlerCallback: THandlerCallback): Promise<any> {
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

  async destroy (): Promise<void> {
    await this._server.close()
  }
}
