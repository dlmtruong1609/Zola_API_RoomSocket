const { check, query, header } = require('express-validator');
const CONSTANT = require('../utils/room.constant');
const Room = require('../models/room.model');
const jwtHelper = require("../helpers/jwt.helper");

const request = require('request')
const util = require('util')

require('dotenv').config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const validateCreateSingle = () => {
    return [
        check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(),
        check('name', CONSTANT.NAME_IS_6_32_SYMBOL).isLength({ min: 6, max: 32 }),
        query('friend_id', CONSTANT.FRIEND_ID_REQUIRED).not().isEmpty(),
        query('friend_id').custom(async (value, { req }) => {
            let options = {
                'method': 'GET',
                'url': `http://api_account_chat:3333/api/v0/users/detail?id=${value}`,
                'headers': {
                  'x-access-token': process.env.TOKEN_3650
                }
            }
            const requestPromise = util.promisify(request)
            let user = await requestPromise(options)
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
            console.log(userId);
            console.log(value);
            const room = await Room.findOne({$and: [{users: {$elemMatch: {id: Number(value)}}}, {users: {$elemMatch: {id: Number(userId)}}}]})
            console.log('asd ' + room);
            if (room) {
                throw new Error(CONSTANT.ROOM_EXIST)
            }
            return true
        })
    ]
}

const validateFindById = () => {
    return [
        query('id').custom( async (value, { req }) => {
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
                if(userId === room.users[index].id) return await true
            }
            throw new Error(CONSTANT.ACCESS_DENIED)
        })
    ]
}

module.exports = {
    validateCreateSingle: validateCreateSingle,
    validateFindById: validateFindById
}