/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
const Room = require('../models/room.model')

const roomDao = require('../daos/room.dao')
const mongoose = require('mongoose')
const connection = (socket) => {
  socket.on('join', async (info) => {
    // client.join(name)
    socket.info = info
    const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: Number(socket.info.friend_in_room.id) } } }, { users: { $elemMatch: { id: Number(socket.info.user.id) } } }, { group: false }] })
    console.log(room._id)
    if (!room) {
      const roomData = {
        name: ''
      }
      const list_user_id = [socket.info.user.id, socket.info.friend_in_room.id]
      await roomDao.createSingle(roomData, list_user_id)
    } else {
      socket.join(room._id)
      for (let index = 0; index < room.messages.length; index++) {
        global.io.sockets.in(room._id).emit('load_message', socket.info.user.id, room.messages[index])
      }
    }
    // global.io.sockets.emit('is_online', '🔵 <i>' + socket.user.name + ' connected</i>')
  })
  socket.on('send_and_recive', async (your_message) => {
    const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: Number(socket.info.friend_in_room.id) } } }, { users: { $elemMatch: { id: Number(socket.info.user.id) } } }, { group: false }] })
    if (room) {
      socket.join(room._id)
      const id = mongoose.Types.ObjectId()
      const messages = {
        user: socket.info.user,
        _id: id,
        content: your_message,
        type: 'String',
        createdAt: new Date()
      }
      await Room.update({ _id: room._id, 'users.id': socket.info.user.id }, {
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
    const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: Number(socket.info.friend_in_room.id) } } }, { users: { $elemMatch: { id: Number(socket.info.user.id) } } }, { group: false }] })
    // cach nay anh huong perform
    const newListMessage = await room.messages.filter(mess => String(mess._id) !== String(your_message_id))
    console.log(JSON.stringify(newListMessage))
    await Room.findByIdAndUpdate(room._id, {
      $set: {
        messages: newListMessage
      }
    })
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
