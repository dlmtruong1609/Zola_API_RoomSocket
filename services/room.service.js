const Room = require("../models/room.model");
const Response = require("../utils/response");
const CONSTANT = require("../utils/room.constant");
const { validationResult } = require("express-validator");
const request = require("request");
const util = require("util");
require("dotenv").config();

const jwtHelper = require("../helpers/jwt.helper");
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const myCustomLabels = {
  totalDocs: "itemCount",
  docs: "itemsList",
  limit: "perPage",
  page: "currentPage",
  nextPage: "next",
  prevPage: "prev",
  totalPages: "pageCount",
  pagingCounter: "slNo",
  meta: "paginator",
};

// format trả về err
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return {
    msg: msg,
    param: param,
  };
};

const createSingle = async (req, res) => {
  // decode
  const decoded = await jwtHelper.verifyToken(
    req.headers["x-access-token"],
    accessTokenSecret
  );
  const accountDecode = decoded.data;
  const userId = accountDecode.id;
  //
  const list_user_id = [req.query.friend_id, userId];
  //
  const errs = validationResult(req).formatWith(errorFormatter);
  //
  const room = new Room({
    name: req.body.name,
    group: false,
    createdAt: new Date(),
  });
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    // lay user nhung vao room
    for (let index = 0; index < list_user_id.length; index++) {
      let options = await {
        method: "GET",
        url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`,
        headers: {
          "x-access-token": process.env.TOKEN_3650,
        },
      };
      const requestPromise = util.promisify(request);
      let result = await requestPromise(options);
      // danh dau de hien thi message tu ngay nay
      let user = await {
        ...JSON.parse(result.body).data,
        startDate: new Date(),
        deleted: false,
      };
      room.users.push(user);
    }
    room
      .save()
      .then((data) => {
        res
          .status(201)
          .send(new Response(false, CONSTANT.CREATE_ROOM_SUCCESS, null));
      })
      .catch((err) => {
        let response = new Response(true, CONSTANT.ERROR_FROM_MONGO, [
          { msg: err, param: "create" },
        ]);
        res.status(503).send(response);
      });
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};

const createGroup = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter);
  const room = await new Room({
    name: req.body.name,
    group: true,
    createdAt: new Date(),
  });
  // decode
  const decoded = await jwtHelper.verifyToken(
    req.headers["x-access-token"],
    accessTokenSecret
  );
  const accountDecode = decoded.data;
  const userId = accountDecode.id;
  //
  let list_user_id = req.body.list_user_id;
  list_user_id.push(userId);
  console.log("acsvas" + list_user_id);
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    // lay user nhung vao room
    for (let index = 0; index < list_user_id.length; index++) {
      let options = await {
        method: "GET",
        url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`,
        headers: {
          "x-access-token": process.env.TOKEN_3650,
        },
      };
      const requestPromise = await util.promisify(request);
      let result = await requestPromise(options);
      // danh dau de hien thi message tu ngay nay
      let user = await {
        ...JSON.parse(result.body).data,
        startDate: new Date(),
        deleted: false,
      };
      room.users.push(user);
    }
    room
      .save()
      .then((data) => {
        res
          .status(201)
          .send(new Response(false, CONSTANT.CREATE_ROOM_SUCCESS, null));
      })
      .catch((err) => {
        let response = new Response(true, CONSTANT.ERROR_FROM_MONGO, [
          { msg: err, param: "create" },
        ]);
        res.status(503).send(response);
      });
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};

const findRoomById = async (req, res) => {
  const errs = validationResult(req).formatWith(errorFormatter);
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    const id = req.query.id;
    const room = await Room.findById(id);
    res.status(200).send(new Response(false, CONSTANT.FIND_SUCCESS, room));
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};

const getAll = async (req, res) => {
  try {
    const decoded = await jwtHelper.verifyToken(
      req.headers["x-access-token"],
      accessTokenSecret
    );
    const accountDecode = decoded.data;
    const userId = accountDecode.id;
    console.log(userId);
    let currentPage = req.query.currentPage
      ? (req.query.currentPage = req.query.currentPage)
      : (req.query.currentPage = 1);
    let perPage = req.query.perPage;
    const options = {
      page: currentPage,
      limit: perPage,
      customLabels: myCustomLabels,
    };
    Room.paginate(
      { users: { $elemMatch: { id: userId } } },
      options,
      (err, result) => {
        res
          .status(200)
          .send(
            new Response(false, CONSTANT.FIND_SUCCESS, result ? result : null)
          );
      }
    );
  } catch (error) {
    res.status(500).send(new Response(true, error, error));
  }
};

