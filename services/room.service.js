/* eslint-disable camelcase */
const Room = require('../models/room.model')
const Response = require('../utils/response')
const CONSTANT = require('../utils/room.constant')
const { validationResult } = require('express-validator')
const request = require('request')
const util = require('util')
const mongoose = require('mongoose')

const roomDao = require('../daos/room.dao')
require('dotenv').config()

const jwtHelper = require('../helpers/jwt.helper')
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const myCustomLabels = {
  totalDocs: 'itemCount',
  docs: 'itemsList',
  limit: 'perPage',
  page: 'currentPage',
  nextPage: 'next',
  prevPage: 'prev',
  totalPages: 'pageCount',
  pagingCounter: 'slNo',
  meta: 'paginator'
}

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
    const success = await roomDao.createSingle(room, list_user_id)
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
  console.log('acsvas' + list_user_id)
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    const success = await roomDao.createGroup(room, list_user_id)
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
    console.log(userId)
    const currentPage = req.query.currentPage
      // eslint-disable-next-line no-self-assign
      ? (req.query.currentPage = req.query.currentPage)
      : (req.query.currentPage = 1)
    const perPage = req.query.perPage
    const options = {
      page: currentPage,
      limit: perPage,
      customLabels: myCustomLabels,
      sort: { created_At: -1 }
    }
    Room.paginate(
      { users: { $elemMatch: { id: userId } } },
      options,
      // eslint-disable-next-line handle-callback-err
      (err, result) => {
        res
          .status(200)
          .send(
            new Response(false, CONSTANT.FIND_SUCCESS, result || null)
          )
      }
    )
  } catch (error) {
    res.status(500).send(new Response(true, error, error))
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
    Room.findOneAndUpdate(
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
      .then((room) => {
        res
          .status(200)
          .send(new Response(false, CONSTANT.DELETE_SUCCESS, null))
      })
      .catch((err) => {
        res
          .status(503)
          .send(
            new Response(true, CONSTANT.ERROR_FROM_MONGO, [
              { msg: err, param: '' }
            ])
          )
      })
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
    const room = await Room.findOne({
      _id: id,
      'users.id': userId
    })
    Room.findOneAndUpdate(
      {
        _id: id,
        'users.id': userId
      },
      {
        users: room.users.filter((user) => {
          return user.id > userId || user.id < userId
        })
      }
    )
      .then((result) => {
        res.status(200).send(new Response(false, CONSTANT.EXIT_SUCCESS, null))
      })
      .catch((err) => {
        res
          .status(503)
          .send(
            new Response(true, CONSTANT.ERROR_FROM_MONGO, [
              { msg: err, param: '' }
            ])
          )
      })
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
    Room.findOneAndUpdate(
      {
        _id: id,
        'users.id': userId
      },
      {
        name: name
      }
    )
      .then((result) => {
        res
          .status(200)
          .send(new Response(false, CONSTANT.UPDATE_SUCCESS, null))
      })
      .catch((err) => {
        res
          .status(503)
          .send(
            new Response(true, CONSTANT.ERROR_FROM_MONGO, [
              { msg: err, param: '' }
            ])
          )
      })
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array())
    res.status(400).send(response)
  }
}

const addMember = async (req, res) => {
  const id = req.query.id
  const decoded = await jwtHelper.verifyToken(
    req.headers['x-access-token'],
    accessTokenSecret
  )
  const accountDecode = decoded.data
  const userId = accountDecode.id
  const list_user_id = req.body.list_user_id
  const errs = validationResult(req).formatWith(errorFormatter)
  if (typeof errs.array() === 'undefined' || errs.array().length === 0) {
    const list_user = []
    // lay user nhung vao room
    for (let index = 0; index < list_user_id.length; index++) {
      const options = await {
        method: 'GET',
        url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`,
        headers: {
          'x-access-token': process.env.TOKEN_3650
        }
      }
      const requestPromise = await util.promisify(request)
      const result = await requestPromise(options)
      // danh dau de hien thi message tu ngay nay
      const user = await {
        ...JSON.parse(result.body).data,
        startDate: new Date(),
        deleted: false
      }
      list_user.push(user)
    }
    //
    Room.findOneAndUpdate(
      {
        _id: id,
        'users.id': userId
      },
      {
        $push: {
          users: {
            $each: list_user
          }
        }
      }
    ).then((result) => {
      res
        .status(200)
        .send(new Response(false, CONSTANT.ADD_SUCCESS, null))
    }).catch((err) => {
      res
        .status(503)
        .send(
          new Response(true, CONSTANT.ERROR_FROM_MONGO, [
            { msg: err, param: '' }
          ])
        )
    })
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
    Room.find(
      { 'users.id': userId }
    ).sort({ 'messages.createdAt': -1 }).limit(10).then(async result => {
      let users = []
      for (const user of [...result]) {
        const messages_length = user.messages.length
        for (let index = 0; index < user.users.length; index++) {
          user.users[index].lastTime = await messages_length !== 0 ? roomDao.timeDifference(new Date(), user.messages[messages_length - 1].createdAt) : roomDao.timeDifference(new Date(), user.created_At)
        }
        users = [...users, ...user.users]
      }
      // remove duplicate
      users = [...users].filter((user, index, array) => array.findIndex(item => (item.id === user.id)) === index)
      // remove self
      users.splice(users.findIndex(user => user.id === userId), 1)
      res
        .status(200)
        .send(
          new Response(false, CONSTANT.FIND_SUCCESS, users || null)
        )
    })
  } catch (error) {
    res.status(500).send(new Response(true, error, error))
  }
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
  getAllUserRecentMessages: getAllUserRecentMessages
}
