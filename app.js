/* eslint-disable no-use-before-define */
const express = require('express')

const logger = require('morgan')

const roomRouter = require('./routes/room.route')

require('dotenv').config()

const cors = require('cors')
const app = express()
const http = require('http').Server(app)

// config socket
const io = require('socket.io')(http, {
  transports: ['polling']
})
const redisAdapter = require('socket.io-redis')
const redis = require('redis')
const pubClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST, { auth_pass: process.env.REDIS_PASS })
const subClient = pubClient.duplicate()
io.adapter(redisAdapter({ pubClient, subClient }))
const socker = require('./services/socker.service')
global.io = io.listen(http)
global.io.on('connection', socker.connection)

//
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// router
app.use('/', roomRouter)

// config mongo
const db = require('./config/db')
db.connectWithRetry()
// config cors
app.use(cors())
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

http.listen(process.env.PORT || '8080', function () {
  console.log(`listening on *:${process.env.PORT}`)
})
