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
					AddMsg('left', data, date);
					SaveMsg('left', data ,date);
					scroll();
				});
			}
		}
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
		socket.emit('chat', {'name':name, 'to':to, 'msg':msg});
		messageText.value = '';
		var date = getDate();
		AddMsg('right', msg, date);
		SaveMsg('right', msg, date);
		scroll();
	};
	var AddMsg = function(side, msg, date){
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
			message[to].push([side, msg, date]);
			lsg.setItem('message',JSON.stringify(message));
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


	return the = {
		init : function(){
			//初始化滚动条滚到底部
			scroll();

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
		}
	}
}();