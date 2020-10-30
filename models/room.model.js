const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const RoomSchema = mongoose.Schema({
  name: String,
  messages: Array,
  users: Array,
  group: Boolean,
  created_At: String
})

RoomSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('Rooms', RoomSchema)
