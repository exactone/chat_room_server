//var express = require('express');
//var http = require('http')
//var socketio = require('socket.io');
//var mongojs = require('mongojs');

//var app = express();
//var server = http.Server(app);
//var websocket = socketio(server);
var app = require('express')()         // app
var http = require('http').Server(app) // server
var io = require('socket.io')(http)    // websocket
const DBURL = "mongodb://localhost:27017/chatroom"


server.listen(3000, () => console.log('listening on *:3000'));

// Mapping objects to easily map sockets and users.
var clients = {};
var user = [{"userid": userid,
             "password": password,
             "login":login}];

var message = [{"room": room,
                "fromuser": fromuser,
                "touser":touser,
                "message":message,
                "time":time,
                "timestr":timestr}];


// This represents a unique chatroom.
// For this example purpose, there is only one chatroom;
var chatId = 1;



####################
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/chatroom";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var query = { address: "Park Lane 38" };
  db.collection("customers").find(query).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    db.close();
  });
});
####################


io.on('connection', (socket) => {
    clients[socket.id] = socket;
    socket.on('GIVE_USER_ID', (parm) => onGIVE_USER_ID(parm, socket));
    socket.on('ENTER_ROOM', (parm) => onENTER_ROOM(parm, socket));
    socket.on('MESSAGE', (parm) => onMESSAGE(parm, socket));
    socket.on('NEXT_20_MESSAGE', (parm) => onNEXT_20_MESSAGE(parm, socket));
    socket.on('EXIT_ROOM', () => onEXIT_ROOM(socket));
    socket.on('USER_LOGOUT', (param) => onUSER_LOGOUT(param, socket));
    socket.on('disconect')
    
});

/*
io.on('connection', (socket) => {
    clients[socket.id] = socket;
    socket.on('userJoined', (userId) => onUserJoined(userId, socket));
    socket.on('message', (message) => onMessageReceived(message, socket));
});
*/

// 根據userid查詢使用者
var queryUser = function(userid){
    MongoClient.connect(DBURL, function(err, db) {
        if (err) throw err;
        var query = {'userid':userid};
        db.collection("user").find(query, {'userid':1, 'login':1}).toArray( function(err, result) {
            if (err) throw err;
            console.log(result);
            return result;
            db.close();           
        });
        /*
        db.collection("customers").find(query).toArray(function(err, result) {
          if (err) throw err;
          console.log(result);
          return 
          db.close();
        });
        */
      });





    return db.collection().find({'userid':userid}, {'userid':1, 'login':1})
}

// 列出所有使用者
var listUser = function(){
    return db.collection('user').find()
}

// 列出所有login為True的使用者
var listUserOnLine = function(){
    return db.collection().find()
}
// 列出所有logout為False的使用者
var listUserOnLine = function(){
    return db.collection().find()
}

// 新增使用者
var insertUser = function(dbUrl, userName, passWord, login){
    MongoClient.connect(dbUrl, function(err, db){
      var collection = db.collection('user');
      var user = [{"username": userName,
                   "password": passWord,
                   "login":login}];
      console.log("Insert user: " + userName);
      collection.insert(user);
      db.close()
    });
  }

// 更新使用者狀態
var updateUser = function(dbUrl, userName, passWord){


}

// 查詢對話，一個對話即一個room
var queryDialog = function(dbUrl, userName){
    
}

// 新增對話
var insertDialog = function(dbUrl, fromUser, toUser, message){
    MongoClient.connect(dbUrl, function(err, db){
      var collection = db.collection('dialog');
      var room = fromUser.attr.localeCompare(toUser.attr) > 0 ? fromUser+toUser:toUser+fromUser;
      var time = new Date().toLocaleString;
      var dialog = [{"room": room,
                     "fromUser": fromUser,
                     "toUser":toUser,
                     "message":message,
                     "time":time}];
      console.log("Insert dialog: " + fromUser + " said \'" + message + "\' to" + toUser);
      collection.insert(dialog);
      db.close()
    });
}

// Event listeners.
// When a user login.
// 1. check user name, if not exist, add new one
//                     if exist, check password 
// 2. change login status
function onLogin(userName, passWord, socket) {
    try{

    } catch(err) {
        console.error(err);
    }
}


function onUserJoined(userId, socket) {
    try {
      // The userId is null for new users.
      if (!userId) {
        var user = db.collection('users').insert({}, (err, user) => {
          socket.emit('userJoined', user._id);
          users[socket.id] = user._id;
          _sendExistingMessages(socket);
        });
      } else {
        users[socket.id] = userId;
        _sendExistingMessages(socket);
      }
    } catch(err) {
      console.err(err);
    }
  }