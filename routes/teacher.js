var express = require('express');
var router = express.Router();
var mongodb = require('mongodb'),ObjectID = require('mongodb').ObjectID;;
var bodyParser = require('body-parser');
var convertExcel = require('excel-as-json').processFile;
var multer = require('multer');
// var url = 'mongodb://localhost:27017/site';
var url = 'mongodb://fyp002:1234@104.199.228.7:27017/site';
var api = "http://10.146.0.2:8080/";
// var api = "http://localhost:8080/";
var request = require("request");
var cookieParser = require('cookie-parser');
var session = require('express-session');
//get connection requests from teachers
router.use(cookieParser());
router.use(session({
    // secret: "fd34s@!@dfa725f3DF#$D&W",
    secret: "oFjFWb0FKcTL7vxlMQDRlhD7",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: !true }
}));

router.use(function(req, res, next) {

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


/* GET home page. */

router.get('/login', function(req, res, next) {
  res.render('login', { });
});

router.post('/login', function(req, res, next) {
    console.log(req.body);
    if (req.session.username == undefined ){
        upload(req,res,function(err){
            console.log(req.body);
        var username = req.body.username;
        var password = req.body.password;

        request.post({
            url:     api + "api/login/",
            form:    { name: username,password: password }
        }, function(error, response, body){
          if (!error && response.statusCode === 200) {
                req.session.regenerate(function () {
                    req.session.username = username;
                    res.render('index', { tag: 'Home' });
                });
            }else{
                res.render('login', {error:"wrong name or password!" });
            }
        });
    });
    }else
        res.render('index', { tag: 'Home' });

});

router.get('/register', function(req, res, next) {
  res.render('register', {  });
});

router.get('/logout', function(req, res, next) {
    //todo : logout logic
    req.session.destroy(function(err){  
        if(err){  
            console.log(err);
            res.redirect('/');
        }  
        else  
        {  
            res.render('login', { });
        }  
    }); 

});

router.post('/register', function(req, res, next) {
    if (req.session.username == undefined ){
        upload(req,res,function(err){
            request.post({
                url:     api + "api/register/",
                form:    {      username: req.body.username,
                                password: req.body.password,
                                email: req.body.email, 
                                gender: req.body.gender,
                                type: "teacher"      }
            }, function(error, response, body){
              if (!error && response.statusCode === 200) {
                    req.session.regenerate(function () {
                        req.session.username = req.body.username;
                        res.render('index', { tag: 'Home' });
                    });
                }else{
                    res.render('register', { });
                }
            });
        });
    }else
        res.render('index', { tag: 'Home' });
});

router.get('/', function(req, res, next) {
    if (req.session.username != undefined )
        res.render('index', { tag: 'Home' });
    else
        res.render('login', { });
});

router.get('/result', function(req, res, next) {
    if (req.session.username != undefined ){
        var MongoClient = mongodb.MongoClient;
        
        MongoClient.connect(url, function(err, db){
            if(err){
                console.log('Unable to connect Server', err);
            }else if (req.session.username != undefined ){
                var username = req.session.username;
                var Game = db.collection('games');
                Game.find( {"created_by": username} ).toArray(function(err, result){
                    if(err){
                        res.send(err);
                    }else if(result.length){
                        res.render('result', { tag: 'result',result:result });
                    }else{
                        res.render('nonFound', { tag: 'result',error:"No game result found!" });
                    }
                    
                    db.close();
                });
            }
        });
    }else
        res.render('login', { });
});

router.get('/result/PieChart/', function(req, res, next) {
    var MongoClient = mongodb.MongoClient;
    var id = req.query.id;
    var Qcount = req.query.Qcount;
    
    MongoClient.connect(url, function(err, db){
        if(err){
            console.log('Unable to connect Server', err);
        }else if (id != undefined && Qcount != undefined ){

            var Result = db.collection('answers');
            Result.find( {"rmID": id} ).toArray(function(err, result){
                if(err){
                    res.send(err);
                }else if(result.length){

                    console.log(result);
                    res.render('pie_chart', { tag: 'result',result:result, Qcount:Qcount });
                }else{
                    res.send("No documents found");
                }
                
                db.close();
            });

        }
    });
  
});

router.get('/result/TimeLine/', function(req, res, next) {
    var MongoClient = mongodb.MongoClient;
    var id = req.query.id;

    MongoClient.connect(url, function(err, db){
        
        if(err){
            console.log('Unable to connect Server', err);
        }else if (id != undefined ){

            var Result = db.collection('answers');
            var obj_id = new ObjectID(id);
            var Game = db.collection('games');
            Result.find( {"rmID": id} ).toArray(function(err, gameResult){
                if(err){
                    res.send(err);
                }else if(gameResult.length){
                    console.log(gameResult);

                    Game.find({"_id":obj_id}).toArray(function(err, gameData){
                        if(err){
                            res.send(err);
                        }else if(gameData.length){
                            console.log(gameData);
                            res.render('timeline', { tag: 'result',gameResult:gameResult, gameData:gameData[0] });
                        }else{
                            console.log("game null");
                            console.log(result);
                        }
                
                    });
                }else{
                    console.log("answer null");
                    console.log(result);
                }
                
                db.close();
            });

        }

        
    });

});

router.get('/result/allresult/', function(req, res, next) {
    var MongoClient = mongodb.MongoClient;
    var id = req.query.id;

    MongoClient.connect(url, function(err, db){
        
        if(err){
            console.log('Unable to connect Server', err);
        }else if (id != undefined ){

            var Result = db.collection('answers');
            var obj_id = new ObjectID(id);
            var Game = db.collection('games');
            Result.find( {"rmID": id} ).toArray(function(err, gameResult){
                if(err){
                    res.send(err);
                }else if(gameResult.length){
                    console.log(gameResult);

                    Game.find({"_id":obj_id}).toArray(function(err, gameData){
                        if(err){
                            res.send(err);
                        }else if(gameData.length){
                            console.log(JSON.stringify(gameData));
                            gameData = gameData[0];
                            var allresult = [];
                            var count = gameData.playerList.length;
                            for(var p=0;p<count;p++){
                                var name = gameData.playerList[p];
                                var stuResult = {};
                                stuResult["correct"] = 0;
                                stuResult["incorrect"] = 0;
                                stuResult["result"] = [];
                                stuResult["name"] = name;
                                for(var k=0;k<gameResult.length;k++){
                                    if(gameResult[k].name == name){
                                        var Qid = gameResult[k].Qid;
                                        stuResult["result"][Qid] = gameResult[k].isCorrect;
                                        if(gameResult[k].isCorrect)
                                            stuResult["correct"] +=1;
                                        else
                                            stuResult["incorrect"] +=1;
                                    }
                                }
                                console.log(stuResult);
                                allresult.push(stuResult);
                            }
                            console.log(allresult);
                            res.render('allResult', { tag: 'result',allresult:allresult,gameResult:gameResult, gameData:gameData });
                        }else{
                            res.send("game null");
                            console.log(result);
                        }
                
                    });
                }else{
                    console.log("answer null");
                    console.log(result);
                }
                
                db.close();
            });

        }

        
    });

});


router.get('/input_quiz', function(req, res, next) {
    if (req.session.username != undefined ){
        console.log(req.session.username);
        res.render('inputQuiz', { tag: 'inputQuiz' });
    }else
        res.render('login', { });
});


router.get('/input_quiz/download', function(req, res) {
    res.download('public/template.xlsx');
});


var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter : function(req, file, callback) { //file filter
        if (['xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');


/** API path that will upload the files */
router.post('/input_quiz/upload', function(req, res) {
	upload(req,res,function(err){
        if(!req.file){
                console.log("No file passed");
                res.json({error_code:1,err_desc:"No file passed"});
                return;
            }
        if(err){
                 res.json({error_code:1,err_desc:err});
                 return;
            }
        try {
            convertExcel(req.file.path,null,null,function(err,data){
                    if(err) {
                        return res.json({error_code:1,err_desc:err, data: null});
                    } 

                    var output = {};
                    console.log(data);
                    for(var i=0;i<data.length;i++){
                        output[i]=data[i];
                    }

                    var MongoClient = mongodb.MongoClient;

                    MongoClient.connect(url, function(err, db){
                        if(err){
                            console.log('Unable to connect Server', err);
                        }
                        var QuizList = db.collection('QuizList');
                        QuizList.find({name : req.body.quizName}).toArray(function(err, result){
                            console.log(result);
                            if(result.length>0)
                                res.status(500).send("repeated name!");
                            else{
                                //todo created by hard code
                                console.log(output);
                                var newQuiz={
                                    name: req.body.quizName,
                                    created_by: req.session.username,    
                                    Quiz: output
                                }

                                QuizList.insert([newQuiz], function(err, result){
                                    if (err){
                                        console.log(err);
                                        res.status(400).send(err);
                                    }else if(Object.keys(output).length == 0){
                                        console.log("output is empty!");
                                        res.status(400).send(err);
                                    }else {
                                        console.log("sucessful import Quiz!");
                                        res.render('inputResult', { Quiz: data, quizName: req.body.quizName, tag: "inputQuiz" });
                                    }

                                });

                            }

                        });
                    });
                    
                }
            );
        } catch (e){
            res.json({error_code:1,err_desc:"Corupted excel file"});
        }
    })
   
});


//get quiz of that teacher
router.get('/view_quiz', function(req, res, next) {
    if (req.session.username != undefined ){
        console.log(req.session.username);
        request({
            url: api + "api/quiz_list/?username=" + req.session.username,
            json: true
        }, function (error, response, body) {       //todo Holly

            if (!error && response.statusCode === 200) {
                
                for(var i=0;i<body.length;i++){
                    output = [];
                    for(q in body[i].Quiz){
                        output.push ( body[i].Quiz[q] );
                    }
                    body[i].Quiz = output;
                }
                res.render('quizView', { tag: 'quizView' , Quiz: body});
            }else{
                res.render('nonFound', { tag: 'quizView' , error: "No quiz found!"});       
            }
        });
    }else
        res.render('login', { });
});


module.exports = router;