const deleteRoom = async (req, res) => {
  const id = req.query.id;
  const decoded = await jwtHelper.verifyToken(
    req.headers["x-access-token"],
    accessTokenSecret
  );
  const accountDecode = decoded.data;
  const userId = accountDecode.id;

  const errs = validationResult(req).formatWith(errorFormatter);
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    Room.findOneAndUpdate(
      {
        _id: id,
        "users.id": userId,
      },
      {
        $set: {
          "users.$.startDate": new Date(),
          "users.$.deleted": true,
        },
      }
    )
      .then((room) => {
        res
          .status(200)
          .send(new Response(false, CONSTANT.DELETE_SUCCESS, null));
      })
      .catch((err) => {
        res
          .status(503)
          .send(
            new Response(true, CONSTANT.ERROR_FROM_MONGO, [
              { msg: err, param: "" },
            ])
          );
      });
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};

const exitRoom = async (req, res) => {
  const id = req.query.id;
  const decoded = await jwtHelper.verifyToken(
    req.headers["x-access-token"],
    accessTokenSecret
  );
  const accountDecode = decoded.data;
  const userId = accountDecode.id;

  const errs = validationResult(req).formatWith(errorFormatter);
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    const room = await Room.findOne({
      _id: id,
      "users.id": userId,
    });
    Room.findOneAndUpdate(
      {
        _id: id,
        "users.id": userId,
      },
      {
        users: room.users.filter((user) => {
          return user.id > userId || user.id < userId;
        }),
      }
    )
      .then((result) => {
        res.status(200).send(new Response(false, CONSTANT.EXIT_SUCCESS, null));
      })
      .catch((err) => {
        res
          .status(503)
          .send(
            new Response(true, CONSTANT.ERROR_FROM_MONGO, [
              { msg: err, param: "" },
            ])
          );
      });
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};

const updateRoom = async (req, res) => {
  const id = req.query.id;
  const decoded = await jwtHelper.verifyToken(
    req.headers["x-access-token"],
    accessTokenSecret
  );
  const accountDecode = decoded.data;
  const userId = accountDecode.id;
  const name = req.body.name;
  const errs = validationResult(req).formatWith(errorFormatter);
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    Room.findOneAndUpdate(
      {
        _id: id,
        "users.id": userId,
      },
      {
        name: name,
      }
    )
      .then((result) => {
        res
          .status(200)
          .send(new Response(false, CONSTANT.UPDATE_SUCCESS, null));
      })
      .catch((err) => {
        res
          .status(503)
          .send(
            new Response(true, CONSTANT.ERROR_FROM_MONGO, [
              { msg: err, param: "" },
            ])
          );
      });
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};

const addMember = async (req, res) => {
  const id = req.query.id;
  const decoded = await jwtHelper.verifyToken(
    req.headers["x-access-token"],
    accessTokenSecret
  );
  const accountDecode = decoded.data;
  const userId = accountDecode.id;
  const list_user_id = req.body.list_user_id;
  const errs = validationResult(req).formatWith(errorFormatter);
  if (typeof errs.array() === "undefined" || errs.array().length === 0) {
    let list_user = []
    // lay user nhung vao room
    for (let index = 0; index < list_user_id.length; index++) {
        let options = await {
          method: "GET",
          url: `http://api_account_chat:3333/api/v0/users/detail?id=${list_user_id[index]}`,
          headers: {
            "x-access-token": process.env.TOKEN_3650,
          },
        };
        const requestPromise = await util.promisify(request);
        let result = await requestPromise(options);
        // danh dau de hien thi message tu ngay nay
        let user = await {
          ...JSON.parse(result.body).data,
          startDate: new Date(),
          deleted: false,
        };
        list_user.push(user);
    }
    //
    Room.findOneAndUpdate(
      {
        _id: id,
        "users.id": userId,
      },
      {
        '$push': {
            'users': {
                '$each': list_user
            }
        }
      }
    ).then((result) => {
        res
          .status(200)
          .send(new Response(false, CONSTANT.ADD_SUCCESS, null));
      }).catch((err) => {
        res
          .status(503)
          .send(
            new Response(true, CONSTANT.ERROR_FROM_MONGO, [
              { msg: err, param: "" },
            ])
          );
      });
  } else {
    const response = new Response(false, CONSTANT.INVALID_VALUE, errs.array());
    res.status(400).send(response);
  }
};
module.exports = {
  createSingle: createSingle,
  createGroup: createGroup,
  getAll: getAll,
  findRoomById: findRoomById,
  deleteRoom: deleteRoom,
  exitRoom: exitRoom,
  updateRoom: updateRoom,
  addMember: addMember,
};
