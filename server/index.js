var express = require('express');
var http = require('http')
var socketio = require('socket.io');
var mongojs = require('mongojs');
var MongoClient = require('mongodb').MongoClient;
//var mp = require('mongodb-promise');


var ObjectID = mongojs.ObjectID;
var db = mongojs(process.env.MONGO_URL || 'mongodb://localhost:27017/local');
var app = express();
var server = http.Server(app);
var websocket = socketio(server);
var io = websocket;

server.listen(3000, () => console.log('listening on *:3000'));


var DBURL = "mongodb://localhost:27017/chatroom"

// Mapping objects to easily map sockets and users.
var clients = {};
var user_socket = {};

// This represents a unique chatroom.
// For this example purpose, there is only one chatroom;
var chatId = 1;

websocket.on('connection', (socket) => {
    clients[socket.id] = socket;
    socket.on('userJoined', (userId) => onUserJoined(userId, socket));
    socket.on('message', (message) => onMessageReceived(message, socket));

    socket.on('USER_LOGIN', (user) => onUSER_LOGIN(user, socket));
    socket.on('ENTER_ROOM', (users) => onENTER_ROOM(users, socket));
    socket.on('GIVE_MESSAGE', (msg) => onGIVE_MESSAGE(msg, socket));
    socket.on('NEXT_20_MESSAGE', (msg) => onNEXT_20_MESSAGE(msg, socket));
    socket.on('EXIT_ROOM', (users) => onEXIT_ROOM(users, socket));
    socket.on('USER_LOGOUT', (user) => onUSER_LOGOUT(user, socket));
    socket.on('USER_GO_OUT', (user) => onUSER_GO_OUT(user, socket));
    //socket.on('disconnect', () => ondisconnect(socket));
    socket.on('disconnect', ()=>ondisconnect(socket));
});


var promise_obj = function(param){
  return new Promise( (resolve, reject) =>{
    resolve(param);
  })
}

var obj = function(o){
  return JSON.stringify(o, null, 4)
}

var catstr = function(str1, str2){
  if(str1.localeCompare(str2) <0){
    return str1+str2
  }
  else{
    return str2+str1
  }
}

// ====================================//
// onUSER_LOGIN
// ====================================//
function onUSER_LOGIN(user, socket){
  // user = {"userid":, "password":}
  console.log('in onGIVE_USER_ID');
  console.log(user);
  

  MongoClient.connect(DBURL, function(err, db) {
    if (err) throw err
    var result = null
    
    
    db.collection("user").count({}).then((col_count)=>{
      console.log(col_count)
      if(col_count){
        console.log('@@@@@@@@@@@1')
        return db.collection("user").findOne({'userid':user.userid})
      }
      else{
        console.log('@@@@@@@@@@@2')
        return promise_obj(false)
      }
    }).then((user_found)=>{
      console.log('============1')
      console.log(obj(user_found))
      console.log('資料庫找到用戶 '+obj(user_found))
      if(!user_found){
        console.log('#############')
        console.log('新增用戶 '+obj(user))
        db.collection("user").insert({'userid':user.userid, 'password':user.password, 'login':true})
        console.log('#############')
        return promise_obj(true)
      }
      else{
        console.log('============2')

        if(user.password == user_found.password){
          console.log('%%%%%1')
          db.collection("user").update({'userid':user.userid}, {'userid':user_found.userid, 'password':user_found.password, 'login':true})
          console.log('用戶 '+user.userid+'通過驗證')
          return promise_obj(true)
        }
        else{
          console.log('%%%%%2')
          console.log('用戶 '+user.userid+'未過驗證')
          return promise_obj(false)
        }
      }
    }).then( (pass_varify)=>{
      socket.fromuser = user.userid
      socket.touser = ''
      socket.room = ''
      console.log('發送LOGIN_VERIFY'+pass_varify)
      socket.emit('LOGIN_VERIFY', {'success':pass_varify})
      return promise_obj(pass_varify)
    }).then((pass_varify)=>{
      
      if(pass_varify){
        console.log('通知'+user.userid+'已上線')
        console.log('發送USER_COME_IN'+pass_varify)
        //socket.broadcast.emit('USER_COME_IN', {'userid':user.userid})
        socket.broadcast.emit('USER_COME_IN', {'userid':user.userid})
        
      }
      return promise_obj(pass_varify)
    }).then((pass_varify)=>{
      console.log('查詢線上使用者'+pass_varify)
      if(pass_varify){
        return db.collection("user").find({'login':true},{'userid':1, 'login':1}).toArray()
      }
      else{
        return promise_obj(false)
      }
    }).then((pass_varify)=>{
      console.log('發送線上使用者'+obj(pass_varify))
      if(pass_varify){
        socket.emit('LIST_ALL_USER', pass_varify)
        return promise_obj(true)
      }
      else{
        return promise_obj(false)
      }
    }).
    then(()=>{
      //if(online_user)
      //socket.emit('USER_COME_IN', {'userid':user.userid})

      console.log('關閉資料庫')
      db.close()
    })
 
  })
  

  console.log('out onGIVE_USER_ID')
}

