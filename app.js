var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server)
    nickNames = [];

server.listen(3000, function(err){
  if(err) throw err;
  console.log("Server listening on port 3000");
});

app.use(express.static(__dirname + '/public'));

app.get('/*', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(client){

  function updateOnlineUsers(){
    if(nickNames.length){
      var onlineUsers = {
        data: []
      };
      for (var i = 0; i < nickNames.length; i++) {
        var userDetails = {
          nickName: nickNames[i]
        };
        onlineUsers.data.push(userDetails);
      }
      io.emit('users_online', onlineUsers);
    }
  }

  client.on('disconnect', function(){
    if(!client.nickName){
      return false;
    }
    nickNames.splice(nickNames.indexOf(client.nickName), 1);
    updateOnlineUsers();
  });

  client.on('set_nickName', function(data, callback){
    var output = {
      success: false,
      data: null,
      err: null
    };
    var nickName = data.nickName;
    if(nickNames.indexOf(nickName) == -1){
      if(nickName != null){
        client.nickName = nickName;
        nickNames.push(nickName);
        output.success = true;
        output.data = nickName;
      }else{
        output.err = "Invalid nickName. Please choose another name.";
      }
    }else {
      output.err = "This name is already taken. Please choose another name.";
    }
    callback(output);
    updateOnlineUsers();
  });

  client.on("send_message", function(data, callback){
    var output = {
      success: false,
      data: null,
      err: null
    };
    var nickName = data.nickName,
        message = data.message;
    if(nickName != 'undefined' && nickName != null && nickName == client.nickName){
      if(message != 'undefined' && message != null){
        output.success = true;
        output.data = message;
      }else {
        output.err = "Invalid message.";
      }
    }else {
      output.err = "Invalid user.";
    }
    callback(output);
    if(output.success){
      var sendMessageData = {
        nickName: nickName,
        message: message
      };
      io.emit("new_message", sendMessageData);
    }
    // io.emit("new_message", data);

    // The following line will emit message to all connected clients except the one it generated from. That's why it is reffered by "client" and not io
    // client.broadcast.emit("new_message", data);
  });

});
