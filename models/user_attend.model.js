const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoomSchema = mongoose.Schema({
    room_id: String,
    user_ids:  String,
    createdAt: String
});

module.exports = mongoose.model('Rooms', RoomSchema);