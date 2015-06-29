var chat = function(){
	var lsg = localStorage;
	var ssg = sessionStorage;
	var to = '';
	var name = '';
	var socket;
	var loginBtn = document.getElementById('login-btn');
	var sendBtn = document.getElementById('webim-ui-btn-send');
	var wrap = document.getElementsByClassName('webim-ui-wrapper')[0];
	var messageText = document.getElementById('webim-message');

	/*统一各浏览器事件处理机制*/
	var EventUtil = {
	    //调价事件
	    addHandler: function (element, type, handler) {
	        if (element.addEventListener) {
	            element.addEventListener(type, handler, false);
	        } else if (element.attachEvent) {
	            element.attachEvent("on" + type, handler);
	        } else {
	            element["on" + type] = handler;
	        }
	    },
	    //移除事件
	    removeHandler: function(element, type, handler){
	    	if (element.removeEventListener) {
	    		element.removeEventListener(type, handler, false);
	    	} else if (element.detachEvent) {
	    		element.detachEvent("on" + type, handler);
	    	} else {
	    		element["on" + type] = null;
	    	}
	    },
	    //统一滚轮事件返回值
	    getWheelDelta: function (event) {
	        if (event.wheelDelta) {
	            return (client.engine.opera && client.engine.opera < 9.5 ? -event.wheelDelta : event.wheelDelta);
	        } else {
	            return -event.detail * 40;
	        }
	    }
	};

	var login = function(){
		if(!!document.getElementById('name').value && !!document.getElementById('to').value){
			name = document.getElementById('name').value.trim();
			to = document.getElementById('to').value.trim();
			ssg.setItem('user', name);
			socket.emit('login',name);
			if(!socket._callbacks['to' + name]){
				socket.on('to' + name,function(data){
					var date = getDate();
					AddMsg('left', data.msg, date, data.from);
					SaveMsg('left', data ,date);
					scroll();
					notifyInTitle("你有新消息",500,function(method){
						//method.cancel();
					});
					notifyInWindow(data,to);
				});
			}
		}
	};
	var notifyInTitle = (function(){
		var timer;
		return function(title,flashTime,callback){
			var status=1;
			if(timer)
				clearInterval(timer);
			timer=setInterval(function(){
				document.getElementsByTagName('title')[0].innerHTML=(status)?title:'';
				status=(status+1)%2;
			},flashTime?flashTime:500);
			callback({
				cancel:function(){
					clearInterval(timer);
					document.getElementsByTagName('title')[0].innerHTML='';
				}
			});
		}
	})();
	var notifyInWindow = function(title,body,icon){
		if (window.Notification){
			if(Notification.Permissions!=='denied'){
				Notification.requestPermission(function(permission){
					if(permission==='granted'){
						var notification = new Notification(title,{body:body,icon:icon});
					}
					else{
						console.log('你已拒绝桌面通知');
					}
				});
			}
		}else
			console.log('你的浏览器不支持此特性，请下载谷歌浏览器试用该功能');
	};
	var keydown = function(e){
		e = e || window.event;
	    if (e.keyCode === 13) {
	    	e.preventDefault();
	    	sendMessage();
	    }
	};
	var sendMessage = function(){
		var msg = messageText.value;
		if(!msg) return false;
		socket.emit('chat', {'from':name, 'to':to, 'msg':msg});
		messageText.value = '';
		var date = getDate();
		AddMsg('right', msg, date, name);
		SaveMsg('right', msg, date);
		scroll();
	};
	var AddMsg = function(side, msg, date, name){
		var messageDiv = document.createElement('div');
		messageDiv.className = "webim-ui-wcontainer";
		switch(side){
			case 'right':
				messageDiv.innerHTML = '<div class="webim-ui-wright">'
					+'<div class="webim-ui-winfo"><span class="webim-ui-wname">'
					+'<a href="#" target="_blank">'+name+'</a></span><span class="webim-ui-wtime">'+ date +'</span></div>'
					+'<div class="webim-ui-wtext">'+msg+'</div>';
					+'</div>';
				break;
			case 'left':
				messageDiv.innerHTML = '<div class="webim-ui-wleft">'
					+'<div class="webim-ui-winfo"><span class="webim-ui-wname"><a href="#" target="_blank">'+to+'</a></span><span class="webim-ui-wtime">'+date+'</span></div>'
					+'<div class="webim-ui-wtext">'+msg+'</div>'
					+'</div>';
				break;
		}
		wrap.appendChild(messageDiv);
	};
	var SaveMsg = function(side, msg, date){
		var localMessage = lsg.getItem('message');
		if(!localMessage){
			var message = {};
			message[to] = [[side, msg, date]];
			lsg.setItem('message',JSON.stringify(message));
			return false;
		}else{
			message = JSON.parse(localMessage);
		}
		if(!message[to]){
			message[to] = [[side, msg, date]];
			lsg.setItem('message',JSON.stringify(message));
		}else{
			if(message[to].length < 30){
				message[to].push([side, msg, date]);
				lsg.setItem('message',JSON.stringify(message));
			}else{
				message[to].shift();
				message[to].push([side, msg, date]);
				lsg.setItem('message', JSON.stringify(message));
			}

		}
	};
	var getDate = function(){
		return new Date().toLocaleString();
	};
	/*控制滚动条至合适位置*/
	var scroll = function(){
		if(wrap.clientHeight < wrap.scrollHeight){
			wrap.scrollTop = wrap.scrollHeight - wrap.clientHeight;
		}
	};
	/*对象深度转换为数组（暂时没有用到）*/
	var toArray = function(json){
		if(!json instanceof Object){
			json = JSON.parse(json);
		}
		var arr = [];
		for(var i in json){
			if(i instanceof Object){
				json[i] = toArray(json[i]);
			}else{
				arr[i] = Array.prototype.slice.call(json[i]);
			}
		}
		return arr;
	};

	//获取聊天对象的聊天记录并展示在聊天窗口
	var getStorage = function(to){
		var localMessage = lsg.getItem('message');
		var message = JSON.parse(localMessage);
		for(var i = 0, len = message[to].length; i < len; i++){
			AddMsg(message[to][i][0], message[to][i][1], message[to][i][2],to);
		}
		//初始化滚动条滚到底部
		scroll();
	};
	
	var selectTo =function(){
		var ContactList=document.getElementById('webim-ui-contact').getElementsByTagName('li');
		for(var i=0;i<ContactList.length;i++){
			(function(i){
				EventUtil.addHandler(ContactList[i],'click',function(){
					to = ContactList[i].innerText;
					console.log(ContactList);
					for(var j=0;j<ContactList.length;j++){
						ContactList[j].className='webim-contacts';
					}
					ContactList[i].className='webim-contacts webim-talk-to';
					getStorage(to);
				});
			})(i)
		}
	};

	return the = {
		init : function(user,account,online){
			name = user;
			getStorage('b');

			//创建socket
			socket = io.connect();
			socket.on('connect', function(){
				console.log('成功连接到服务器！');
			});
			socket.on('message',function(data){
				console.log(data);
			});
			socket.on('disconnect',function(){
			  console.log('已失去连接！');
			});
			EventUtil.addHandler(sendBtn,'click',sendMessage);
			EventUtil.addHandler(messageText,'keydown',keydown);
			EventUtil.addHandler(loginBtn,'click',login);
			selectTo();
		}
	}
}();
