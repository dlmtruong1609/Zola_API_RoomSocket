/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
const Room = require('../models/room.model')

const roomDao = require('../daos/room.dao')
const mongoose = require('mongoose')
const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$')

const connection = (socket) => {
  socket.on('join', async (info) => {
    // client.join(name)
    socket.info = info
    const room = checkForHexRegExp.test(info.roomId) ? await Room.findById(info.roomId) : undefined
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
        await roomDao.createSingle(roomData, list_user_id)
        // refresh rooms
        global.io.sockets.emit('newRoom', roomData)
        global.io.sockets.emit('load_rooms', rooms)
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

  const loadRoom = async (room) => {
    socket.join(room._id)
    const message = []
    const userCurrentLogin = room.users.find((item) => item.id === socket.info.list_user[socket.info.positionUserCurrent].id)
    console.log(userCurrentLogin)
    for (let index = 0; index < room.messages.length; index++) {
      if (room.messages[index].createdAt > userCurrentLogin.startDate) {
        await message.push(room.messages[index])
      }
    }
    global.io.sockets.in(room._id).emit('load_message', message)
  }

  socket.on('send_and_recive', async (your_message) => {
    const room = await Room.findById(socket.info.roomId)
    if (room) {
      socket.join(room._id)
      const id = mongoose.Types.ObjectId()
      const messages = {
        user: socket.info.list_user[socket.info.positionUserCurrent],
        _id: id,
        content: your_message,
        type: 'String',
        createdAt: new Date()
      }
      await Room.update({ _id: room._id, 'users.id': socket.info.list_user[socket.info.positionUserCurrent].id }, {
        $push: {
          messages: messages
        },
        $set: {
          'users.$.deleted': false
        }
      })
      global.io.sockets.in(room._id).emit('send_and_recive', messages)
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

  socket.on('rooms_request', async (userId) => {
    // find rooms sort by created_At
    const rooms = await Room.find({ users: { $elemMatch: { id: userId } } }).sort({ 'messages.createdAt': -1, created_At: 1 })
    global.io.sockets.emit('load_rooms', rooms)
  })

  socket.on('leave', (room) => {
    socket.leave(room)
  })
  // event fired when the chat room is disconnected
  socket.on('disconnect', () => {
    // users = this.users.filter((user) => user.socketId !== client.id)
    // console.log(socket.user.name + 'disconnect')
  })
}
module.exports = {
  connection: connection
}
