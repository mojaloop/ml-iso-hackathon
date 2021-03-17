const apiServer = require('./lib/api-server')
const TTKSocketMessageCollector = require('./collectors/ttkSocketMessageCollector')
const RedisMessageCollector = require('./collectors/redisMessageCollector')

apiServer.startServer(7075)
this.ttkSocketMessageCollectorObj = new TTKSocketMessageCollector()
this.redisMessageCollectorObj = new RedisMessageCollector()
