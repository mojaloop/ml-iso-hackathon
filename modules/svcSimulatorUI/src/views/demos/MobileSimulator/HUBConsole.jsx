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
import { Row, Col, Typography, Button, Table, Tag, Progress, Descriptions } from 'antd';
const { Text, Title } = Typography

class HUBConsole extends React.Component {
  state = {
    getDFSPValuesInProgress: false,
    getSettlementsInProgress: false,
    provisioningStatus: '',
    dfsps: {},
    settlements: [],
    participants: [],
    continueRefreshing: false
  }

  constructor () {
    super()
  }

  componentDidMount = async () => {
    setTimeout(() => {
      this.handleRefreshAll()
    }, 1000)
    // await this.handleDFSPValues()
    // await this.handleGetSettlements()
    // this.handleRefreshAll()
  }

  handleAccountsUpdate = (dfspId, accountsData) => {
    if (!this.state.dfsps[dfspId]) {
      this.state.dfsps[dfspId] = {}
    }
    this.state.dfsps[dfspId].accountsData = accountsData

    this.forceUpdate()
  }
  handleLimitsUpdate = (limitsData) => {
    console.log(limitsData)
    for (let i = 0; i < limitsData.length; i++) {
      if(limitsData[i].name && this.state.dfsps[limitsData[i].name]) {
        if (limitsData[i].limit && limitsData[i].limit.type === 'NET_DEBIT_CAP') {
          this.state.dfsps[limitsData[i].name].NET_DEBIT_CAP = {}
          this.state.dfsps[limitsData[i].name].NET_DEBIT_CAP[limitsData[i].currency] = limitsData[i].limit.value
        }
      }
    }

    this.forceUpdate()
  }
  handleSettlementsUpdate = (settlements) => {
    settlements.sort((a,b) => b.id - a.id )
    this.state.settlements = settlements

    this.forceUpdate()
  }
  handleParticipantsUpdate = (participants) => {
    this.state.participants = participants
  }

  handleNotificationEvents = (event) => {
    // console.log(event)
    switch(event.type) {
      case 'dfspAccountsUpdate':
      {
        if (event.data && event.data.dfspId && event.data.accountsData) {
          this.handleAccountsUpdate(event.data.dfspId, event.data.accountsData)
        }
        break
      }
      case 'dfspLimitsUpdate':
      {
        if (event.data && event.data.limitsData) {
          this.handleLimitsUpdate(event.data.limitsData)
        }
        break
      }
      case 'settingsUpdate':
      {
        if (event.data && event.data.settlements) {
          this.handleSettlementsUpdate(event.data.settlements)
        }
        break
      }
      case 'participantsUpdate':
      {
        if (event.data && event.data.participants) {
          this.handleParticipantsUpdate(event.data.participants)
        }
        break
      }
      case 'getDFSPValuesFinished':
      {
        this.setState({getDFSPValuesInProgress: false})
        if (this.state.continueRefreshing) {
          this.state.continueRefreshing = false
          this.handleGetSettlements()
        }
        break
      }
      case 'getDFSPValuesTerminated':
      {
        this.setState({getDFSPValuesInProgress: false})
        if (this.state.continueRefreshing) {
          this.state.continueRefreshing = false
        }
        break
      }
      case 'getSettlementsFinished':
      {
        this.setState({getSettlementsInProgress: false})
        break
      }
      case 'getSettlementsTerminated':
      {
        this.setState({getSettlementsInProgress: false})
        break
      }
      case 'executeSettlementFinished':
      {
        this.setState({executeSettlementInProgress: false})
        this.handleRefreshAll()
        break
      }
      case 'executeSettlementTerminated':
      {
        this.setState({executeSettlementInProgress: false})
        break
      }
    }
  }

  handleDFSPValues = async () => {
    this.setState({getDFSPValuesInProgress: true})
    const resp = await this.props.outboundService.getDFSPValues()
  }
  handleGetSettlements = async () => {
    this.setState({getSettlementsInProgress: true})
    const resp = await this.props.outboundService.getSettlements()
  }
  handleExecuteSettlement = async () => {
    this.setState({executeSettlementInProgress: true})
    const resp = await this.props.outboundService.executeSettlement()
  }

  handleRefreshAll = async () => {
    this.state.continueRefreshing = true
    this.handleDFSPValues()
    // const resp = await this.props.outboundService.getDFSPValues()
  }

