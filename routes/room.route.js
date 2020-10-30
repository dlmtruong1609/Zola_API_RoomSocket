const express = require('express')
const router = express.Router()
const roomService = require('../services/room.service')
const roomValidator = require('../validators/room.validator')

// router.get('/', (req, res) => {
//   global.io.sockets.emit('username', { message: 'awca' })
// })
router.post('/api/v0/rooms/single', roomValidator.validateCreateSingle(), roomService.createSingle)

router.post('/api/v0/rooms/group', roomValidator.validateCreateGroup(), roomService.createGroup)

router.get('/api/v0/rooms', roomService.getAll)

router.get('/api/v0/rooms/detail', roomValidator.validateFindById(), roomService.findRoomById)

router.delete('/api/v0/rooms', roomValidator.validateDeleteRoom(), roomService.deleteRoom)

router.put('/api/v0/rooms/exit', roomValidator.validateExitRoom(), roomService.exitRoom)

router.put('/api/v0/rooms', roomValidator.validateUpdateRoom(), roomService.updateRoom)

router.put('/api/v0/rooms/members', roomValidator.validateAddMember(), roomService.addMember)

module.exports = router
