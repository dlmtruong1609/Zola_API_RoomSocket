/* eslint-disable no-use-before-define */
const express = require('express')

const logger = require('morgan')

const roomRouter = require('./routes/room.route')
const messageRouter = require('./routes/message.route')

require('dotenv').config()

const cors = require('cors')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, {
  transports: ['polling']
})
const socker = require('./services/socker.service')
global.io = io.listen(http)
global.io.on('connection', socker.connection)

// global.io.sockets.on('connection', function (socket) {
//   socket.on('username', function (username) {
//     socket.username = username
//     global.io.emit('is_online', '🔵 <i>' + socket.username + ' join the chat..</i>')
//   })

//   socket.on('disconnect', function (username) {
//     global.io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>')
//   })

//   socket.on('chat_message', function (message) {
//     global.io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message)
//   })
// })

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/', roomRouter)
app.use('/', messageRouter)
app.use(cors())

const mongoose = require('mongoose')

const mongoUrl = `${process.env.DB_URL}`

// Thiết lập một kết nối mongoose chạy đến khi nào kết nối được mới tiếp tục
const connectWithRetry = function () {
  return mongoose.connect(mongoUrl, { useNewUrlParser: true, useFindAndModify: false }, (err) => {
    if (err) {
      console.error('Failed to connect to mongo on startup - retrying in 5 sec', err)
      setTimeout(connectWithRetry, 5000)
    }
  })
}
connectWithRetry()

// Ép Mongoose sử dụng thư viện promise toàn cục
mongoose.Promise = global.Promise

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

http.listen(process.env.PORT || '8080', function () {
  console.log(`listening on *:${process.env.PORT}`)
})
