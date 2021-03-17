const io = require('./api-server').socketIO

const broadcast = (log, type) => {
  io.emit(type, log)
}

const broadcastLog = (log) => {
  broadcast(log, 'activityLog')
}

module.exports = {
  broadcastLog
}
