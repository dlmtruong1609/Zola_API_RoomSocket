const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2');

const RoomSchema = mongoose.Schema({
    name: String,
    messages:  [{ type: Schema.Types.ObjectId, ref: 'Messages'}],
    users: Array,
    group: Boolean,
    createdAt: String
});

RoomSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Rooms', RoomSchema);