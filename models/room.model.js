const mongoose = require('mongoose');
const RoomSchema = mongoose.Schema({
    name: String,
    list_message: Number,
    type: Number,
    createdAt: String
});

module.exports = mongoose.model('Rooms', RoomSchema);