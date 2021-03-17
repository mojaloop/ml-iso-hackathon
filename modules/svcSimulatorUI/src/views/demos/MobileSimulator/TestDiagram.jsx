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
import React from "react";

import { Row, Col, Card, Button } from 'antd';
import mermaid from 'mermaid'

class TestDiagram extends React.Component {

  newState =  {
    logs: [],
    lastLogTime: null,
    sequenceItems: [],
    seqSteps: ''
  }

  constructor() {
    super();
    this.state = JSON.parse(JSON.stringify(this.newState))
  }

  componentDidMount = async () => {
    this.resetWelcomeMessage()
  }

  clearSequence = async (source, destination, message) => {
    this.state.seqSteps = ''
    this.refreshSequenceDiagram()
  }
  addSequence = async (source, destination, message, options = { dashed: false, erroneous: false, activation: { mode: null, peer: null } }) => {
    const dashedStyle = options.dashed ? '-' : ''
    this.state.seqSteps += `${source}-${dashedStyle}>>${destination}: ${message}\n`
    if (options.activation && options.activation.mode && options.activation.peer && (options.activation.mode === 'activate' || options.activation.mode === 'deactivate')) {
      if (options.activation.peer === 'source') {
        this.state.seqSteps += `${options.activation.mode} ${source}\n`
      } else if (options.activation.peer === 'destination') {
        this.state.seqSteps += `${options.activation.mode} ${destination}\n`
      } else if (options.activation.peer === 'both') {
        this.state.seqSteps += `${options.activation.mode} ${source}\n`
        this.state.seqSteps += `${options.activation.mode} ${destination}\n`
      }
    }
    this.refreshSequenceDiagram()
  }
  addNoteOver = async (source, destination, message) => {
    this.state.seqSteps += `Note over ${source},${destination}: ${message}\n`
    this.refreshSequenceDiagram()
  }
  addCustomSequence = async (seqText) => {
    this.state.seqSteps += seqText + '\n'
    this.refreshSequenceDiagram()
  }

  refreshSequenceDiagram = async () => {
    this.seqDiagContainer.removeAttribute('data-processed')
    const code = 'sequenceDiagram\n' + this.state.seqSteps
    try {
      // mermaid.sequenceConfig = {
      //   mirrorActors: true,
      //   bottomMarginAdj: 10,
      //   diagramMarginX: 50,
      //   diagramMarginY: 10
      // }
      mermaid.parse(code)
      this.seqDiagContainer.innerHTML = code
      mermaid.init(undefined, this.seqDiagContainer)
      // this.seqDiagContainer.innerHTML += '<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf<br />asdf'
    } catch (e) {
      console.log('Diagram generation error', e.str || e.message)
    }
  }

  handleClearLogs = () => {
    this.state.sequenceItems = []
    this.refreshSequenceDiagram()
    this.resetWelcomeMessage()
    this.forceUpdate()
  }

  resetWelcomeMessage = () => {
    this.seqDiagContainer.innerHTML = ''
  }

  render () {
    return (
      <>
        {/* <Row>
          <Col span={24}>
          {
            this.state.sequenceItems.length > 0
            ? (
              <Button
                className="float-right"
                type="primary"
                danger
                onClick={this.handleClearLogs}
              >
                Clear
              </Button>
            )
            : null
          }
          </Col>
        </Row> */}
        <Row style={{'min-height': '200px'}}>
          <Col className='text-center' span={24}>
            <div
              ref={div => {
                this.seqDiagContainer = div
              }}
            ></div>
          </Col>
        </Row>
      </>
    )
  }
}

export default TestDiagram;
