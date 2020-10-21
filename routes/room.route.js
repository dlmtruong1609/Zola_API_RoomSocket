const express = require('express');
const router = express.Router();
const roomService = require('../services/room.service')
const roomValidator = require('../validators/room.validator')

router.post('/api/v0/rooms/single', roomValidator.validateCreateSingle(), roomService.createSingle)

router.post('/api/v0/rooms/group', roomValidator.validateCreateGroup(), roomService.createGroup)

router.get('/api/v0/rooms', roomService.getAll)

router.get('/api/v0/rooms/detail', roomValidator.validateFindById(), roomService.findRoomById)

router.delete('/api/v0/rooms', roomValidator.validateDeleteRoom(), roomService.deleteRoom)

module.exports = router;