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

class ActivityLog extends React.Component {
  state = {
    activityLog: []
  }

  constructor () {
    super()
  }

  componentDidMount = async () => {
    // setTimeout(() => {
    //   this.handleRefreshAll()
    // }, 1000)
  }

  addLog = (fromComponent, toComponent, description, extraData) => {
    this.state.activityLog.push({
      fromComponent,
      toComponent,
      description,
      extraData
    })
    this.forceUpdate()
  }

  render() {

    const activityLogColumns = [
      {
        title: 'From',
        dataIndex: 'fromComponent',
      },
      {
        title: 'To',
        dataIndex: 'toComponent',
      },
      {
        title: 'Description',
        dataIndex: 'description',
      }
    ];

    const activityLogData = this.state.activityLog.map((logItem,index) => {
      return {
        key: index,
        fromComponent: logItem.fromComponent,
        toComponent: logItem.toComponent,
        description: logItem.description,
        extraData: logItem.extraData
      }
    })

    const displayExtraData = (extraData) => {
      return (
        <Row>
          <Col span={24}>
            <pre style={{ margin: 0 }}>{extraData}</pre>
          </Col>
        </Row>
      )
    }

    return (
      <>
      <Row className='mt-4 ml-2'>
        <Col span={24}>
          <Table
            className='ml-2'
            columns={activityLogColumns}
            dataSource={activityLogData}
            expandable={{
              expandedRowRender: record => displayExtraData(record.extraData),
              rowExpandable: record => record.extraData,
            }}
            bordered
            pagination={false}
            scroll={{ y: 540 }}
          />
        </Col>
      </Row>
      </>

    );
  }
}

export default ActivityLog;
