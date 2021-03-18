const notify = require('../lib/notify')
const store = require('../lib/store')
const convert = require('xml-js')
const NRP = require('node-redis-pubsub')

class RedisMessageCollector {

  notificationEventFunction = (message) => {
    notify.broadcastLog(message)
    store.storeMessage(message)
  }

  apiBaseUrl = ''
  nrp = null

  constructor (appConfig) {
    const { redisConfig } = appConfig
    this.nrp = new NRP(redisConfig)

    this.nrp.on('iso:*', (data, channel) => {
      try {
        console.log(data)
        const convertedXml = convert.xml2json(data.xmlData, {compact: true, spaces: 4, ignoreComment: true})
        const jsonXml = JSON.parse(convertedXml)
        const nameSpace = jsonXml.Document['_attributes'].xmlns
        const description = this.processISONamespace(nameSpace)
        // console.log(JSON.parse(testXml))
        this.notificationEventFunction({
          category: 'payer',
          type: 'isoMessage',
          data: {
            ...data,
            description,
            convertedXml
          }
        })
      } catch(err) {
        console.log('ERROR: Can not convert XML to JSON.', err.message)
      }
    })

    this.nrp.on("error", function(){
      console.log('ERROR: Connecting to redis')
    })
  }

  disconnect () {
    this.nrp.quit()
  }

  processISONamespace = (nameSpace) => {
    if(!nameSpace.startsWith('urn:iso:std:iso:20022')) {
      throw new Error('The namespace is not valid iso20022 namespace')
    }
    const nsArr = nameSpace.split(':')
    return nsArr[nsArr.length  - 1]
  }

}

module.exports = RedisMessageCollector