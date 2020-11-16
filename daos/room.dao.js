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

const createGroup = async (room, list_user_id = []) => {
  room = await new Room(room)
  // lay user nhung vao room
  for (let index = 0; index < list_user_id.length; index++) {
    const options = await {
      method: 'GET',
      url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`,
      headers: {
        'x-access-token': process.env.TOKEN_3650
      }
    }
    const requestPromise = await util.promisify(request)
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

const timeDifference = (current, previous) => {
  var msPerMinute = 60 * 1000
  var msPerHour = msPerMinute * 60
  var msPerDay = msPerHour * 24
  var msPerMonth = msPerDay * 30
  var msPerYear = msPerDay * 365

  var elapsed = new Date(current) - new Date(previous)
  console.log(elapsed)
  console.log(current + ' asc ' + previous)
  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + ' seconds ago'
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + ' minutes ago'
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + ' hours ago'
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + ' days ago'
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + ' months ago'
  } else {
    return Math.round(elapsed / msPerYear) + ' years ago'
  }
}
module.exports = {
  createSingle: createSingle,
  createGroup: createGroup,
  timeDifference: timeDifference
}
