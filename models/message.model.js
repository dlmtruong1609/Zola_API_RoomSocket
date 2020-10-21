const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2');

const MessageSchema = mongoose.Schema({
    user_id: Number,
    room: { type: Schema.Types.ObjectId, ref: 'Rooms' },
    content: Number,
    type: Number,
    createdAt: String
});

MessageSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Messages', MessageSchema);