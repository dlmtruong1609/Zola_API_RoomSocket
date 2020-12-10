// config mongo
const mongoose = require('mongoose')
require('dotenv').config()
const mongoUrl = `${process.env.DB_URL}`

// connect mongo
const connectWithRetry = function () {
  return mongoose.connect(mongoUrl, { useNewUrlParser: true, useFindAndModify: false }, (err) => {
    if (err) {
      console.error('Failed to connect to mongo on startup - retrying in 5 sec', err)
      setTimeout(connectWithRetry, 5000)
    }
  })
}

module.exports = {
  connectWithRetry: connectWithRetry
}
