var express = require('express');
var router = express.Router();
var mongodb = require('mongodb'),ObjectID = require('mongodb').ObjectID;
var bodyParser = require('body-parser');
var passport = require('passport');
// var url = 'mongodb://localhost:27017/site';
var url = 'mongodb://fyp002:1234@104.199.228.7:27017/site';

/* 	index
	api/get_result
	api/get_quiz_data
	api/deleteQuiz
	api/quiz_list	#post form:{name:username}
	api/get_quiz	#post form:{name:username,quizName:quizName}
	api/register
	api/logout
	api/login
	api/get_info
*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* register */
router.post('/register', function(req, res){
	res.header("Access-Control-Allow-Origin", "*");
	var MongoClient = mongodb.MongoClient;
	
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect Server', err);
		}else 
			console.log(req.body);
		
		type = "";
			
		//student
		if(req.body.type == "teacher"){	
			type = "teacher";
		}else
			type = "student";
			var UserList = db.collection('UserList');

			UserList.find({name : req.body.username}).toArray(function(err, result){
				console.log(result);
				if(result.length>0)
					res.status(500).send("repeated name!");
				else{

					var newUser={
						name: req.body.username,
						password: req.body.password,
						email: req.body.email, 
						gender: req.body.gender,
						type: type
					}

					UserList.insert([newUser], function(err, result){
						if (err){
							console.log(err);
							res.status(400).send(err);
						}else {
							//create a 30min session
							res.send(result.ops);
							console.log("sucessful user register!");
						}

					});

				}
				db.close();
			});

	});
});
/* logout */
router.get('/logout',function(req,res){
	req.session.user = null;
	// req.flash('success','sucessful logout!');
	res.send('sucessful logout!');
});

router.get('/get_info', function(req,res){
	var MongoClient = mongodb.MongoClient;
	
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect Server', err);
		}else {
			console.log("Connection Established");
			
			var userlist = db.collection('UserList');
			
			userlist.find({}).toArray(function(err, result){
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
});

/* login */
router.post('/login', function(req,res){
	var MongoClient = mongodb.MongoClient;
		MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect Server', err);
		}else {
			name = req.body.name;
			pw = req.body.password;
			var UserList = db.collection('UserList');
			UserList.find({name : name , password : pw}).toArray(function(err, result){
			console.log(result);
			if(Object.keys(result).length>0)
				res.status(200).send(result);
			else 
				res.status(400).send({
				   message: "wrong name or password!"
				});
			});
		}
	});
});

router.all('/get_result', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
 });

router.get('/get_result', function(req,res){
	var MongoClient = mongodb.MongoClient;
	var id = req.query.id;
	
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect Server', err);
		}else if(id!=undefined){
			
			var Result = db.collection('answers');
			Result.find( {"rmID": id} ).toArray(function(err, result){
				if(err){
					res.send(err);
				}else if(result.length){
					res.json(result);
				}else{
					res.send("No documents found");
				}
				
				db.close();
			});
		}else{
			var Result = db.collection('answers');
			
			Result.find().toArray(function(err, result){
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
});

router.get('/game_list/', function(req,res){
	var MongoClient = mongodb.MongoClient;
	
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect Server', err);
		}else{
			
            var Game = db.collection('games');
            Game.find().toArray(function(err, result){
                if(err){
                    res.send(err);
                }else if(result.length){
                    res.json(result);
                }else{
                    res.render("No documents found");
                }
                
                db.close();
            });
		}
	});
});

router.get('/deleteQuiz', function(req, res, next) {
	var id = req.query.id;
	console.log(id);
	var MongoClient = mongodb.MongoClient;
	
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect Server', err);
		}else if(id){
			
			var quiz = db.collection('QuizList');
			var obj_id = new ObjectID(id);
			quiz.deleteOne({"_id":obj_id},function(err, result){
				if(err){
					res.status(400).send(err);
				}else{
					res.send(200);
				}
				
				db.close();
			});

		}
	});
});

router.get('/quiz_list', function(req,res){
	var name = req.query.username;
	console.log(name);
	var MongoClient = mongodb.MongoClient;
	
	MongoClient.connect(url, function(err, db){
		if(err){
			console.log('Unable to connect Server', err);
		}else if(name){
			console.log("Connection Established");
			
			var quiz = db.collection('QuizList');

			quiz.find({created_by:name}).toArray(function(err, result){
				if(err){
					res.status(400).send(err);
				}else if(result.length){
					res.json(result);
				}else{
					res.status(400).send("No quizes found");
				}
				
				db.close();
			});
		}else{
			res.status(400).send("should post username!");
		}
	});
});

router.get('/get_quiz', function(req,res){
	var name = req.query.username;
	var quizName = req.query.quizName;
	// console.log(name!=undefined && quiz!=undefined);
	var MongoClient = mongodb.MongoClient;

	MongoClient.connect(url, function(err, db){

		if(err){
			console.log('Unable to connect Server', err);
		}else if(name!=undefined && quizName!=undefined){
			var quiz = db.collection('QuizList');

			quiz.find({name:quizName,created_by:name}).toArray(function(err, result){
				if(err){
					res.status(400).send(err);
				}else if(result.length){
					res.json(result);
				}else{
					res.status(400).send("No quizes found");
				}
				
				db.close();
			});
		}else{
			res.status(400).send("should contain GET parameter of username and quizName!");
		}
	});
});


module.exports = router;
