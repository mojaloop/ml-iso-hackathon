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
import { Row, Col, Drawer, Button, Typography, Modal, Tabs } from 'antd';
import { CaretRightFilled, CaretLeftFilled, SettingOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css'
import mobile_left from '../../../assets/img/mobile_left.png';
import mobile_right from '../../../assets/img/mobile_right.png';

import PayerMobile from "./PayerMobile.jsx";
import PayeeMobile from "./PayeeMobile.jsx";
import TestDiagram from "./TestDiagram.jsx";
import TestMonitor from "./TestMonitor.jsx";
import Settings from "./Settings.jsx";
import HUBConsole from "./HUBConsole.jsx";
import ActivityLog from "./ActivityLog.jsx";
import NotificationService from '../../../services/demos/MobileSimulator/mojaloopNotifications'
import OutboundService from '../../../services/demos/MobileSimulator/mojaloopOutbound'
import { getServerConfig } from '../../../utils/getConfig'
import xmlFormatter from 'xml-formatter'

const {Text} = Typography
const { TabPane } = Tabs;

class MobileSimulator extends React.Component {
  state = {
    payerName: 'Sender Bank',
    hubName: 'Mojaloop Switch',
    payeeName: 'Receiver Bank',
    payerLogsDrawerVisible: false,
    payeeLogsDrawerVisible: false,
    showSettings: false,
    hubConsoleEnabled: false
  }

  constructor () {
    super()
    this.payerMobileRef = React.createRef();
    this.payeeMobileRef = React.createRef();
    this.testDiagramRef = React.createRef();
    this.payerMonitorRef = React.createRef();
    this.payeeMonitorRef = React.createRef();
    this.settingsRef = React.createRef();
    this.hubConsoleRef = React.createRef();
    this.activityLogRef = React.createRef();
    this.notificationServiceObj = new NotificationService()
    this.outboundServiceObj = new OutboundService()
  }
  
  componentDidMount = async () => {
    this.notificationServiceObj.setNotificationEventListener(this.handleNotificationEvents)
    // this.fetchConfiguration()
  }

  componentWillUnmount = () => {
    this.notificationServiceObj.disconnect()
  }

  fetchConfiguration = async () => {
    const { userConfigRuntime } = await getServerConfig()
    const hubConsoleEnabled = userConfigRuntime && userConfigRuntime.UI_CONFIGURATION && userConfigRuntime.UI_CONFIGURATION.MOBILE_SIMULATOR && userConfigRuntime.UI_CONFIGURATION.MOBILE_SIMULATOR.HUB_CONSOLE_ENABLED
    this.setState({hubConsoleEnabled})
  }

  handleNotificationEvents = (event) => {
    if (event.category === 'payer') {
      this.payerMobileRef.current && this.payerMobileRef.current.handleNotificationEvents(event)
      this.updateSequenceDiagram(event)
      this.updateActivityLog(event)
    } else if (event.category === 'payee') {
      this.payeeMobileRef.current && this.payeeMobileRef.current.handleNotificationEvents(event)
      this.updateSequenceDiagram(event)
      this.updateActivityLog(event)
    } else if (event.category === 'payerMonitorLog') {
      this.payerMonitorRef.current && this.payerMonitorRef.current.appendLog(event.data.log)
    } else if (event.category === 'payeeMonitorLog') {
      this.payeeMonitorRef.current && this.payeeMonitorRef.current.appendLog(event.data.log)
    } else if (event.category === 'settingsLog') {
      this.settingsRef.current && this.settingsRef.current.handleNotificationEvents(event)
    } else if (event.category === 'hubConsole') {
      this.hubConsoleRef.current && this.hubConsoleRef.current.handleNotificationEvents(event)
    }
  }

  clearEverything = () => {
    if (this.testDiagramRef.current) {
      this.testDiagramRef.current.clearSequence()
    }
    if (this.payerMonitorRef.current) {
      this.payerMonitorRef.current.clearLogs()
    }
    if (this.payeeMonitorRef.current) {
      this.payeeMonitorRef.current.clearLogs()
    }
  }


  updateActivityLog = (event) => {
    if (event.type === 'isoMessage') {
      // ISO20022 Message
      if (this.activityLogRef.current) {
        this.activityLogRef.current.addLog(event.data.fromComponent, event.data.toComponent, event.data.description, xmlFormatter(event.data.xmlData))
      }
    }
    else if (event.type.startsWith('payee')) {
      if (this.activityLogRef.current) {
        this.activityLogRef.current.addLog(event.data.fromComponent, event.data.toComponent, event.data.description, event.data.requestBody ? JSON.stringify(event.data.requestBody, null, 2) : null)
      }
    }
  }

  updateSequenceDiagram = (event) => {
    switch(event.type) {
      // ISO20022 Message
      case 'isoMessage':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP REQ] ' + event.data.description)
        }
        break
      }

      // Payee Side Events
      case 'payeeGetParties':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addCustomSequence(`rect rgb(255, 245, 173)\n${this.state.hubName}-->>${this.state.hubName}: Oracle Lookup\nend\n`)
          // this.testDiagramRef.current.addSequence(this.state.hubName, this.state.hubName, 'Oracle Lookup')
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP REQ] GET ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'payeeGetPartiesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true})
        }
        break
      }
      case 'payeePutParties':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP Callback] PUT ' + event.data.resource.path)
        }
        break
      }
      case 'payeePutPartiesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
      case 'payeePostQuotes':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP REQ] POST ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'payeePostQuotesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true})
        }
        break
      }
      case 'payeePutQuotes':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP Callback] PUT ' + event.data.resource.path)
        }
        break
      }
      case 'payeePutQuotesResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
      case 'payeePostTransfers':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP REQ] POST ' + event.data.resource.path, {activation: { mode: 'activate', peer: 'destination'}})
        }
        break
      }
      case 'payeePostTransfersResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true})
        }
        break
      }
      case 'payeePutTransfers':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP Callback] PUT ' + event.data.resource.path)
        }
        break
      }
      case 'payeePutTransfersResponse':
      {
        if (this.testDiagramRef.current) {
          this.testDiagramRef.current.addSequence(event.data.fromComponent, event.data.toComponent, '[HTTP RESP] ' + event.data.responseStatus, {dashed: true, activation: { mode: 'deactivate', peer: 'destination'}})
        }
        break
      }
    }
  }

  render() {
    return (
      <>
      {/* <Drawer
        title="Sender Bank Logs"
        width="70%"
        placement='left'
        forceRender={true}
        closable={false}
        visible={this.state.payerLogsDrawerVisible}
        onClose={() => {
          this.setState({payerLogsDrawerVisible: false})
        }}
      >
        <TestMonitor ref={this.payerMonitorRef} />
      </Drawer>
      <Drawer
        title="Receiver Bank Logs"
        width="70%"
        placement='right'
        forceRender={true}
        closable={false}
        visible={this.state.payeeLogsDrawerVisible}
        onClose={() => {
          this.setState({payeeLogsDrawerVisible: false})
        }}
      >
        <TestMonitor ref={this.payeeMonitorRef} />
      </Drawer> */}
      {/* <Modal
          style={{ top: 20 }}
          destroyOnClose
          title="Settings"
          visible={this.state.showSettings? true : false}
          footer={null}
          onCancel={() => { this.setState({showSettings: false})}}
        >
          <Settings
            ref={this.settingsRef}
            outboundService={this.outboundServiceObj}
          />
      </Modal> */}
      <Row className="h-100">
        <Col span={24}>
          <Row className='h-100'>
            <Col span={4}
              className="text-left align-bottom"
              style={{
                verticalAlign: 'bottom',
                width:'100%',
                height: '100%',
                backgroundImage: `url(${mobile_left})`,
                backgroundPosition: 'left bottom',
                backgroundSize: '30vh',
                backgroundRepeat: 'no-repeat'
              }}>
              {/* <Row align="top">
                <Col span={24}>                
                  <Button type='primary' className='mt-2' style={ {height: '40px', backgroundColor: '#F90085'} } onClick={() => {
                    this.setState({payerLogsDrawerVisible: true})
                  }}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Sender Bank Logs</Text> <CaretRightFilled style={ {fontSize: '18px'} }/>
                  </Button>
                </Col>
              </Row> */}
              <Row align="bottom" className='h-100 mt-4'>
                <Col span={24}>
                  <Row style={{ marginLeft: '3vh', marginBottom: '8vh', width: '24vh', height: '45vh'}}>
                    <Col span={24}>
                      <PayerMobile
                        ref={this.payerMobileRef}
                        outboundService={this.outboundServiceObj}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col span={16} className='text-center'>
              {/* <Button
                className='mt-2 mb-2'
                style={ {width: '50px', height: '50px'} }
                danger
                shape="circle"
                size='large'
                onClick={() => { this.setState({showSettings: true})}}
              >
                <SettingOutlined style={ {fontSize: '24px'} } />
              </Button> */}
              <div
                style={{
                  height: '90vh'
                }}
              >
              <Tabs defaultActiveKey='1'>
                <TabPane tab="Sequence Diagram" key="1" forceRender>
                  <div
                    style={{
                      height: '100%',
                      overflow: 'scroll'
                    }}
                  >
                  <TestDiagram ref={this.testDiagramRef} />
                  </div>
                </TabPane>
                {
                  <TabPane tab="Activity Log" key="2" forceRender>
                    <ActivityLog
                      style={{
                        width: '90%'
                      }}
                      ref={this.activityLogRef}
                    />
                  </TabPane>
                }
                {/* {
                  this.state.hubConsoleEnabled
                  ? (
                    <TabPane tab="Hub Console" key="3">
                      <HUBConsole
                        style={{
                          width: '90%'
                        }}
                        ref={this.hubConsoleRef}
                        outboundService={this.outboundServiceObj}
                      />
                    </TabPane>
                  )
                  : null
                } */}
              </Tabs>
              </div>
            </Col>
            <Col span={4}
              className="align-bottom"
              style={{
                verticalAlign: 'bottom',
                width:'100%',
                height: '100%',
                backgroundImage: `url(${mobile_right})`,
                backgroundPosition: 'right bottom',
                backgroundSize: '30vh',
                backgroundRepeat: 'no-repeat'
              }}>
              {/* <Row align="top">
                <Col span={24}>             
                  <Button type='primary' className='mt-2 float-right' style={ {height: '40px', backgroundColor: '#13AA90'} } onClick={() => {
                      this.setState({payeeLogsDrawerVisible: true})
                    }}>
                    <CaretLeftFilled style={ {fontSize: '18px'} }/> <Text style={{color: 'white', fontWeight: 'bold'}}>Receiver Bank Logs</Text>
                  </Button>   
                </Col>
              </Row> */}
              <Row align="bottom" className='h-100 mt-4'>
                <Col span={24}>
                  <Row className="float-right" style={{ marginRight: '3vh', marginBottom: '8vh', width: '24vh', height: '45vh'}}>
                    <Col span={24} >
                      <PayeeMobile 
                        ref={this.payeeMobileRef}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
      </Row>
      </>
    );
  }
}

export default MobileSimulator;
