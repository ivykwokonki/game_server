var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var io = require('socket.io').listen(app.listen(port));
var url = 'mongodb://localhost:27017/site';



var clients = [];

//get connection requests from clients
io.socket.on('connection'),function(socket){
	var currentUser;

	var MongoClient = mongodb.MongoClient;
	
	
	
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect Server', err);
		}else {
			console.log("Connection Established");
			
			var quiz = db.collection('QuizList');
			
			quiz.find({created_by:"Angel"}).toArray(function(err, result){
				if(err){
					res.send(err);
				}else if(result.length){
					res.json(result);
				}else{
					res.send("No documents found");
				}
				
				db.close();
			});
		}
	});

	socket.on("User_connect",function(){
		console.log("User connected");
		for(var i = 0 ; i < clients.length; i++){
			socket.emit("User_connect"),{ name:clients[i].name};
			console.log("User name":clients[i].name: "is connected");
		}
	})
	socket.emit('connected');

	socket.on("Play"), function(data){
		currentUser = {
			name: data.name,
			position:data.position
		}
		clients.push(currentUser);
		socket.emit("Play",currentUser);
		socket.broadcast.emit("User_connect", currentUser);
	}

	socket.on("Answer")
}



module.exports = router;
