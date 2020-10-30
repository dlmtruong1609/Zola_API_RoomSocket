const Room = require('../models/room.model')
const request = require('request')
const util = require('util')

const createSingle = async (room, list_user_id = []) => {
  //
  room = new Room({
    name: room.name,
    group: false,
    created_At: new Date()
  })
  // lay user nhung vao room
  for (let index = 0; index < list_user_id.length; index++) {
    const options = await {
      method: 'GET',
      url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`,
      headers: {
        'x-access-token': process.env.TOKEN_3650
      }
    }
    const requestPromise = util.promisify(request)
    const result = await requestPromise(options)
    // danh dau de hien thi message tu ngay nay
    const user = await {
      ...JSON.parse(result.body).data,
      startDate: new Date(),
      deleted: false
    }
    room.users.push(user)
  }
  const success = await room.save()
  return success
}

module.exports = {
  createSingle: createSingle
}
