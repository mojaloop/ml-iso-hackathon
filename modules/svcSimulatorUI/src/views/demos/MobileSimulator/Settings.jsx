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
import { Row, Col, Typography, Button, Table, Tag, Progress } from 'antd';
const { Text } = Typography

class Settings extends React.Component {
  state = {
    provisioningInProgress: false,
    provisioningStatus: '',
    progressSteps: {}
  }

  constructor () {
    super()
  }

  componentDidMount = async () => {
  }

  handleTestCaseProgressUpdate = (data) => {
    const progress = data.progress
    if (progress.status === "SUCCESS" || progress.status === "ERROR") {
      if (this.state.progressSteps[data.testCaseName]) {
        this.state.progressSteps[data.testCaseName].passedCount++ 
      } else {
        this.state.progressSteps[data.testCaseName] = {
          passedCount: 1,
          totalCount: data.testCaseRequestCount
        }
      }
      this.forceUpdate()
    }
  }

  handleNotificationEvents = (event) => {
    switch(event.type) {
      case 'testCaseProgress':
      {
        if (event.data && event.data.progress) {
          this.handleTestCaseProgressUpdate(event.data)
        }
        break
      }
      case 'testCaseFinished':
      {
        this.setState({provisioningInProgress: false, provisioningStatus: 'Completed'})
        break
      }
      case 'testCaseTerminated':
      {
        this.setState({provisioningInProgress: false, provisioningStatus: 'Terminated'})
        break
      }
    }
  }

  handleStartProvisioning = async (idNumber) => {
    this.setState({provisioningInProgress: true, provisioningStatus: '', progressSteps: {}})
    const resp = await this.props.outboundService.startProvisioning()
  }

  render() {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'stepName',
      },
      {
        title: 'Status',
        dataIndex: 'passCount',
      },
    ];

    const progressStepData = Object.entries(this.state.progressSteps).map((step,index) => {
      return {
        key: index,
        stepName: step[0],
        passCount: (
          <>
          <Progress percent={Math.round(step[1].passedCount*100/step[1].totalCount)} width={50} />
          { step[1].passedCount===step[1].totalCount? (<Tag className='ml-2' color="success">DONE</Tag>) : null }
          </>)
      }
    })

    return (
      <>
      <Row className='mt-4 ml-2'>
        <Col span={24}>
          <Button
            onClick={this.handleStartProvisioning}
            loading={this.state.provisioningInProgress}
          >
            Start Provisioning
          </Button>
        </Col>
      </Row>
      <Row className='mt-4 ml-2'>
        <Col span={24}>
          <Table
            columns={columns}
            dataSource={progressStepData}
            pagination={false}
            scroll={{ y: 540 }}
            loading={this.state.provisioningInProgress}
            footer={(pageData) => {
              return (
                <Text strong>{this.state.provisioningStatus}</Text>
              );
            }}
          />
        </Col>
      </Row>
      </>

    );
  }
}

export default Settings;
