var http = require('http'),
    io = require('socket.io'),
    express = require('express'),
    querystring = require('querystring'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    mongo = require('mongodb');

var app = express();
var online = [];
var onlineSocket = {};

// express配置
app.set('view engine','ejs');           //模板引擎
app.set('host','localhost');
app.set('db_host','121.40.141.60');     //数据库地址
app.set('db_port',27017);               //数据库端口
app.set('db_name','chat');

app.use(express.static(__dirname));     //使用Public文件夹下的静态文件
app.use(session({
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
         url: 'mongodb://'+app.get('db_host')+'/'+app.get('db_name'),
    }),
    cookie: { maxAge: 600000 },
    secret: 'recommand 128 bytes random string',
}));             //数据库名

var dbServer = new mongo.Server(app.get('db_host'), app.get('db_port'), {auto_reconnect:true});
var db = new mongo.Db(app.get('db_name'), dbServer, {safe:true});
var server = http.createServer(app);

db.open(function(err, db){
    if(err) throw err;
    console.log('数据库连接建立成功！');
});

app.get('/',function(req, res) {
    if(!req.session.login){
        res.render('login');
    }else{
        res.render('chat',req.session.login);
    }
});
app.get('/chat.html',function(req,res){
    if(!req.session.login){
        res.render('login');
    }else{
        res.render('chat',req.session.login);
    }
})
app.post('/chat.html',function(req, res){
    req.on('data',function(data){
        var obj = querystring.parse(data.toString());
        db.collection('user',function(err, collection){
            collection.find({account:obj.account,password:obj.password}).toArray(function(err, docs){
                if(docs[0]){
                    req.session.login = {data: docs[0],online: obj.status};
                    res.render('chat',{data: docs[0],online: obj.status});
                }else{
                    res.writeHead(200,{'Content-Type':'text/html'});
                    res.write('<head><meta charset="utf-8"/><title>登陆错误</title><head>');
                    res.write('用户名或密码错误!<a href="http://localhost:3000">返回</a>');
                    res.end();
                }
            });
        });
    });
});
// 在3000端口启动服务器
server.listen(3000, function(){
    console.log('Server started at 3000!');
});

// 创建一个Socket.IO实例，把它传递给服务器
var socket= io.listen(server);

// 添加一个连接监听器
socket.on('connection', function(client){
    console.log('客户端连接！');
    var mark;
    // 成功！现在开始监听接收到的消息
    client.on('login',function(name){
        mark = name;
        if(online.indexOf(name) == -1){
            online.push(name);
        }
        onlineSocket[name] = client;
    });
    client.on('chat',function(data){
        if(online.indexOf(data.to) != -1){
            onlineSocket[data.to].emit('to' + data.to, data);
        }
    });
    client.on('message',function(event){
        console.log('Received message from client!',event);
    });
    client.on('disconnect',function(){
        online.splice(online.indexOf(mark),1);
        delete onlineSocket[mark];
    });
});