  render() {
    const dfspValuesColumns = [
      {
        title: 'DFSP ID',
        dataIndex: 'dfspId',
      },
      {
        title: 'Position',
        dataIndex: 'position',
      },
      // {
      //   title: 'Settlement',
      //   dataIndex: 'settlement',
      // },
      {
        title: 'NET_DEBIT_CAP',
        dataIndex: 'NET_DEBIT_CAP',
      },
    ];
    const settlementColumns = [
      {
        title: 'ID',
        dataIndex: 'settlementId',
      },
      {
        title: 'Created',
        dataIndex: 'createdDate',
      }
    ];

    const dfspValuesData = Object.entries(this.state.dfsps).map((dfspItem,index) => {
      const positionData = dfspItem[1].accountsData.filter(item => item.ledgerAccountType === 'POSITION').reduce((prevVal,currVal,idx) => {
        const detail = currVal.currency + ': ' + currVal.value
        return idx == 0 ? detail : prevVal + ', ' + detail
      }, '')
      const netDebitCapData = dfspItem[1].NET_DEBIT_CAP && Object.entries(dfspItem[1].NET_DEBIT_CAP).reduce((prevVal,currVal,idx) => {
        const detail = currVal[0] + ': ' + currVal[1]
        return idx == 0 ? detail : prevVal + ', ' + detail
      }, '')
      // const settlementData = dfspItem[1].accountsData.filter(item => item.ledgerAccountType === 'SETTLEMENT').reduce((prevVal,currVal,idx) => {
      //   const detail = currVal.currency + ': ' + currVal.value
      //   return idx == 0 ? detail : prevVal + ', ' + detail
      // }, '')
      return {
        key: index,
        dfspId: dfspItem[0],
        position: positionData,
        // settlement: settlementData
        NET_DEBIT_CAP: netDebitCapData
      }
    })

    const settlementsData = this.state.settlements.map((settlementItem,index) => {
      let participantsInfo = settlementItem.participants.filter(item => item.accounts.length > 0).map(item => {
        return {
          id: item.id,
          amount: item.accounts[0].netSettlementAmount,
          ...item
        }
      })

      return {
        key: index,
        settlementId: settlementItem.id,
        createdDate: settlementItem.createdDate,
        participantsInfo: participantsInfo
      }
    })

    const displayParticipantsInfo = (info) => {
      let participantsDetailInfo = []
      for (let i = 0; i < info.length; i++) {
        for (let j = 0; j < info[i].accounts.length; j++) {
          const participantFound = this.state.participants.find(participant => participant.accounts.find(account => account.id === info[i].accounts[j].id))
          participantsDetailInfo.push({
            // ...info[i],
            name: participantFound.name,
            accountType: participantFound.accounts.find(account => account.id === info[i].accounts[j].id).ledgerAccountType,
            amount: info[i].accounts[j].netSettlementAmount
          })
        }
      }

      const descriptionItems = participantsDetailInfo.map( item => (
          <Descriptions.Item label={item.name + ' (' + item.accountType + ')'}>
            {item.amount.amount + ' ' + item.amount.currency}
          </Descriptions.Item>
      ))
      return (
        <Row>
          <Col span={24}>
            <Descriptions layout="horizontal" column={1} size='small' bordered>
              {descriptionItems}
            </Descriptions>
            {/* <pre style={{ margin: 0 }}>{JSON.stringify(info, null, 2)}{JSON.stringify(this.state.participants, null, 2)}</pre> */}
          </Col>
        </Row>
      )
    }
    

    return (
      <>
      <Row className='mt-4 ml-2'>
        <Col span={12} className='text-left'>
          <Button
              onClick={this.handleRefreshAll}
            >
              Refresh
          </Button>
          {/* <Button
            onClick={this.handleDFSPValues}
            loading={this.state.getDFSPValuesInProgress}
          >
            Get DFSP Data
          </Button> */}
        </Col>
        {/* <Col span={6}>
          <Button
            onClick={this.handleGetSettlements}
            loading={this.state.getSettlementsInProgress}
          >
            Get Settlements Data
          </Button>
        </Col> */}
        <Col span={12} className='text-right'>
          <Button
            type='primary'
            onClick={this.handleExecuteSettlement}
            loading={this.state.executeSettlementInProgress}
            danger
          >
            Execute Settlement
          </Button>
        </Col>
      </Row>
      <Row className='mt-4 ml-2'>
        <Col span={12}>
          <Table
            columns={dfspValuesColumns}
            dataSource={dfspValuesData}
            bordered
            title={() => <Text strong>Positions</Text>}
            pagination={false}
            scroll={{ y: 540 }}
            loading={this.state.getDFSPValuesInProgress}
            footer={(pageData) => {
              return (
                <Text strong>{this.state.provisioningStatus}</Text>
              );
            }}
          />
        </Col>
        <Col span={12}>
          <Table
            className='ml-2'
            columns={settlementColumns}
            dataSource={settlementsData}
            expandable={{
              expandedRowRender: record => displayParticipantsInfo(record.participantsInfo),
              rowExpandable: record => true,
            }}
            bordered
            title={() => <Text strong>Settlements</Text>}
            pagination={false}
            scroll={{ y: 540 }}
            loading={this.state.getSettlementsInProgress}
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

export default HUBConsole;
