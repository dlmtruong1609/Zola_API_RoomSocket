const mongoose = require('mongoose');
const MessageSchema = mongoose.Schema({
    user_id: Number,
    content: Number,
    type: Number,
    createdAt: String
});

module.exports = mongoose.model('Messages', MessageSchema);