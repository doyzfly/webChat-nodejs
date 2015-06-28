var http = require('http');
var io = require('socket.io');
var fs = require('fs');
var express = require('express');

var app = express();
var online = [];
var onlineSocket = {};

var server = http.createServer(app);

app.get('/',function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/login.html',function(req, res){
    res.sendFile(__dirname + './login.html');
})
app.use(express.static(__dirname));
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
            onlineSocket[data.to].emit('to' + data.to, data.msg);
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
