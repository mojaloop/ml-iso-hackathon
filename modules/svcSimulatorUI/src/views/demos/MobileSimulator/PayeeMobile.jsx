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
import { Row, Col, Menu, Typography, Spin, Result } from 'antd';
const { Text, Title } = Typography

class PayeeMobile extends React.Component {
  state = {
    receivedAmount: null,
    payerComplexName: null,
    stage: null
  }

  componentDidMount = async () => {
  }

  resetState = () => {
    this.setState({receivedAmount: null, payerComplexName: null, stage: null})
  }

  handleNotificationEvents = (event) => {
    switch(event.type) {
      case 'payeeGetParties':
      {
        this.resetState()
        break
      }
      // case 'payeeGetPartiesResponse':
      // {
      //   break
      // }
      // case 'payeePutParties':
      // {
      //   break
      // }
      // case 'payeePutPartiesResponse':
      // {
      //   break
      // }
      case 'payeePostQuotes':
      {
        this.setState({payerComplexName: event.data.requestBody && event.data.requestBody.payer && event.data.requestBody.payer.personalInfo && event.data.requestBody.payer.personalInfo.complexName})
        break
      }
      // case 'payeePostQuotesResponse':
      // {
      //   break
      // }
      // case 'payeePutQuotes':
      // {
      //   break
      // }
      // case 'payeePutQuotesResponse':
      // {
      //   break
      // }
      case 'payeePostTransfers':
      {
        this.setState({receivedAmount: event.data.requestBody && event.data.requestBody.amount && event.data.requestBody.amount.amount})
        break
      }
      // case 'payeePostTransfersResponse':
      // {
      //   break
      // }
      case 'payeePutTransfers':
      {
        if (event.data.requestBody && event.data.requestBody.transferState === 'COMMITTED') {
          this.setState({stage: 'putTransfers'})
        }
        break
      }
      // case 'payeePutTransfersResponse':
      // {
      //   break
      // }
    }
  }

  getStageData = () => {
    switch(this.state.stage) {
      case 'putTransfers':
        return (
          <Row className='mt-2'>
            <Col span={24} className='text-center'>
              <Result
                status="success"
                title={'Received RWF ' + this.state.receivedAmount}
                // subTitle={'from ' + this.state.payerComplexName.lastName}
              />
            </Col>
          </Row>
        )
      default:
        return (
          <Row className='mt-4'>
            <Col span={24} className='text-center'>
              <Title level={3}>Welcome</Title>
            </Col>
          </Row>
        )
    }
  }

  render() {
    return (
      <>
        <Row className='mt-4' />
        { this.getStageData() }
      </>
    );
  }
}

export default PayeeMobile;
