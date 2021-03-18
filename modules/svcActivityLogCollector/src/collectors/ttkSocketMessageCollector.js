const notify = require('../lib/notify')
const store = require('../lib/store')
const socketIOClient = require('socket.io-client')

class TTKSocketMessageCollector {
  logTypes = {
    outbound: {
      socket: null,
      socketTopic: "newOutboundLog"
    },
    inbound: {
      socket: null,
      socketTopic: "newLog"
    },
    outboundProgress: {
      socket: null,
      socketTopic: "outboundProgress"
    }
  }
  notificationEventFunction = (message) => {
    notify.broadcastLog(message)
    store.storeMessage(message)
  }

  apiBaseUrl = ''

  constructor (appConfig) {
    const { ttkApiBaseUrl } = appConfig
    this.apiBaseUrl = ttkApiBaseUrl
    for (const logType of Object.keys(this.logTypes)) {
      const item = this.logTypes[logType]
      // console.log('Connecting to ' + this.apiBaseUrl)
      item.socket = socketIOClient(this.apiBaseUrl)
      item.socket.on(item.socketTopic, log => {
        this.handleNotificationLog( {...log, internalLogType: logType})
      });
    }
  }

  disconnect () {
    for (const logType of Object.keys(this.logTypes)) {
      this.logTypes[logType].socket.disconnect()
    }
  }

  // notifyPayerMonitorLog = (log) => {
  //   // Monitoring Logs
  //   this.notificationEventFunction({
  //     category: 'payerMonitorLog',
  //     type: 'log',
  //     data: {
  //       log: log
  //     }
  //   })
  // }

  notifyPayeeMonitorLog = (log) => {
    // Monitoring Logs
    this.notificationEventFunction({
      category: 'payeeMonitorLog',
      type: 'log',
      data: {
        log: log
      }
    })
  }

  // notifySettingsTestCaseProgress = (progress) => {
  //   const template = require('./template_provisioning.json')
  //   if (progress.status === 'FINISHED') {
  //     this.notificationEventFunction({
  //       category: 'settingsLog',
  //       type: 'testCaseFinished',
  //       data: {
  //         progress: progress
  //       }
  //     })
  //     // progress.totalResult
  //   } else if (progress.status === 'TERMINATED') {
  //     this.notificationEventFunction({
  //       category: 'settingsLog',
  //       type: 'testCaseTerminated',
  //       data: {
  //         progress: progress
  //       }
  //     })
  //   } else {
  //     let testCase = template.test_cases.find(item => item.id === progress.testCaseId)
  //     if (testCase) {
  //       // let request = testCase.requests.find(item => item.id === progress.requestId)
  //       // Update total passed count
  //       // const passedCount = (progress.testResult) ? progress.testResult.passedCount : 0
  //       // this.state.totalPassedCount += passedCount
  //       this.notificationEventFunction({
  //         category: 'settingsLog',
  //         type: 'testCaseProgress',
  //         data: {
  //           testCaseName: testCase.name,
  //           testCaseRequestCount: testCase.requests.length,
  //           progress: progress
  //         }
  //       })
  //     }
  //   }

  // }

  // notifyDFSPValues = (progress) => {
  //   if (progress.status === 'FINISHED') {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'getDFSPValuesFinished',
  //       data: {
  //         result: progress
  //       }
  //     })
  //   } else if (progress.status === 'TERMINATED') {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'getDFSPValuesTerminated',
  //       data: {
  //         result: progress
  //       }
  //     })
  //   }
  // }

  // notifyDFSPAccounts = (progress) => {
  //   if (progress.response.status === 200) {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'dfspAccountsUpdate',
  //       data: {
  //         dfspId: progress.requestSent.params.name,
  //         accountsData: progress.response.body
  //       }
  //     })
  //   }
  // }

  // notifyDFSPLimits = (progress) => {
  //   if (progress.response.status === 200) {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'dfspLimitsUpdate',
  //       data: {
  //         limitsData: progress.response.body
  //       }
  //     })
  //   }
  // }

  // notifyGetSettlements = (progress) => {
  //   if (progress.status === 'FINISHED') {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'getSettlementsFinished',
  //       data: {
  //         result: progress
  //       }
  //     })
  //   } else if (progress.status === 'TERMINATED') {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'getSettlementsTerminated',
  //       data: {
  //         result: progress
  //       }
  //     })
  //   } else {
  //     if (progress.response.status === 200) {
  //       this.notificationEventFunction({
  //         category: 'hubConsole',
  //         type: 'settingsUpdate',
  //         data: {
  //           settlements: progress.response.body
  //         }
  //       })
  //     }
  //   }
  // }
  // notifyGetParticipants = (progress) => {
  //   if (progress.response.status === 200) {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'participantsUpdate',
  //       data: {
  //         participants: progress.response.body
  //       }
  //     })
  //   }
  // }
  // notifyExecuteSettlement = (progress) => {
  //   if (progress.status === 'FINISHED') {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'executeSettlementFinished',
  //       data: {
  //         result: progress
  //       }
  //     })
  //   } else if (progress.status === 'TERMINATED') {
  //     this.notificationEventFunction({
  //       category: 'hubConsole',
  //       type: 'executeSettlementTerminated',
  //       data: {
  //         result: progress
  //       }
  //     })
  //   }
  // }

