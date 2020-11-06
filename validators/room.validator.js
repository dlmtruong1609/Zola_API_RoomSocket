/* eslint-disable camelcase */
const { check, query } = require('express-validator')
const CONSTANT = require('../utils/room.constant')
const Room = require('../models/room.model')
const jwtHelper = require('../helpers/jwt.helper')

const request = require('request')
const util = require('util')

require('dotenv').config()

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const validateCreateSingle = () => {
  return [
    check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(),
    check('name', CONSTANT.NAME_IS_6_32_SYMBOL).isLength({ min: 1, max: 1 }),
    query('friend_id', CONSTANT.FRIEND_ID_REQUIRED).not().isEmpty(),
    query('friend_id').custom(async (value, { req }) => {
      const options = {
        method: 'GET',
        url: `http://api_account_chat:3333/api/v0/users/detail?id=${value}`,
        headers: {
          'x-access-token': process.env.TOKEN_3650
        }
      }
      const requestPromise = util.promisify(request)
      const user = await requestPromise(options)
      if (!JSON.parse(user.body).data) {
        throw new Error(CONSTANT.USER_NOT_FOUND)
      }
      // valid room
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      console.log(userId)
      console.log(value)
      const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: Number(value) } } }, { users: { $elemMatch: { id: Number(userId) } } }, { group: false }] })
      console.log('asd ' + room)
      if (room) {
        throw new Error(CONSTANT.ROOM_EXIST)
      }
      return true
    })
  ]
}

const validateFindById = () => {
  return [
    query('id').custom(async (value, { req }) => {
      const room = await Room.findById(value)
      if (!room) {
        throw new Error(CONSTANT.ROOM_NOT_FOUND)
      }
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      for (let index = 0; index < room.users.length; index++) {
        if (userId === room.users[index].id) return await true
      }
      throw new Error(CONSTANT.ACCESS_DENIED)
    })
  ]
}

const validateCreateGroup = () => {
  return [
    check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(),
    check('name', CONSTANT.NAME_IS_6_32_SYMBOL).isLength({ min: 1, max: 1 }),
    check('list_user_id', CONSTANT.LIST_USER_ID_REQUIRED).not().isEmpty(),
    check('list_user_id').custom((value, { req }) => {
      if (value.length < 2) {
        throw new Error(CONSTANT.NUMBER_USER_MUST_GREATER_THAN_2)
      }
      return true
    }),
    check('list_user_id').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      const list_user_id = [...value]
      list_user_id.push(userId)
      for (let i = 0; i < list_user_id.length; i++) {
        const options = {
          method: 'GET',
          url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[i]}`,
          headers: {
            'x-access-token': process.env.TOKEN_3650
          }
        }
        const requestPromise = util.promisify(request)
        const user = await requestPromise(options)
        if (!JSON.parse(user.body).data) {
          throw new Error(CONSTANT.USER_NOT_FOUND)
        }
        for (let j = i + 1; j < list_user_id.length; j++) {
          if (list_user_id[i] === list_user_id[j]) {
            throw new Error(CONSTANT.ID_USER_DUPLICATE)
          }
        }
      }
    })
  ]
}

const validateDeleteRoom = () => {
  return [
    query('id', CONSTANT.ID_IS_REQUIRED).not().isEmpty(),
    query('id').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: userId } } }, { _id: value }] })
      if (!room) {
        throw new Error(CONSTANT.ROOM_NOT_FOUND)
      }
    })
  ]
}

const validateExitRoom = () => {
  return [
    query('id', CONSTANT.ID_IS_REQUIRED).not().isEmpty(),
    query('id').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: userId } } }, { _id: value }, { group: true }] })
      if (!room) {
        throw new Error(CONSTANT.ROOM_NOT_FOUND)
      }
    })
  ]
}

const validateUpdateRoom = () => {
  return [
    check('name', CONSTANT.NAME_IS_6_32_SYMBOL).isLength({ min: 1, max: 1 }),
    query('id', CONSTANT.ID_IS_REQUIRED).not().isEmpty(),
    query('id').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: userId } } }, { _id: value }] })
      if (!room) {
        throw new Error(CONSTANT.ROOM_NOT_FOUND)
      }
    })
  ]
}

const validateAddMember = () => {
  return [
    check('list_user_id', CONSTANT.LIST_USER_ID_REQUIRED).not().isEmpty(),
    check('list_user_id').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      const list_user_id = [...value]
      list_user_id.push(userId)
      for (let i = 0; i < list_user_id.length; i++) {
        const options = {
          method: 'GET',
          url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[i]}`,
          headers: {
            'x-access-token': process.env.TOKEN_3650
          }
        }
        const requestPromise = util.promisify(request)
        const user = await requestPromise(options)
        if (!JSON.parse(user.body).data) {
          throw new Error(CONSTANT.USER_NOT_FOUND)
        }
        for (let j = i + 1; j < list_user_id.length; j++) {
          if (list_user_id[i] === list_user_id[j]) {
            throw new Error(CONSTANT.ID_USER_DUPLICATE)
          }
        }
      }
    }),
    query('id', CONSTANT.ID_IS_REQUIRED).not().isEmpty(),
    query('id').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: userId } } }, { _id: value }, { group: true }] })
      if (!room) {
        throw new Error(CONSTANT.ROOM_NOT_FOUND)
      }
    }),
    query('id').custom(async (value, { req }) => {
      const decoded = await jwtHelper.verifyToken(
        req.headers['x-access-token'],
        accessTokenSecret
      )
      const accountDecode = decoded.data
      const userId = accountDecode.id
      const room = await Room.findOne({ $and: [{ users: { $elemMatch: { id: userId } } }, { _id: value }, { group: true }] })

      const list_user_id = await req.body.list_user_id
      for (let i = 0; i < room.users.length; i++) {
        for (let j = 0; j < list_user_id.length; j++) {
          if (room.users[i].id === list_user_id[j]) {
            throw new Error(CONSTANT.USER_HAS_PARTICIPATED)
          }
        }
      }
    })
  ]
}
module.exports = {
  validateCreateSingle: validateCreateSingle,
  validateFindById: validateFindById,
  validateCreateGroup: validateCreateGroup,
  validateDeleteRoom: validateDeleteRoom,
  validateExitRoom: validateExitRoom,
  validateUpdateRoom: validateUpdateRoom,
  validateAddMember: validateAddMember
}