/*
io.sockets.clients(someRoom).forEach(function(s){
    s.leave(someRoom);
});
*/

// ====================================//
// onENTER_ROOM
// ====================================//
function onENTER_ROOM(users, socket){
  // users = {"fromuser":, "touser":}
  console.log('in onENTER_ROOM');
  console.log(users);
  var room_name = catstr(users.fromuser, users.touser)
  console.log('房間名: '+room_name)
  socket.fromuser = users.fromuser
  socket.touser = users.touser
  socket.room = room_name

  //var timestr = new Date().toLocaleString()
  //var time = new Date().getTime()
  //console.log(time+'   '+timestr)

  MongoClient.connect(DBURL, function(err, db) {
    if (err) throw err
    //var timestr = new Date().toLocaleString()
    //var time = new Date().getTime()
    //console.log(time+'   '+timestr)

    
    db.collection("dialogue").find({'room':room_name}, {"fromuser":1 , "touser":1 , "message":1,  "time":1, "timestr":1}).sort({"time":-1}).toArray().then((room_message)=>{
      console.log(obj(room_message))
      console.log('建立房間 '+room_name)
      socket.join(room_name)
      return promise_obj(room_message.slice(0,20))
    }).then((room_message)=>{
      console.log('找到前20筆對話 '+obj(room_message))
      socket.emit('LIST_20_MESSAGE', room_message)
    }).then(()=>{
      console.log('關閉資料庫')
      db.close()
    })
 
  })
  

  console.log('out onENTER_ROOM')
}

// ====================================//
// onGIVE_MESSAGE
// ====================================//
function  onGIVE_MESSAGE(msg, socket){
 // msg = {“fromuser”: , “touser”: , “message”: , “timestr”: ,”time”:  }
 
 console.log('in onGIVE_MESSAGE');
 console.log(msg)
 var room_name = catstr(msg.fromuser, msg.touser)
 console.log('房間名: '+room_name)
 var message = {'room':room_name, 'fromuser':msg.fromuser, 'touser':msg.touser, 'message':msg.message, 'time':msg.time, 'timestr':msg.timestr}
 
 MongoClient.connect(DBURL, function(err, db) {
   if (err) throw err
   
   console.log('插入message:'+message)
   db.collection("dialogue").insert(message, function(err, dummy){
    if (err) throw err
    console.log('插入message:'+obj(message))
    io.to(room_name).emit('RECEIVE_MESSAGE', message);    
    console.log('關閉資料庫')
    db.close()
   })
 })
 

 console.log('out onGIVE_MESSAGE')
}


