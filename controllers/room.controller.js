/* eslint-disable camelcase */
const Room = require('../models/room.model')
const Response = require('../utils/response')
const CONSTANT = require('../constants/room.constant')
const { validationResult } = require('express-validator')
const request = require('request')
const util = require('util')
const mongoose = require('mongoose')

const roomService = require('../services/room.service')
const socketService = require('../services/socker.service')
const time = require('../utils/time')
require('dotenv').config()

const jwtHelper = require('../helpers/jwt.helper')
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

// format trả về err
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return {
    msg: msg,
    param: param
  }
}

const createSingle = async (req, res) => {
  // decode
  const decoded = await jwtHelper.verifyToken(
    req.headers['x-access-token'],
    accessTokenSecret
  )
  const accountDecode = decoded.data
  const userId = accountDecode.id
  //
  const list_user_id = [req.query.friend_id, userId]
  //
  const errs = validationResult(req).formatWith(errorFormatter)
  //
  const room = {
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    group: false,
    created_At: new Date()
  }
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    const success = await roomService.createSingle(room, list_user_id)
    if (success) {
      res
        .status(201)
        .send(new Response(false, CONSTANT.CREATE_ROOM_SUCCESS, room))
    }
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}

const createGroup = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter)
  const room = {
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    group: true,
    created_At: new Date()
  }
  // decode
  const decoded = await jwtHelper.verifyToken(
    req.headers['x-access-token'],
    accessTokenSecret
  )
  const accountDecode = decoded.data
  const userId = accountDecode.id
  //
  const list_user_id = req.body.list_user_id
  list_user_id.push(userId)
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    const success = await roomService.createGroup(room, list_user_id)
    if (success) {
      const list_user = []
      for (const id of list_user_id) {
        await list_user.push({
          id: id
        })
      }
      socketService.load_rooms(list_user)
      res.status(201).send(new Response(false, CONSTANT.CREATE_ROOM_SUCCESS, room))
    }
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}

const findRoomById = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter)
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    const id = req.query.id
    const room = await Room.findById(id)
    res.status(200).send(new Response(false, CONSTANT.FIND_SUCCESS, room))
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}

const getAll = async (req, res) => {
  try {
    const decoded = await jwtHelper.verifyToken(
      req.headers['x-access-token'],
      accessTokenSecret
    )
    const accountDecode = decoded.data
    const userId = accountDecode.id
    const rooms = await Room.find({ 'users.id': userId })
    for (let index = 0; index < rooms.length; index++) {
      const user = await rooms[index].users.find(item => item.id === userId)
      if (user.deleted === true) rooms.splice(index, 1)
      if (user.exited === true) rooms.splice(index, 1)
    }

    res.status(200).send(new Response(false, CONSTANT.FIND_SUCCESS, rooms || null))
  } catch (error) {
    console.log(error)
    res.status(400).send(new Response(true, error, error))
  }
}

const deleteRoom = async (req, res) => {
  const id = req.query.id
  const decoded = await jwtHelper.verifyToken(
    req.headers['x-access-token'],
    accessTokenSecret
  )
  const accountDecode = decoded.data
  const userId = accountDecode.id

  const errs = validationResult(req).formatWith(errorFormatter)
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    await Room.findOneAndUpdate(
      {
        _id: id,
        'users.id': userId
      },
      {
        $set: {
          'users.$.startDate': new Date(),
          'users.$.deleted': true
        }
      }
    )
    socketService.load_rooms([{
      id: userId
    }])
    res.status(200).send(new Response(false, CONSTANT.DELETE_SUCCESS, null))
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}

const exitRoom = async (req, res) => {
  const id = req.query.id
  const decoded = await jwtHelper.verifyToken(
    req.headers['x-access-token'],
    accessTokenSecret
  )
  const accountDecode = decoded.data
  const userId = accountDecode.id

  const errs = validationResult(req).formatWith(errorFormatter)
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    await Room.findOne({
      _id: id,
      'users.id': userId
    })
    await Room.findOneAndUpdate(
      {
        _id: id,
        'users.id': userId
      },
      {
        $set: {
          'users.$.exited': true
        }
      }
      // {
      //   users: room.users.filter((user) => {
      //     return user.id > userId || user.id < userId
      //   })
      // }
    )
    socketService.load_rooms([{
      id: userId
    }])
    res.status(200).send(new Response(false, CONSTANT.EXIT_SUCCESS, null))
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}

