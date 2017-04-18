var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var session = require('express-session');
var teacher = require('./routes/teacher');
var api = require('./routes/api');
var mongoose = require('mongoose');

// var students = require('./routes/students');

var app = express();
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'));
var server = require('http').createServer(app);

var io = require('socket.io').listen(server);

// server.listen(3000);

var url = 'mongodb://fyp002:1234@104.199.228.7:27017/site';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', teacher);
app.use('/api', api);
// app.use('/student', students);
// app.use('/teacher', teachers);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
 });


mongoose.connect(url,function(err){
  if(err){
    console.log(err);
  }else{
    console.log('connected to mongodb');
  }
})

var answerSchema = mongoose.Schema({
  name: String,
  rmID: String,
  Qid: Number,
  time: Number,
  choice: Number,
  correct_ans: Number,
  isCorrect: Boolean
});

var gameSchema = mongoose.Schema({
  game: String,
  quizName: String,
  roomName: String,
  created_by: String,
  playerList: [],
  Qcount: Number
});

var Game = mongoose.model('Game', gameSchema);

var Answer = mongoose.model('Answer', answerSchema);

// io.attach(4567);
io.attach(65080);
var rooms = [];
var roomUser = {};
var game4king = {};   //{key:[num of player , Question index]}
//get connection requests from teachers
io.on("connection",function(socket){
  
// 获取用户当前的url，从而截取出房间id
  console.log("get basic connection!");
  var user = "";
  var id = "";
  var room;
  var role = "student";

  //from teacher clients

  ////////////// required ///////////////////
    socket.on("teacher_connect",function(data){
      user = data.username;
      id = socket.id;
      console.log("teacher connected : "+ data.username);
      console.log(socket.id);
    });

    socket.on("create_game_room", function(data){
      // !!important
        room_key = Math.floor((Math.random() * 10000) + 1);
        while (!!roomUser[room_key]){
          room_key = Math.floor((Math.random() * 10000) + 1);
          
        }
      // !!important

      // room_key = 777;
      console.log("key:"+room_key);
      if(rooms.indexOf(room_key!=-1))
        rooms.push(room_key);
      roomUser[room_key] =  {"teacher":
                              { "name":data.username, "id": socket.id }
                            ,"student":[]
                            ,"game":data.game
                            ,"roomName":data.roomName
                            ,"quizName":data.quizName
                            ,"Qcount":data.Qcount
                            };
      room = room_key;
      if(data.game=="4kingdom"){
        game4king[room_key] =[0,-1,[-1]];
      console.log(game4king);
      
      }
      console.log(roomUser);
      socket.emit("key",{key:room_key});
      console.log("end ... key:"+room_key);
    });

    socket.on("start", function(data){

      // append the result data into db
      var newGame = new Game({
        game: roomUser[data.key]["game"],
        quizName: roomUser[data.key]["quizName"],
        roomName: roomUser[data.key]["roomName"],
        created_by: roomUser[data.key]["teacher"]["name"],
        playerList: roomUser[data.key]["student"],
        Qcount: roomUser[data.key]["Qcount"]
      })
      newGame.save(function(err,result){
        if(err) throw err;
        else{
          console.log("yes, get game id return:" + result._id);
          
          roomUser[data.key]["id"] = result._id;
          console.log(roomUser);
        }
      })
      console.log(game4king);
      if(roomUser[data.key]["game"])
        socket.to(data.key).emit( "start", {game:roomUser[data.key]["game"]});
    });

  //////////////end for required ////////////


  //from student clients

  ////////////// required ///////////////////
    socket.on("student_connect",function(data){
        console.log("student connected :" + data.username);
        user = data.username;
        id = socket.id;
        console.log(socket.id);
    });

    socket.on('join123', function (data) {
         user = data.username;
         var key = parseInt(data.key);
         console.log(rooms);

        // 将用户归类到房间
        if (rooms.includes(key)) {
            // socket.join(key);
            socket.join(key);
            room = key;
            roomUser[key]["student"].push(user);
            console.log(roomUser);

            //if 4kingdom game
            // to do : assign them randomly, can to >4
            if(roomUser[key]["game"] == "4kingdom"){
                var kingdom = game4king[key][0];
                if(game4king[key][0]<4){
                  game4king[key][0]+=1;
                }
              console.log(user +" with kingdom " + kingdom )
              socket.emit( "joined", {username:user,game:"4kingdom",kingdom:kingdom,created_by:roomUser[key]["teacher"]["name"],quizName:roomUser[key]["quizName"]});
              // io.sockets.connected[roomUser[key]["teacher"]["id"]].emit( "joined", {username:user});
              io.to(roomUser[key]["teacher"]["id"]).emit("joined", {username:user});
              // socket.to(socketid).emit('message', 'for your eyes only');
              // socket.emit( "joined", {username:user,game:"4kingdom",kingdom:kingdom,created_by:roomUser[key]["teacher"]["name"],quizName:roomUser[key]["quizName"]});
            }else{
              io.to(roomUser[key]["teacher"]["id"]).emit("joined", {username:user});
              // socket.to(data.key).emit( "joined", {username:user});
              socket.emit( "joined", {username:user,game:roomUser[key]["game"],created_by:roomUser[key]["teacher"]["name"],quizName:roomUser[key]["quizName"]});
            }
            console.log(game4king);
            //end if
        }else{
            console.log("try throw error");
        }
    });
    

    socket.on("answer4king", function(data){
        //to do : for send result to teacher
        var qid = parseInt ( data.Qid )
        
      if(data.isCorrect=="true"){
        if(game4king[data.key][1]==(qid-1)) { //set winner
          game4king[data.key][1]=qid;
          var winner = parseInt(data.kingdom);
          game4king[data.key][2][0] = winner;
          socket.to(data.key).emit( "winner", {kingdom:winner,Qid:qid});
          socket.emit( "winner", {kingdom:winner,Qid:qid});
          console.log("emit set winner");
        }else{
          game4king[data.key][2].push(parseInt(data.kingdom));
          console.log("dont emit set winner");
        }
        console.log(game4king);
      }

      // append the result data into db
      var newAnswer = new Answer({
        name: data.name,
        rmID: roomUser[data.key]["id"],
        Qid: qid,
        time: data.time,
        choice: data.choice,
        correct_ans: data.correct_ans,
        isCorrect: data.isCorrect
      });
      newAnswer.save(function(err){
        if(err) throw err;
      });

      console.log(data);

    });

    socket.on("EndRound4king", function(data){
        console.log(game4king);
        console.log("EndRound4king");
        var key = parseInt(data.key);
        socket.emit( "RoundResult4king",{result:game4king[data.key][2]});
        socket.to(data.key).emit( "RoundResult4king",{result:game4king[data.key][2]});
    });

    socket.on("answer", function(data){
        //to do : for send result to teacher
      socket.emit("teacher", data);
      //for test

      // append the result data into db
      var newAnswer = new Answer({
        name: data.name,
        rmID: roomUser[data.key]["id"],
        Qid: data.Qid,
        time: data.time,
        choice: data.choice,
        correct_ans: data.correct_ans,
        isCorrect: data.isCorrect
      })
      newAnswer.save(function(err){
        if(err) throw err;
      })

      console.log(data);

      // Result.findOneAndUpdate(
      //     { name: data.name },
      //     {$push: {Answer: newAnswer}},
      //     {safe: true, upsert: true},
      //     function(err, model) {
      //         if (err) throw err;
      //         console.log(err);
      //     }
      // );
      // newAnswer.save(function (err){
      //   if(err) throw err;
      //   else  console.log("answer:" + data.answer);
      // })
    });



    socket.on("disconnect",function(data){
      if(user != ""){
        temp=[]
        temp_room = ""
        for(room in roomUser){
          for(i=0;i<roomUser[room]["student"].length;i++){
            if(roomUser[room]["student"][i]==user){
              temp_room = room;
              temp.push(i);
            }
          }
        }
        for(i=temp.length-1;i>=0;i--){
            roomUser[temp_room]["student"].splice(temp[i], 1);
        }
        console.log("disconnect:"+roomUser[temp_room]);
      }

    });
  //////////////end for required ////////////



    //from teacher clients




  socket.on("teacher", function(data){

    socket.broadcast.emit("User_connect", user);
  });


  //from student clients
  // socket.on("student_connect",function(data){
  //   console.log("student connected");
  //     socket.emit("student_connect",{ name:data.name});
  //   if(!data in students){
  //       students.push(data);
  //       socket.emit("student_connect",{ name:data.name});
  //       socket.broadcast.emit("student_connect",{ name:data.name});
  //   }
  //   // for(var i = 0 ; i < students.length; i++){
  //   //   socket.emit("student_connect"),{ name:students[i].name};
  //   //   console.log("User name":students[i].name: "is connected");
  //   // }
  // });

  socket.on("play", function(data){
    socket.to(key).emit( "error",{error:"teacher testing emit!"});
    console.log("teacher");
  });



});


module.exports = app;