// ====================================//
// onNEXT_20_MESSAGE
// ====================================//
function onNEXT_20_MESSAGE(msg, socket){
  // msg = {“fromuser”: , “touser”: ,“timestr”: ,”time”:}
  console.log('in onNEXT_20_MESSAGE');
  console.log(msg);
  var room_name = catstr(msg.fromuser, msg.touser)
  console.log('房間名: '+room_name)

  MongoClient.connect(DBURL, function(err, db) {
    if (err) throw err
    console.log('建立房間 '+room_name)
    socket.leave(room_name)


    db.collection("dialogue").find({'room':room_name, time: {$lt: msg.time}}, {"fromuser":1 , "touser":1 , "message":1,  "time":1, "timestr":1}).sort({"time":-1}).toArray().then((room_message)=>{
      console.log(obj(room_message))
      return promise_obj(room_message.slice(0,20))
    }).then((room_message)=>{
      console.log('找到下20筆對話 '+obj(room_message))
      socket.emit('LIST_20_MESSAGE', room_message)
    }).then(()=>{
      console.log('關閉資料庫')
      db.close()
    })
 
  })
  

  console.log('out onNEXT_20_MESSAGE')
}


// ====================================//
// onEXIT_ROOM
// ====================================//
function onEXIT_ROOM(users, socket){
  // users = {"fromuser":, "touser":}
  console.log(obj(users))
  console.log('in onEXIT_ROOM');
  /*
  var room_name = catstr(users.fromuser, users.touser)
  console.log('房間名: '+room_name)
  console.log('離開房間 '+room_name)
  socket.leave(room_name)
  */
  socket.leave(socket.room)
  socket.fromuser = users.fromuser
  socket.touser = ''
  socket.room = ''

  //var timestr = new Date().toLocaleString()
  //var time = new Date().getTime()
  //console.log(time+'   '+timestr)

  MongoClient.connect(DBURL, function(err, db) {
    if (err) throw err

    db.collection("user").find({'login':true},{'userid':1, 'login':1}).toArray().then( (user_online) =>{
      socket.emit('LIST_ALL_USER', user_online)
      console.log('關閉資料庫')
      db.close()      
    })
  })
  

  console.log('out onEXIT_ROOM')
}

// ====================================//
// onUSER_LOGOUT
// ====================================//
function onUSER_LOGOUT(user, socket){
  // user = {"userid":}
  //console.log('in onEXIT_ROOM');
  //var room_name = catstr(users.fromuser, users.touser)
  //console.log('房間名: '+room_name)
  //console.log('離開房間 '+room_name)
  //socket.leave(room_name)

  //var timestr = new Date().toLocaleString()
  //var time = new Date().getTime()
  //console.log(time+'   '+timestr)

  MongoClient.connect(DBURL, function(err, db) {
    if (err) throw err


    db.collection("user").findOne({'userid':user.userid}).then((user_found)=>{
      console.log('找到'+user_found)
      console.log('更新'+user_found+"狀態")
      if(socket.room){
        socket.leave(socket.room)
        socket.room = ''
        socket.touser = ''
      }

      db.collection("user").update({'userid':user_found.userid}, {'userid':user_found.userid, 'password':user_found.password, 'login':false})
      return promise_obj(true)
    }).then( (dummy)=>{
      return db.collection("user").find({'login':true},{'userid':1, 'login':1}).toArray()
    }).then((user_online)=>{
      socket.emit('LIST_ALL_USER', user_online)
      return promise_obj(true)
    }).then(()=>{
      
      //if(pass_varify){
      console.log('通知'+user.userid+'已下線')
      console.log('發送USER_GO_OUT'+user.userid)
        //socket.broadcast.emit('USER_COME_IN', {'userid':user.userid})
      socket.broadcast.emit('USER_GO_OUT', {'userid':user.userid})
      return promise_obj(true)
      }).then( ()=>{
      console.log('關閉資料庫')
      db.close()  
    })    
  })

  console.log('out onENTER_ROOM')
}


