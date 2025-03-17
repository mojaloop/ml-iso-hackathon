
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

import { resolve as Resolve } from 'path'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const XmlParser = require('fast-xml-parser')
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const XmlFormat = require('xml-formatter')
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const xsd = require('libxmljs2-xsd')

// could move this to config
const Options = {
  attributeNamePrefix: '', // default is "@_"
  attrNodeName: 'attr', // default is 'false'
  textNodeName: '#text',
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: true,
  cdataTagName: '__cdata', // default is 'false'
  cdataPositionChar: '\\c',
  parseTrueNumberOnly: false,
  arrayMode: false // "strict"
}

export type TPayload = string | object | undefined

export type ValidateResponse = {
  err: {
    line: string
    msg: string
  } | undefined
}

const validate = (payload: TPayload): ValidateResponse => {
  return XmlParser.validate(payload, Options)
}

const jsonify = (payload: TPayload, isValidationEnabled: boolean = true): any => {
  if (isValidationEnabled) {
    const result = validate(payload)
    if (result.err !== undefined) {
      throw new Error(`Invalid XML Format - [${result?.err?.line}]: ${result?.err?.msg}`)
    } else {
      return XmlParser.parse(payload, Options)
    }
  } else {
    return XmlParser.parse(payload, Options)
  }
}

const fromJson = (payload: TPayload, format: boolean = false): any => {
  const J2XParser = XmlParser.j2xParser
  const parser = new J2XParser(Options)
  const pasredXml = parser.parse(payload)
  if (format) {
    return XmlFormat(pasredXml)
  }
  return pasredXml
}

const format = (payload: string): string => {
  return XmlFormat(payload)
}

export const XML = {
  validate,
  jsonify,
  fromJson,
  format
}

export const XSD = {
  validate: (xsdPath: string, xml: string): string[] | null => {
    const reslvedXsdPath = Resolve(process.cwd(), xsdPath)

    const schema = xsd.parseFile(reslvedXsdPath)
    // throws in case of technical error, returns a list of validation errors,
    // or null if the document is valid
    const validationErrors = schema.validate(xml)
    let result: string[] | null = null
    if (validationErrors != null) {
      const errMsgSet = new Set<string>()
      validationErrors.forEach((res: any) => {
        errMsgSet.add(`line[${res.line as string}] - ${res.message as string}`)
      })
      result = Array.from(errMsgSet)
    }
    return result
  }
}
