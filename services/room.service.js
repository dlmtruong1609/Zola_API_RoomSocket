const Room = require('../models/room.model')
const request = require('request')
const util = require('util')

const createSingle = async (room, list_user_id = []) => {
  //
  room = new Room(room)
  // lay user nhung vao room
  for (let index = 0; index < list_user_id.length; index++) {
    const options = await {
      method: 'GET',
      url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`

    }
    const requestPromise = util.promisify(request)
    const result = await requestPromise(options)
    // danh dau de hien thi message tu ngay nay
    const user = await {
      ...JSON.parse(result.body).data,
      startDate: new Date(),
      deleted: false,
      exited: false
    }
    room.users.push(user)
  }
  const success = await room.save()
  return success
}

const createGroup = async (room, list_user_id = []) => {
  room = await new Room(room)
  // lay user nhung vao room
  for (let index = 0; index < list_user_id.length; index++) {
    const options = await {
      method: 'GET',
      url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`

    }
    const requestPromise = await util.promisify(request)
    const result = await requestPromise(options)
    // danh dau de hien thi message tu ngay nay
    const user = await {
      ...JSON.parse(result.body).data,
      startDate: new Date(),
      deleted: false,
      exited: false
    }
    room.users.push(user)
  }
  const success = await room.save()
  return success
}

const updateUserOfRoom = async (user) => {
  console.log('avatar' + user.avatar)
  await Room.updateMany({ 'users.id': Number(user.id) }, {
    $set: { 'users.$.name': user.name, 'users.$.avatar': user.avatar }
  })
  return 'Success'
}

module.exports = {
  createSingle: createSingle,
  createGroup: createGroup,
  updateUserOfRoom: updateUserOfRoom
}
