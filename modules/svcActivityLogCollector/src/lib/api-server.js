const express = require('express')
const app = express()
const http = require('http').Server(app)
const socketIO = require('socket.io')(http)
const cors = require('cors')

const initServer = () => {
  // For CORS policy
  app.use(cors({
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    origin: true,
    credentials: true
  }))

  // For parsing incoming JSON requests
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true }))

  // app.use('/api/oauth2', require('./api-routes/oauth2'))

  // For front-end UI
  // if (fs.existsSync(path.join('public_html'))) {
  //   customLogger.logMessage('info', 'Folder public_html found: Serving Static Web UI', { notification: false })
  //   app.use(express.static(path.join('public_html')))
  //   app.get('*', (req, res) => {
  //     res.sendFile(process.cwd() + '/public_html/index.html')
  //   })
  // } else {
  //   customLogger.logMessage('warn', 'Folder public_html not found', { notification: false })
  // }
}

const startServer = port => {
  initServer()
  http.listen(port)
  console.log('API Server started on port ' + port)
}

const getApp = () => {
  if (!Object.prototype.hasOwnProperty.call(app, '_router')) { // To check whether app is initialized or not
    initServer()
  }
  return app
}

module.exports = {
  startServer,
  socketIO,
  getApp
}
