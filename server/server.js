'use strict'


var http = require('http');


var express = require('express');

var serveIndex = require('serve-index');



var app = express();


app.use(serveIndex('./dist'));
app.use(express.static('./dist'));



var http_server = http.createServer(app);
http_server.listen(3003);

var io = require('socket.io')(http_server,{
	path:'/rtcket'
  });
  http_server.on('listening', onListening);
  function onListening() {
	var addr = http_server.address();
	var bind = typeof addr === 'string'
	  ? 'pipe ' + addr
	  : 'port ' + addr.port;
	console.log('Listening on ' + bind);
  }

var roomid = ''
var personListMap = {}
//connection
io.on('connection', (socket)=>{
	
	socket.on('message', (room, data)=>{
		if(data ===  undefined){
			return;
		}
		socket.to(room).emit('message', room, socket.id, data)//房间内所有人,除自己外
		
		
	});


	socket.on('join', (obj)=> {
		var room = obj.room
		roomid = room
		socket.join(room);

		personListMap[socket.id] = obj

		var myRoom = io.sockets.adapter.rooms[room];
		var users = Object.keys(myRoom.sockets).length;



		//在这里可以控制进入房间的人数,现在一个房间最多 2个人
		//为了便于客户端控制，如果是多人的话，应该将目前房间里
		//人的个数当做数据下发下去。
		if(users < 3) {
			console.log(obj)
			
			

			socket.emit('joined', personListMap, socket.id);
			socket.to(room).emit('otherjoin', obj)//房间内所有人,除自己外
			/*
			if (users > 1) {
				socket.to(room).emit('otherjoin', room);//除自己之外
			}*/
		}else {
			socket.leave(room);
			socket.emit('full', room, socket.id);	
		}

	});

	socket.on('leave', (room)=> {
		console.log(room);
		console.log('leave')
		var myRoom = io.sockets.adapter.rooms[room];

		

		socket.leave(room);
		socket.to(room).emit('bye', room, socket.id)//房间内所有人,除自己外
	 	socket.emit('leaved', room, socket.id);	
	});

	socket.on('disconnect', function () {
		
		socket.to(roomid).emit('otherleave')//房间内所有人,除自己外
		socket.leave(roomid);
		personListMap[socket.id] = null
		console.log('disconnect')

	});
	socket.on('connect', function () {

		console.log('connect')

	});

});





