const express = require('express');
const path = require('path');
const logger = require('morgan');

const roomRouter = require('./routes/room.route');
const messageRouter = require('./routes/message.route');


require('dotenv').config();

const cors = require('cors');
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', roomRouter);
app.use('/', messageRouter);
app.use(cors());

let mongoose = require('mongoose');

let mongoUrl = `${process.env.DB_URL}`;

//Thiết lập một kết nối mongoose chạy đến khi nào kết nối được mới tiếp tục
const connectWithRetry = function () {
    return mongoose.connect(mongoUrl, { useNewUrlParser: true, useFindAndModify: false }, (err) => {
      if (err) {
        console.error('Failed to connect to mongo on startup - retrying in 5 sec', err)
        setTimeout(connectWithRetry, 5000)
      }
    })
  }
  connectWithRetry()
  
//Ép Mongoose sử dụng thư viện promise toàn cục
mongoose.Promise = global.Promise;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

module.exports = app;
