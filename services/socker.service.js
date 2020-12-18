/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
const Room = require('../models/room.model')
require('dotenv').config()
const roomService = require('./room.service')
const mongoose = require('mongoose')
const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$')
const redis = require('redis')
const client = redis.createClient('19403', 'redis-19403.c10.us-east-1-4.ec2.cloud.redislabs.com', { auth_pass: process.env.REDIS_PASS, detect_buffers: true })

const connection = (socket) => {
  // notify user online
  socket.on('is-online', async (userId) => {
    client.lrange('list_user_online', 0, -1, async (_err, value) => {
      if (!value) value = []
      const userOnline = value
      const id = await userOnline.find(item => Number(item) === userId)
      if (!id) {
        userOnline.push(userId)
        client.set(`${socket.id}`, userId, (_error, _value) => {
          console.log(_error)
        })
        client.lpush('list_user_online', userId, (_err, _reply) => {
          console.log(_err)
        })
      }
      global.io.sockets.emit('is-online', userOnline)
    })
  })
  socket.on('join', async (info) => {
    // data example from client
    // const info = {
    //   list_user: [
    //     {
    //       name: 'Magic Nga',
    //       id: 60
    //     },
    //     {
    //       name: 'Vi Nam',
    //       id: 19
    //     }
    //   ],
    //   roomId: '5fc26dadd5c4f700282c5333',
    //   // if the group Room ID is Required
    //   // If the single room then field roomId is not required
    //   positionUserCurrent: 1 // This is the location of the currently logged in user (now is Vi Nam)
    // }
    socket.info = info
    let room
    if (checkForHexRegExp.test(info.roomId)) room = await Room.findById(info.roomId)
    // new room
    const roomData = {
      _id: mongoose.Types.ObjectId(),
      name: '',
      group: false,
      created_At: new Date()
    }
    // find rooms sort by created_At
    const rooms = await Room.find({ users: { $elemMatch: { id: socket.info.list_user[socket.info.positionUserCurrent].id } } }).sort({ 'messages.createdAt': -1, created_At: -1 })
    // check room id hop le va tao room voi id moi
    checkForHexRegExp.test(info.roomId) ? roomData._id = info.roomId : info.roomId = ''
    const list_user_id = []
    for (let index = 0; index < info.list_user.length; index++) {
      await list_user_id.push(info.list_user[index].id)
    }
    //
    if (!room && info.list_user.length === 2) {
      // room nay de kiem tra if chi co 2 user
      const roomSingle = await Room.findOne({ $and: [{ users: { $elemMatch: { id: Number(socket.info.list_user[0].id) } } }, { users: { $elemMatch: { id: Number(socket.info.list_user[1].id) } } }, { group: false }] })
      if (!roomSingle) {
        await roomService.createSingle(roomData, list_user_id)
        // refresh rooms
        socket.info.roomId = roomData._id
        socket.join(roomData._id)
        global.io.sockets.emit('newRoom', roomData)

        // load rooms
        load_rooms(socket.info.list_user)
        return
      } else {
        loadRoom(roomSingle)
        socket.info.roomId = roomSingle._id
      }
    }
    if (room) {
      loadRoom(room)
    }
    // global.io.sockets.emit('is_online', '🔵 <i>' + socket.user.name + ' connected</i>')
  })

  /**
 * This method to load detail room
 * @param {*} room
 */
  const loadRoom = async (room) => {
    socket.info.roomId = room._id
    socket.join(room._id)
    const message = []
    const userCurrentLogin = room.users.find((item) => item.id === socket.info.list_user[socket.info.positionUserCurrent].id)
    for (let index = 0; index < room.messages.length; index++) {
      if (room.messages[index].createdAt > userCurrentLogin.startDate) {
        await message.push(room.messages[index])
      }
    }
    global.io.sockets.in(room._id).emit('load_message', message)
  }

  /* data example
  obj = {
    message: "Hello",
    type: "string" or image, video...
  }
  */
  socket.on('send_and_recive', async (obj) => {
    const room = await Room.findById(socket.info.roomId)
    if (room) {
      socket.join(room._id)
      const id = mongoose.Types.ObjectId()
      const messages = {
        user: {
          id: socket.info.list_user[socket.info.positionUserCurrent].id
        },
        _id: id,
        content: obj.message,
        type: obj.type,
        createdAt: new Date()
      }
      await Room.update({ _id: room._id, 'users.deleted': false }, {
        $push: {
          messages: messages
        },
        $set: {
          'users.$.deleted': false
        }
      })
      global.io.sockets.in(room._id).emit('send_and_recive', messages)
      load_rooms(socket.info.list_user)
    }
  })

  socket.on('delete_message', async (your_message_id) => {
    const room = await Room.findById(socket.info.roomId)
    // cach nay anh huong perform
    const newListMessage = await room.messages.filter(mess => String(mess._id) !== String(your_message_id))
    await Room.findByIdAndUpdate(room._id, {
      $set: {
        messages: newListMessage
      }
    })
  })

  /* catch event emit from client to load all room of user */
  socket.on('load_rooms', async (list_user) => {
    // find rooms sort by created_At
    load_rooms(list_user)
  })

  socket.on('typing', () => {})

  socket.on('leave', (roomId) => {
    socket.leave(roomId)
  })
  // event fired when the chat room is disconnected
  socket.on('disconnect', () => {
    client.get(`${socket.id}`, (_err, userId) => {
      console.log(userId + 'as')
      if (userId) {
        global.io.sockets.emit('is-disconnect', userId)
        client.del(`${socket.id}`, (_error, _reply) => {
          console.log(_error)
        })
        client.blpop('list_user_online', userId, (_err, _reply) => {
          console.log(_err)
        })
      }
    })
  })
}

/* method to load all room of user */
const load_rooms = async (list_user) => {
  for (const user of list_user) {
    const rooms = await Room.find({ 'users.id': user.id }).sort({ 'messages.createdAt': -1, created_At: 1 })
    for (let index = 0; index < rooms.length; index++) {
      const userInRooms = await rooms[index].users.find(item => item.id === user.id)
      if (userInRooms.deleted === true) rooms.splice(index, 1)
      if (user.exited === true) rooms.splice(index, 1)
    }
    global.io.sockets.emit('load_rooms', {
      rooms: rooms,
      id: user.id
    })
  }
}

const clearRedis = () => {
  client.flushdb(function (_err, succeeded) {
    console.log(_err)
  })
}
clearRedis() // run every server reset
module.exports = {
  connection: connection,
  load_rooms: load_rooms
}
