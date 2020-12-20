const express = require('express')
const router = express.Router()
const roomController = require('../controllers/room.controller')
const roomValidator = require('../validators/room.validator')

// router.get('/', (req, res) => {
//   global.io.sockets.emit('username', { message: 'awca' })
// })
router.post('/api/v0/rooms/single', roomValidator.validateCreateSingle(), roomController.createSingle)

router.post('/api/v0/rooms/group', roomValidator.validateCreateGroup(), roomController.createGroup)

router.get('/api/v0/rooms', roomController.getAll)

router.get('/api/v0/rooms/:id', roomValidator.validateFindById(), roomController.findRoomById)

router.delete('/api/v0/rooms', roomValidator.validateDeleteRoom(), roomController.deleteRoom)

router.put('/api/v0/rooms/exit', roomValidator.validateExitRoom(), roomController.exitRoom)

router.put('/api/v0/rooms', roomValidator.validateUpdateRoom(), roomController.updateRoom)

router.put('/api/v0/rooms/members', roomValidator.validateAddMember(), roomController.addMember)

router.get('/api/v0/rooms/messages/recent', roomController.getAllUserRecentMessages)

router.put('/api/v0/rooms/users/:id', roomController.updateUserInAllRoom)

module.exports = router