const updateRoom = async (req, res) => {
  const id = req.query.id
  const decoded = await jwtHelper.verifyToken(
    req.headers['x-access-token'],
    accessTokenSecret
  )
  const accountDecode = decoded.data
  const userId = accountDecode.id
  const name = req.body.name
  const errs = validationResult(req).formatWith(errorFormatter)
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    const room = await Room.findOneAndUpdate(
      {
        _id: id,
        'users.id': userId
      },
      {
        name: name
      }
    )
    socketService.load_rooms(room.users)
    res.status(200).send(new Response(false, CONSTANT.UPDATE_SUCCESS, null))
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}
const addMember = async (req, res) => {
  const roomId = req.query.id
  const decoded = await jwtHelper.verifyToken(
    req.headers['x-access-token'],
    accessTokenSecret
  )
  const accountDecode = decoded.data
  const userId = accountDecode.id
  const list_user_id = req.body.list_user_id
  const errs = validationResult(req).formatWith(errorFormatter)
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    // update list user after add
    const room = await Room.findById(roomId)

    for (let index = 0; index < list_user_id.length; index++) {
      const userExited = await room.users.find(user => user.id === list_user_id[index])
      console.log(list_user_id[index])
      if (userExited) {
        await Room.findOneAndUpdate(
          {
            _id: roomId,
            'users.id': list_user_id[index]
          },
          {
            $set: {
              'users.$.exited': false
            }
          }
        )
        list_user_id.splice(index, 1)
        index--
      }
    }
    // user in room not yet
    if (list_user_id.length !== 0) {
      const list_user = []
      // lay user nhung vao room
      for (let index = 0; index < list_user_id.length; index++) {
        const options = await {
          method: 'GET',
          url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`
        }
        const requestPromise = await util.promisify(request)
        const result = await requestPromise(options)
        // danh dau de hien thi message tu ngay nay
        const user = await {
          ...JSON.parse(result.body).data,
          startDate: new Date(),
          deleted: false,
          exited: false
        }
        list_user.push(user)
      }
      await Room.findOneAndUpdate(
        {
          _id: roomId,
          'users.id': userId
        },
        {
          $push: {
            users: {
              $each: list_user
            }
          }
        }
      )
    }
    socketService.load_rooms(room.users)
    res.status(200).send(new Response(false, CONSTANT.ADD_SUCCESS, null))
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}

const getAllUserRecentMessages = async (req, res) => {
  try {
    const decoded = await jwtHelper.verifyToken(
      req.headers['x-access-token'],
      accessTokenSecret
    )
    const accountDecode = decoded.data
    const userId = accountDecode.id
    const rooms = await Room.find(
      { 'users.id': userId }
    ).sort({ 'messages.createdAt': -1 }).limit(10)
    let users = []
    for (const user of [...rooms]) {
      const messages_length = user.messages.length
      for (let index = 0; index < user.users.length; index++) {
        user.users[index].lastTime = await messages_length !== 0 ? time.timeDifference(new Date(), user.messages[messages_length - 1].createdAt) : time.timeDifference(new Date(), user.created_At)
      }
      users = [...users, ...user.users]
    }
    // remove duplicate
    users = [...users].filter((user, index, array) => array.findIndex(item => (item.id === user.id)) === index)
    // remove self
    users.splice(users.findIndex(user => user.id === userId), 1)
    res.status(200).send(new Response(false, CONSTANT.FIND_SUCCESS, users || null))
  } catch (error) {
    res.status(400).send(new Response(true, error, error))
  }
}

const updateUserInAllRoom = async (req, res) => {
  const id = req.params.id
  console.log('id' + id)
  const name = req.body.name
  const avatar = req.body.avatar
  const user = {
    id,
    name,
    avatar
  }
  const result = await roomService.updateUserOfRoom(user)
  console.log(result)
  res.status(200).send(new Response(false, CONSTANT.UPDATE_SUCCESS, null))
}

module.exports = {
  createSingle: createSingle,
  createGroup: createGroup,
  getAll: getAll,
  findRoomById: findRoomById,
  deleteRoom: deleteRoom,
  exitRoom: exitRoom,
  updateRoom: updateRoom,
  addMember: addMember,
  getAllUserRecentMessages: getAllUserRecentMessages,
  updateUserInAllRoom: updateUserInAllRoom
}
