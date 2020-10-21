const { check, query, header } = require('express-validator');
const CONSTANT = require('../utils/room.constant');
const Room = require('../models/room.model');
const jwtHelper = require("../helpers/jwt.helper");
require('dotenv').config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const validateCreateSingle = () => {
    return [
        check('name', CONSTANT.NAME_IS_REQUIRED).not().isEmpty(),
        check('name', CONSTANT.NAME_IS_6_32_SYMBOL).isLength({ min: 6, max: 32 }),
        check('list_user_id', CONSTANT.LIST_USER_ID_REQUIRED).not().isEmpty(),
        check('list_user_id').custom((value, { req }) => {
            if(value.length !== 2) {
                throw new Error(CONSTANT.LIST_USER_ID_LENGTH_IS_2)
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