  handleNotificationLog = (log) => {
    const hubName = 'Mojaloop Switch'
    const payeeBankName = 'Green Bank'

    // *********** Payee Side Logs ********* //
    // Catch get Parties request
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: get')
          && log.resource
          && log.resource.method === 'get'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeeGetParties',
        data: {
          resource: log.resource,
          fromComponent: hubName,
          toComponent: payeeBankName,
          description: log.resource.method + ' ' + log.resource.path,
        }
      })
    }

    // Catch get Parties response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: get')
          && log.resource
          && log.resource.method === 'get'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeeGetPartiesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + '',
          fromComponent: payeeBankName,
          toComponent: hubName,
          description: log.additionalData.response.status + ''
        }
      })
    }
    // Catch put Parties request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutParties',
        data: {
          resource: log.resource,
          fromComponent: payeeBankName,
          toComponent: hubName,
          description: log.resource.method + ' ' + log.resource.path
        }
      })
    }

    // Catch put Parties response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/parties/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutPartiesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ' ' + log.additionalData.response.statusText,
          fromComponent: hubName,
          toComponent: payeeBankName,
          description: log.additionalData.response.status + ' ' + log.additionalData.response.statusText
        }
      })
    }
    // Catch post Quotes request
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: post')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/quotes')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePostQuotes',
        data: {
          resource: log.resource,
          requestBody: log.additionalData.request.body,
          fromComponent: hubName,
          toComponent: payeeBankName,
          description: log.resource.method + ' ' + log.resource.path
        }
      })
    }

    // Catch post Quotes response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: post')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/quotes')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePostQuotesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + '',
          fromComponent: payeeBankName,
          toComponent: hubName,
          description: log.additionalData.response.status + ' '
        }
      })
    }
    // Catch put Quotes request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/quotes/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutQuotes',
        data: {
          resource: log.resource,
          fromComponent: payeeBankName,
          toComponent: hubName,
          description: log.resource.method + ' ' + log.resource.path
        }
      })
    }

    // Catch put Quotes response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/quotes/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutQuotesResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ' ' + log.additionalData.response.statusText,
          fromComponent: hubName,
          toComponent: payeeBankName,
          description: log.additionalData.response.status + ' ' + log.additionalData.response.statusText
        }
      })
    }
    // Catch post Transfers request
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Request: post')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/transfers')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePostTransfers',
        data: {
          resource: log.resource,
          requestBody: log.additionalData.request.body,
          fromComponent: hubName,
          toComponent: payeeBankName,
          description: log.resource.method + ' ' + log.resource.path
        }
      })
    }

    // Catch post Transfers response
    if ( log.notificationType === 'newLog'
          && log.message.startsWith('Response: post')
          && log.resource
          && log.resource.method === 'post'
          && log.resource.path.startsWith('/transfers')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePostTransfersResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + '',
          fromComponent: payeeBankName,
          toComponent: hubName,
          description: log.additionalData.response.status + ' '
        }
      })
    }
    // Catch put Transfers request
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Request: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/transfers/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutTransfers',
        data: {
          resource: log.resource,
          requestBody: log.additionalData.request.body,
          fromComponent: payeeBankName,
          toComponent: hubName,
          description: log.resource.method + ' ' + log.resource.path
        }
      })
    }

    // Catch put Transfers response
    if ( log.notificationType === 'newOutboundLog'
          && log.message.startsWith('Response: put')
          && log.resource
          && log.resource.method === 'put'
          && log.resource.path.startsWith('/transfers/')
    ) {
      this.notifyPayeeMonitorLog(log)
      this.notificationEventFunction({
        category: 'payee',
        type: 'payeePutTransfersResponse',
        data: {
          resource: log.resource,
          responseStatus: log.additionalData.response.status + ' ' + log.additionalData.response.statusText,
          fromComponent: hubName,
          toComponent: payeeBankName,
          description: log.additionalData.response.status + ' ' + log.additionalData.response.statusText
        }
      })
    }

  }

}

module.exports = TTKSocketMessageCollector