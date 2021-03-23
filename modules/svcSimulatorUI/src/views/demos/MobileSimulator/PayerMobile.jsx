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
import { Row, Col, InputNumber, Input, Typography, Skeleton, Card, Button, Result } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
const { Text } = Typography

class PayerMobile extends React.Component {
  state = {
    stage: null,
    amount: 100,
    idType: 'MSISDN',
    idValue: '+250-788301607',
    quotesRequest: {},
    quotesResponse: {},
    transfersResponse: {}
  }

  constructor () {
    super()
  }

  componentDidMount = async () => {
  }

  handleNotificationEvents = (event) => {
    switch(event.type) {
      case 'postQuotes':
      {
        this.setState({quotesRequest: event.data.quotesRequest})
        break
      }
      case 'postQuotesResponse':
      {
        break
      }
      case 'putQuotes':
      {
        this.setState({stage: 'putQuotes', quotesResponse: event.data.quotesResponse})
        break
      }
      case 'putQuotesResponse':
      {
        break
      }
      case 'postTransfers':
      {
        break
      }
      case 'postTransfersResponse':
      {
        break
      }
      case 'putTransfers':
      {
        this.setState({stage: 'putTransfers', transfersResponse: event.data.transfersResponse})
        break
      }
      case 'putTransfersResponse':
      {
        break
      }
    }
  }

  getStageData = () => {
    switch(this.state.stage) {
      case 'postQuotes':
      case 'postTransfers':
        return <Skeleton active />

      case 'putQuotes':
        return (
          <Card className='mr-3'>
            <Row>
              <Col span={24}>
                <Text>Do you want to continue to send <b>RWF {this.state.quotesResponse && this.state.quotesResponse.sendAmount}</b> to <b>{this.state.quotesResponse && this.state.quotesResponse.receivingPartyName && (this.state.quotesResponse.receivingPartyName + ' @ ' + this.state.quotesResponse.receivingPartyMsisdn)}?</b></Text>
              </Col>
            </Row>
            {/* <Row>
              <Col span={12}>
                <Text>Fee:</Text>
              </Col>
              <Col span={12}>
                <Text strong>${this.state.quotesResponse && this.state.quotesResponse.transferFee}</Text>
              </Col>
            </Row> */}
            <Row className='mt-4'>
              <Col span={12} className='text-center'>
                <Button type='primary' shape="round" danger onClick={this.handleCancel}>Cancel</Button>
              </Col>
              <Col span={12} className='text-center'>
                <Button type='primary' shape="round" success onClick={this.handleSend}>Proceed</Button>
              </Col>
            </Row>
            
          </Card>
        )
      case 'putTransfers':
        return (
          <Row>
            <Col span={24} className='text-center'>
              {
                this.state.transfersResponse && this.state.transfersResponse.transactionId && this.state.transfersResponse.transactionId.length > 0
                ? (
                  <Result
                    status="success"
                    title={'Sent RWF ' + this.state.amount}
                  />
                )
                : (
                  <Result
                    status="error"
                    title="Error"
                  />
                )
              }
            </Col>
          </Row>
        )
      default:
        return (
          <Card className='mr-3'>
            <Row className='mt-1'>
              <Col span={24}>
                <Text strong>Enter User ID</Text>
                <Input
                  className='ml-2'
                  placeholder='User ID'
                  defaultValue={'+250-788301607'}
                  onChange={(newID) => {
                    // console.log('newID:')
                    // console.log(newID.target.value)
                    this.setState({idValue: newID.target.value})
                  }}
                />
              </Col>
            </Row>
            <Row className='mt-4'>
              <Col span={24}>
                <Text strong>Amount:</Text>
                <InputNumber
                  className='ml-2'
                  value={this.state.amount}
                  onChange={(newNumber) => {
                    this.setState({amount: newNumber})
                  }}
                  // formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  // parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Col>
            </Row>
            <Row className='mt-4'>
              <Col span={24} className='text-center'>
                <Button type='primary' shape="round" danger onClick={this.handleGetQuote}>Get Quote</Button>
              </Col>
            </Row>
            
          </Card>
        )
    }
  }

  handleGetQuote = async (e) => {
    this.setState({stage: 'postQuotes'})
    let resp = null
    // console.log(`${this.state}`)
    resp = await this.props.outboundService.postQuotes(this.state.idValue, this.state.amount.toString(), 'RWF')
    const response = {stage: 'putQuotes', quotesResponse: resp && resp.data}
    // console.log(resp.data)
    // console.log(response)
    this.setState(response)

  }

  handleSend = async (e) => {
    this.setState({stage: 'postTransfers'})
    let resp = null
    if (this.state.quotesResponse) {
      resp = await this.props.outboundService.postTransfers(this.state.quotesResponse.transactionId)
    } 
    this.setState({stage: 'putTransfers', transfersResponse: resp && resp.data})
  }
  
  handleCancel = (e) => {
    this.setState({stage: null})
    // this.props.resetEverything()  
  }

  render() {
    return (
      <>

      <Row className='mt-4 ml-2'>
        <Col span={24}>
          { this.getStageData() }
        </Col>
      </Row>
      </>

    );
  }
}

export default PayerMobile;