// ====================================//
// ondisconnect
// ====================================//
function ondisconnect(socket){
  console.log('斷線啦')
  //關掉房間
  if(socket.room){
    socket.leave(socket.room)
    socket.room = ''
    socket.touser = ''
  }
  
  //改狀態
  //通知下線
  MongoClient.connect(DBURL, function(err, db) {
    if (err) throw err


    db.collection("user").findOne({'userid':socket.fromuser}).then((user_found)=>{
      console.log('找到'+user_found)
      console.log('更新'+user_found+"狀態")
      if(socket.room){
        socket.leave(socket.room)
        socket.room = ''
        socket.touser = ''
      }

      db.collection("user").update({'userid':user_found.userid}, {'userid':user_found.userid, 'password':user_found.password, 'login':false})
        return promise_obj(true)
      }).then( (dummy)=>{
        return db.collection("user").find({'login':true},{'userid':1, 'login':1}).toArray()
      }).then((user_online)=>{
        socket.emit('LIST_ALL_USER', user_online)
        return promise_obj(true)
      }).then(()=>{
      
        //if(pass_varify){
        console.log('通知'+user.userid+'已下線')
        console.log('發送USER_GO_OUT'+user.userid)
        socket.broadcast.emit('USER_GO_OUT', {'userid':user.userid})
        return promise_obj(true)
      }).then( ()=>{
        console.log('關閉資料庫')
        db.close()  
      })    
    })
    //}//)
}


// Event listeners.
// When a user joins the chatroom.
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
    console.log(err);
  }

}

// When a user sends a message in the chatroom.
function onMessageReceived(message, senderSocket) {
  console.log("onMessageReceived start");
  console.log('message:');
  console.log(message);
 
  var userId = users[senderSocket.id];
  console.log(userId);
  // Safety check.
  if (!userId) return;
  _sendAndSaveMessage(message, senderSocket);

  console.log("onMessageReceived end");
}

// Helper functions.
// Send the pre-existing messages to the user that just joined.
function _sendExistingMessages(socket) {
  var messages = db.collection('messages')
    .find({ chatId })
    .sort({ createdAt: 1 })
    .toArray((err, messages) => {
      // If there aren't any messages, then return.
      if (!messages.length) return;
      socket.emit('message', messages.reverse());
  });
}

var fff = function(a){
  console.log('i got this')
  console.log(a)

};

// Save the message to the db and send all sockets but the sender.
function _sendAndSaveMessage(message, socket, fromServer) {
  var messageData = {
    text: message.text,
    user: message.user,
    createdAt: new Date(message.createdAt),
    chatId: chatId
  };

  db.collection('messages').insert(messageData, (err, message) => {
    // If the message is from the server, then send to everyone.
    var emitter = fromServer ? websocket : socket.broadcast;
    emitter.emit('message', [message]);
  });


  console.log("MongoClient start");
  MongoClient.connect(DBURL, function(err, db) {
    if (err) throw err;
    var query = {'userid':'tom'};
    db.collection("user").find(query, {'userid':1, 'login':1}).toArray( function(err, result) {
        if (err) throw err;
        //console.log(result);
        db.close();  
        fff(result);
    });
  console.log("MongoClient end");
    /*
    db.collection("customers").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      return 
      db.close();
    });
    */
    /* or
    return db.collection("user").find(query, {'userid':1, 'login':1}).toArray()
    */
  });


}

// Allow the server to participate in the chatroom through stdin.
var stdin = process.openStdin();
stdin.addListener('data', function(d) {
  _sendAndSaveMessage({
    text: d.toString().trim(),
    createdAt: new Date(),
    user: { _id: 'robot' }
  }, null /* no socket */, true /* send from server */);
});


/************************************/
var userExist = function(user){
  return user? true: false;
};

/************************************/
var queryUser = function(userid, callback){
  MongoClient.connect(DBURL, function(err, db) {
      if (err) throw err;
      var query = {'userid':userid};
        var result = db.collection("user").find(query, {'userid':1, 'login':1});
        callback(result);
        db.close();
  });
}

var addUser = function(userid, password, login){
  MongoClient.connect(DBURL, function(err, db) {
      if (err) throw err;
        db.collection("user").insert({'userid':userid, 'password':password, 'login':login});
        db.close();
  });
}
