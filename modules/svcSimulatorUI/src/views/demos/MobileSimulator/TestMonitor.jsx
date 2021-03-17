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

import { Tag, Timeline, Card, Table, Row, Col, Button, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography

class IncomingTimelineItem extends React.Component {

  constructor() {
    super();
    this.state = {
      logsVisible: false
    }
  }

  toggleLogsVisibility = () => {
      this.setState({logsVisible: !this.state.logsVisible})
  }

  render () {
    const log = this.props.logs[0]
    const info = this.props.info
    const columns = [
      { title: 'Message', dataIndex: 'message', key: 'message' },
      { title: 'Log Type', dataIndex: 'verbosity', key: 'verbosity' }
    ]
    return (
      <>
        <b>{log.logTime}</b>
        <br /><Tag color={info.erroneous ? "#f50" : "#2db7f5"} onClick={this.toggleLogsVisibility}>{info.name}</Tag>
        <br />
        {
          this.state.logsVisible
          ? (
            <Table
              columns={columns}
              pagination={false}
              expandable={{
                expandedRowRender: log => (
                  <>
                  <Row>
                    <Text strong>{log.logTime}</Text>
                  </Row>
                  <Row>
                    
                      <Text
                        copyable = {
                          {
                            text: JSON.stringify(log.additionalData,null,2)
                          }
                        }
                      >
                        <pre style={{ overflow: 'scroll', 'white-space': 'pre-wrap' }}>
                          {JSON.stringify(log.additionalData,null,2)}
                        </pre>
                        
                      </Text>
                  </Row>
                  </>
                ),
                rowExpandable: log => (log.additionalData && Object.keys(log.additionalData).length !== 0),
              }}
              dataSource={this.props.logs.map((logItem, index) => {return {...logItem, key: index}})}
            />
          )
          : null
        }
      </>
    )
  }
}
class IncomingTimelineSet extends React.Component {

  constructor() {
    super();
    this.state = {
      logsVisible: false
    }
  }
  expandChange = (event) => {
    event.dataItem.expanded = !event.dataItem.expanded;
    this.forceUpdate();
  }

  toggleLogsVisibility = () => {
      this.setState({logsVisible: !this.state.logsVisible})
  }

  getTimelineItems = () => {
    return this.props.logSetObj.secondaryItemsArr.map(item => {
      if (item) {
        return (
          <IncomingTimelineItem key={item.id} info={item} logs={this.props.logSetObj.secondaryItemsObj[item.id]} />
        )
      } else {
        return (
          <Timeline.Item dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />} color="red"><br /><br /></Timeline.Item>
        )
      }

    })
  }

  render () {
    const logSetObj = this.props.logSetObj
    // const log = { logTime: 'TEMP TIME' }
    // const info = { name: 'TEMP NAME', erroneous: false }
    if (this.props.logSetObj.secondaryItemsArr.length > 1) {
      return (
        <>
          <b>{logSetObj.logTime}</b>
          <br /><Tag color={logSetObj.erroneous ? "#f50" : "#2db7f5"} onClick={this.toggleLogsVisibility}>{logSetObj.name}</Tag>
          <br />
          {
            this.state.logsVisible
            ? (
                <Card>
                  <Timeline reverse={false}>
                    {this.getTimelineItems()}
                  </Timeline>
                </Card>
            )
            : null
          }
        </>
      )
    } else {
      if (this.props.logSetObj.secondaryItemsArr.length === 1) {
        const item = this.props.logSetObj.secondaryItemsArr[0]
        return (
          <IncomingTimelineItem key={item.id} info={item} logs={this.props.logSetObj.secondaryItemsObj[item.id]} />
        )
      } else {
        return null
      }
    }
  }
}

class TestMonitor extends React.Component {

  newState =  {
    logs: [],
    incomingItemsObj: {},
    incomingItemsArr: [],
  }

  constructor() {
    super();
    this.state = JSON.parse(JSON.stringify(this.newState))
  }

  componentDidMount = async () => {
  }

  appendLog = (log) => {
    this.state.logs.push(log)
    let primaryGroupId = 'misc'
    if(log.uniqueId) {
      primaryGroupId = log.uniqueId
    }
    // Disabling grouping by traceID temporarily, need to refactor this functionality to sync with the new inbound and outbound logs structure
    // if(log.traceID) {
    //   primaryGroupId = log.traceID
    // }
    

    // Group by unique ID
    if(!this.state.incomingItemsObj.hasOwnProperty(primaryGroupId)) {
      this.state.incomingItemsObj[primaryGroupId] = {
        name: '',
        erroneous: false,
        logTime: null,
        secondaryItemsArr: [],
        secondaryItemsObj: {}
      }
      
      this.state.incomingItemsArr.push(primaryGroupId)
    }
    let primaryName = ''

    const secondaryGroupId = log.uniqueId
    if(!this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj.hasOwnProperty(secondaryGroupId)) {  
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj[secondaryGroupId] = []
      let name = log.message
      if (log.resource) {
        name = log.resource.method.toUpperCase() + ' ' + log.resource.path
        primaryName = log.resource.method.toUpperCase() + ' > '
      }
      this.state.incomingItemsObj[primaryGroupId].logTime = log.logTime
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr.push({ id: secondaryGroupId, name, erroneous: false })
    }

    this.state.incomingItemsObj[primaryGroupId].name += primaryName + ' '
    
    // If the verbosity of the log is error, set the entire group as erroneous
    if (log.verbosity === 'error') {
      // Find the group in incomingItemsArr array
      this.state.incomingItemsObj[primaryGroupId].erroneous = true
      // Find the group in secondaryItemsArr array
      const secondaryItemIndex = this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr.findIndex(item => item? (item.id === secondaryGroupId) : false)
      this.state.incomingItemsObj[primaryGroupId].secondaryItemsArr[secondaryItemIndex].erroneous = true
    }

    this.state.incomingItemsObj[primaryGroupId].position = log.notificationType === "newLog" ? "right" : "left"

    this.state.incomingItemsObj[primaryGroupId].secondaryItemsObj[secondaryGroupId].push(log)
  }

  getTimelineSets = () => {
    return this.state.incomingItemsArr.map(item => {
      if (item) {
        return (
          <Timeline.Item position={this.state.incomingItemsObj[item].position}>
            <IncomingTimelineSet key={item.id} info={item} logSetObj={this.state.incomingItemsObj[item]} />
          </Timeline.Item>
        )
      } else {
        return (
          <Timeline.Item dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />} color="red"><br /><br /></Timeline.Item>
        )
      }
    })
  }

  clearLogs = () => {
    this.setState(JSON.parse(JSON.stringify(this.newState)))
  }

  render () {
    return (
      <>
      <Row>
        <Col span={8} className="text-right" ><span className="font-weight-bold">Inbound Requests</span></Col>
        <Col span={8} className="text-center" ><span className="font-weight-bold">|</span></Col>
        <Col span={8} className="text-left"><span className="font-weight-bold">Outbound Requests</span></Col>
      </Row>
      <Row>
        <Col span={24}>&nbsp;</Col>
      </Row>
      <Row>
        <Col span={24}>
          <Timeline mode="alternate" reverse={false}>
            {this.getTimelineSets()}
          </Timeline>
        </Col>
      </Row>
      </>
    )
  }
}

export default TestMonitor;
