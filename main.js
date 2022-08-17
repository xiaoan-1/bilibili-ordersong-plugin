window.onload = function(){
    // 1. 初始化播放器
    initPlayer();
      
    // 2. 初始化配置项
    initConfig();

    // 3. 初始化webSocket对象
    let initSuccess = initSocket();
    
    // 4. 若初始化成功,打开websoket连接直播间
    if(initSuccess){
        openWebSocket();
    } 
}


/* 播放器对象 */
const player = {
    //  音频对象
    audio: null,
    
    // 页面元素
    elem: null,

    // 用户点歌列表
    orderList: [],

    // 空闲歌单列表 
    freeList: [],

    // 空闲歌单列表的播放索引
    freeIndex: 0, 

    // 点歌历史用户
    userHistory: [],

    // 点歌历史歌曲
    songHistory: [],
}
function initPlayer(){
    // 创建音频对象
    player.audio = new Audio();  
    // 绑定页面元素
    player.elem = document.getElementById('songList');

    // 添加点歌方法
    player.addOrder = function(order){
        // 添加点歌信息到点歌列表中
        this.orderList.push(order);
        // 页面同步添加
        var tr = document.createElement('tr');
        tr.innerHTML = `<td>${order.song.sname}</td>
            <td>${order.song.sartist}</td>
            <td>${order.uname}</td></td>`
        this.elem.appendChild(tr);
        
        // 添加用户历史记录
        configMethod.addUserHistory({
            uid: order.uid,
            uname: order.uname 
        })
        // 添加歌曲历史记录
        configMethod.addSongHistory({
            sid: order.song.sid,
            sname: order.song.sname
        })
       
    }
    // 播放歌曲方法
    player.play = async function(songId){
        this.audio.src = await musicServer.getSongUrl(songId);
        if(this.audio.src){
            this.audio.play();
        }else{
            musicMethod.pageAlert("歌曲链接被吃了>_<!");
        }
    }
    // 播放下一首方法
    player.playNext = function(){
        // 播放下一首时，如果点歌列表存在歌曲，则删除第一首
        if(this.orderList.length > 0){
            this.orderList.shift();
            this.elem.firstElementChild.remove();
        }
        // 点歌列表没有歌曲，则播放空闲歌单的歌曲
        if(this.orderList.length == 0){
            // 点歌列表没有歌曲时，则随机播放空闲歌单的歌曲
            if(this.freeList.length > 0){
                this.freeIndex = parseInt(Math.random() * this.freeList.length, 10);
                this.addOrder(this.freeList[this.freeIndex++]);
                this.play(this.orderList[0].song.sid);
            }else{
                musicMethod.pageAlert("没有下一首可以放了>_<!");
            }
        }else {           
            // 播放删除后的当前第一首歌曲
            this.play(this.orderList[0].song.sid)
        }
    }

     // 1. 开始播放事件
     player.audio.addEventListener("play", function () {
        let dot = document.getElementsByClassName('dot')[0]; 
        // 设置闪烁动画
        if (!dot.classList.contains("dot_blink")) {
            dot.classList.add("dot_blink");
        }
    });
    // 2. 暂停播放事件
    player.audio.addEventListener("pause", function () {
        let dot = document.getElementsByClassName('dot')[0]; 
        // 设置闪烁动画
        if (!dot.classList.contains("dot_blink")) {
            dot.classList.remove("dot_blink");
        }
    });
    // 3. 播放时间更新事件
    player.audio.addEventListener("timeupdate", function () {
        let progress = document.getElementsByClassName('progress_bar')[0];
        // 页面进度条实时修改
        progress.style.width = ((player.audio.currentTime / player.audio.duration) * 280) + "px";
    });
    // 4. 播放结束事件
    player.audio.addEventListener("ended", function(){  
        // 播放下一首歌曲
        player.playNext();
    });
    // 5. 播放失败事件
    player.audio.addEventListener("error", function(){  
        // 播放下一首歌曲
        player.playNext();
        musicMethod.pageAlert("播放错误，播放下一首");
    });
    musicMethod.pageAlert("已初始化播放器!");
}


/* 配置对象 */
const config = {
    
    // 管理员id（用于切歌命令的最高权限者）
    adminId: 352905327,

    // 用户点歌数量限制
    userOrder: 3,
    
    // 最大点歌数限制
    maxOrder: 15,

    // 最大歌曲时长限制(单位秒)
    maxDuration: 300,
    
    // 空闲歌单ID (登录网易云网站，获取歌单页面url结尾ID)
    songListId: 7319049505, 
    
    // 用户黑名单
    userBlackList: [],
    
    // 歌曲黑名单
    songBlackList: [],

    // 登录手机号
    phone: null,

    // 用户登录的cookie
    cookie: null,
}
async function initConfig(){
    // 1. 在本地存储中更新配置项
    for(let key in config){
        if(localStorage.getItem(key)){
            switch(key){
                case 'cookie':
                    config[key] = localStorage.getItem(key);
                    break;
                case 'userBlackList':
                    config[key] = JSON.parse(localStorage.getItem(key));
                    break;
                case 'songBlackList': 
                    config[key] = JSON.parse(localStorage.getItem(key));
                    break;
                default: 
                    config[key] = parseInt(localStorage.getItem(key));
                    break;
            }           
        }
    }

    // 2. 加载空闲歌单
    configMethod.loadSongList(config.songListId);

    // 3. 获取用户登录状态
    let phone = document.getElementById('phone');
    if(config.cookie){ 
        let btnLogin = document.getElementById('login');
        // 获取登录的用户信息
        let loginStatus = await musicServer.loginStatus();
        if(loginStatus.code == 200){
            // 获取当前cookie登录的手机号
            phone.value = loginStatus.account.userName; 
            // 修改按钮标题
            btnLogin.textContent = "退出登录";
            phone.disable = "true";
        }
    }
    
    // 4. 读取黑用户黑名单的配置项，并加载到页面中
    let userBlackList = document.getElementById('userBlackList');
    for(let i = 0; i < config.userBlackList.length; i++){
        let op = document.createElement('option');
        op.value = config.userBlackList[i].uid;
        op.textContent = config.userBlackList[i].uname;
        userBlackList.appendChild(op);
    }

    // 5. 读取歌曲黑名单配置项，并加载到页面中
    let songBlackList = document.getElementById('songBlackList');
    for(let i = 0; i < config.songBlackList.length; i++){
        let op = document.createElement('option');
        op.value = config.songBlackList[i].sid;
        op.textContent = config.songBlackList[i].sname;
        songBlackList.appendChild(op);
    }

    // 6. 设置实时修改部分配置项方法
    let keys = ["adminId", "userOrder", "maxOrder", "maxDuration"];
    for(let i = 0; i < keys.length; i++){
        let elem = document.getElementById(keys[i]);
        elem.value = config[keys[i]];
        elem.addEventListener('keyup', function(){
            // 保存配置
            config[keys[i]] = parseInt(elem.value);
            localStorage.setItem(keys[i], elem.value);
        })
    }

    // 7. 绑定其他配置项按钮事件
    let sendTimer;
    // --获取验证码
    document.getElementById('getCaptcha').onclick = async function(e){
        let phone = document.getElementById('phone');  
        // 校验手机号格式 
        var regExp = new RegExp("^1[3578]\\d{9}$");
        if(phone.value != "" && regExp.test(phone.value)){     
            let second = 30;
            // 发送验证码
            let resp = await musicServer.sendCaptcha(phone.value);
            if(resp.code == 200){
                // 若发送成功，则保存手机号到配置项，用于登录时获取
                config.phone = phone.value;
                musicMethod.pageAlert("发送成功!");
            }else{
                // 发送失败，显示错误信息
                musicMethod.pageAlert(resp.msg);
            }
            // 发送后使按钮失效
            e.target.setAttribute("disabled", true);
            // 进行页面倒计时，30秒后可再次发送验证码
            e.target.textContent = second;
            sendTimer = setInterval(function(){
                if(second > 0){
                    second--;
                    e.target.textContent = second;
                }else{
                    e.target.removeAttribute("disabled");
                    e.target.textContent = "获取验证码";
                    clearInterval(sendTimer);
                }
            }, 1000)
        }else{
            musicMethod.pageAlert("手机号不正确!");
        }
    }
    // --登录
    document.getElementById('login').onclick = async function(e){
        let captcha = document.getElementById('captcha');  
        if(config.cookie == null){
            // 如果当前不存在cookie，则进行登录获取cookie
            if(config.phone != null && captcha.value != ""){
                 // 先校验验证码是否正确
                let verify = await musicServer.verifyCaptcha(config.phone, captcha.value);
                if(verify.code == 200){
                    // 验证码正确，请求登录
                    let loginData = await musicServer.login(config.phone, captcha.value);
                    // 保存cookie
                    config.cookie = loginData.cookie;
                    localStorage.setItem("cookie", config.cookie);
                    e.target.textContent = "退出登录";
                    phone.disabled = "true";
                }else{
                    musicMethod.pageAlert(verify.message);
                }
            }else{
                musicMethod.pageAlert("未输入手机号或者验证码！");
            }
        }else{
            // 若当前存在cookie信息，则进行退出登录
            // 发送退出登录请求
            musicServer.logout();
            // 清空手机号
            phone.value = "";
            config.phone = null;
            // 删除本地cookie
            config.cookie = null;
            localStorage.removeItem("cookie");
            e.target.textContent = "登录";
            phone.disabled = "";
            musicMethod.pageAlert("已退出登录!");
        }  
    }
    // --加载歌单
    document.getElementById('loadSongList').onclick = async function(e){
        let listId = parseInt(songListId.value);
        if(listId && config.listId != listId){
            configMethod.loadSongList(listId);
            // 设置防抖功能, 使按钮失效几秒
            e.target.setAttribute("disabled", true);
            setTimeout(function(){
                console.log(e.target);
                e.target.removeAttribute("disabled");
            }, 3000);
        }else{
            musicMethod.pageAlert("未修改歌单Id");
        }
    };
    // --添加用户到黑名单
    document.getElementById('addUserBlack').onclick = function(){
        let userHistory = document.getElementById('userHistory');
        if(userHistory.children.length > 0){
            configMethod.addUserBlackList({
                uid: parseInt(userHistory[userHistory.selectedIndex].value),
                uname: userHistory[userHistory.selectedIndex].textContent
            });
            // 添加完成后删除历史用户的记录
            player.userHistory.splice(userHistory.selectedIndex,1);
            userHistory.options[userHistory.selectedIndex].remove();
            localStorage.setItem("userBlackList", JSON.stringify(config.userBlackList));
        }else{
            musicMethod.pageAlert("历史用户为空!");
        }
    };
    // --添加歌曲到黑名单
    document.getElementById('addSongBlack').onclick = function(){
        let songHistory = document.getElementById('songHistory');
        if(songHistory.children.length > 0){
            configMethod.addSongBlackList({
                sid: parseInt(songHistory[songHistory.selectedIndex].value),
                sname: songHistory[songHistory.selectedIndex].textContent
            });
            // 添加完成后删除历史歌曲的记录
            player.songHistory.splice(songHistory.selectedIndex,1);
            songHistory.options[songHistory.selectedIndex].remove();
            localStorage.setItem("songBlackList", JSON.stringify(config.songBlackList));
        }else{
            musicMethod.pageAlert("历史歌曲为空");
        }
    };
    // --移除黑名单的用户
    document.getElementById('delUserBlack').onclick = function(){
        let selectedIndex = userBlackList.selectedIndex;
        if(selectedIndex > -1){
            // 移除页面中用户黑名单的选中用户
            userBlackList.options[selectedIndex].remove();
            // 移除配置项中用户黑名单的对应用户
            config.userBlackList.splice(selectedIndex, 1);
            // 更新本地存储配置项
            localStorage.setItem("userBlackList", JSON.stringify(config.userBlackList));
        }else{
            musicMethod.pageAlert("移除失败，未选择移除用户");
        }
        
    };
    // --移除黑名单的歌曲
    document.getElementById('delSongBlack').onclick = function(){
        let selectedIndex = songBlackList.selectedIndex;
        if(selectedIndex > -1){
            // 移除页面中歌曲黑名单的选中歌曲
            songBlackList.options[selectedIndex].remove();
            // 移除配置项中歌曲黑名单对应的歌曲
            config.songBlackList.splice(selectedIndex, 1);
            // 更新本地存储配置项
            localStorage.setItem("songBlackList", JSON.stringify(config.songBlackList));

        }else{
            musicMethod.pageAlert("移除失败，未选择移除歌曲");
        }
    };
    // --设置界面的显示与隐藏
    document.getElementById('setting').onclick = function(){
        let configPanel = document.getElementsByClassName('config')[0];
        if(configPanel.clientHeight < 1){
            configPanel.style.height = "400px";
        }else{
            configPanel.style.height = "0px";
        }
    } 
    musicMethod.pageAlert("已初始化配置项");
}

/* webSocket对象 */
const webSocket = {
    // socket连接地址
    url: "",

    // webSoket对象
    socket: null,
    
    // 直播间ID
    roomId: 0,

    // 发送心跳包的定时器
    timer: null,

    // 鉴权包
    authPacket: null,

    // 心跳包
    heartPacket: null,
}
function initSocket(){
    // 检查浏览器是否支持webSocket 
    if (typeof (WebSocket) == "undefined") {
        musicMethod.pageAlert("您的浏览器不支持WebSocket！");
        return false;
    } 

    // 设置连接url
    webSocket.url = "wss://broadcastlv.chat.bilibili.com:2245/sub";

    // 获取URL中的房间id参数
    let URLParam = window.location.search.substring(1).split('&');
    URLParam.forEach(str => {
        let param = str.split('=');
        if(param.length == 2 && param[0].toLocaleUpperCase() == "ROOMID"){
            webSocket.roomId = parseInt(param[1]);
            musicMethod.pageAlert("已获取直播间ID:" + webSocket.roomId);
        }
    });

    if(!webSocket.roomId){
        setInterval(function(){
            musicMethod.pageAlert("未获取到直播间ID,请检查URL");
        },7000);
        return false;
    }

    // 设置鉴权包 
    let authInfo = {
        'uid': 22811879,
        'roomid': parseInt(webSocket.roomId, 10),
        'protover': 2,
        'platform': 'web',
        'clientver': '1.8.5',
        'type': 2,
    }
    webSocket.authPacket = packetMethod.createPacket(JSON.stringify(authInfo), 1, 7, 1)
    
    // 设置心跳包 
    let heartInfo = "[object Object]"
    webSocket.heartPacket = packetMethod.createPacket(heartInfo, 1, 2, 1);

    musicMethod.pageAlert("已初始化webSocket连接!");
    return true;
}


/* 打开websocket连接 */ 
function openWebSocket(){
    // 检查是否已存在socket连接
    if(webSocket.socket != null){
        webSocket.socket.close();
        webSocket.socket = null;
    }

    // 建立新的socket连接
    let socket = null;
    try {
        // 创建新的websocket连接
        socket = new WebSocket(webSocket.url);
    } catch (error) {
        return false;
    }

    // 1. 连接打开事件
    socket.onopen = function () {
        
        // 发送心跳包和鉴权包 
        socket.send(webSocket.authPacket);
        socket.send(webSocket.heartPacket);

        //发送心跳包 每30s发送一次
        let timer = setInterval(function () {
            socket.send(webSocket.heartPacket);
        }, 30000);

        // 设置webSocke
        webSocket.socket = socket;
        webSocket.timer = timer;

        musicMethod.pageAlert("弹幕服务器连接已打开");
    };

    // 2. 获得消息事件
    socket.onmessage = function (msg) {

        // 接收弹幕消息，开始处理前端触发逻辑
        var reader = new FileReader();

        //读取blob对象（二进制流）为arraybuffer（二进制数组）
        reader.readAsArrayBuffer(msg.data);

        // 读取完毕后， 处理服务端数据
        reader.onload = function (event) {
            packetMethod.handlePacket(reader.result); 
        };
    };

    // 3. 连接关闭事件
    socket.onclose = function () {
        // 停止发送心跳包
        clearInterval(webSocket.timer);
        musicMethod.pageAlert("弹幕服务器连接已关闭!");
    };

    // 4. 连接错误事件
    socket.onerror = function () {
        musicMethod.pageAlert("连接到弹幕服务器发生了错误!")
    }
}


/*  识别弹幕命令
    @param: userDanmu 包括用户id、用户名、用户弹幕
*/
async function identifyDanmuCommand(userDanmu){
    let danmu = userDanmu.danmu.trim();
    // 点歌命令，触发点歌流程
    if (danmu.slice(0, 2) == "点歌" && musicMethod.checkUser(userDanmu.uid)) {
        // 获取点歌关键词
        let keyword = danmu.slice(2);
        // 根据关键词通过API查询歌曲信息
        let song = await musicServer.getSongInfo(keyword);  
        if(song){
            // 封装点歌信息
            let order = {
                uid: userDanmu.uid,
                uname: userDanmu.uname,
                song: song
            }
            if(await musicMethod.checkOrder(order)){ 
                // 添加点歌信息到点歌列表  
                player.addOrder(order);

                // 如果当前点歌列表第一首是空闲歌单，则播放下一首
                if(player.orderList.length > 0 && player.orderList[0].uname == "空闲歌单"){
                    player.playNext();
                }
            }            
            // 如果当前播放没有播放歌曲，则开始播放第一首歌
            if(player.audio.paused && player.orderList.length > 0){
                player.play(player.orderList[0].song.sid);
            }
        }else{
            musicMethod.pageAlert("挺好听的，虽然我没找到<(▰˘◡˘▰)>");
        }      
    } else if (danmu == "切歌") { 
        // 切歌命令，触发切歌流程
        if(player.orderList[0].uid == userDanmu.uid || userDanmu.uid == config.adminId){
            // 如果当前播放的是该用户的歌曲，或者发送命令的是管理员，则播放下一首歌曲
            player.playNext();
        }else{
            musicMethod.pageAlert("不能切别人点的歌哦(^o^)");
        }
        
    }
}



/* 歌曲API服务 */
var musicServer = {
    
    // 服务器地址
    baseUrl: "http://plugin.changsheng.space:3000",
    
    /* 发送验证码 
        @param phone 手机号
    */
    sendCaptcha: async function(phone){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/captcha/sent",
            params:{
                phone: phone
            }
        }).then(function (resp) {
            data = resp.data;
        });
        return data;
    },

    /* 校验验证码 
        @param phone 手机号
       @param captcha 验证码
    */
    verifyCaptcha: async function(phone, captcha){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/captcha/verify",
            params: {
                phone: phone,
                captcha: captcha,
            }
        }).then(function (resp) {
            data = resp.data;
        });
        return data;
    },

    /* 登录
       @param phone 手机号
       @param captcha 验证码
     */
    login: async function(phone, captcha){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/login/cellphone",
            params: {
                phone: phone,
                captcha: captcha,
            }
        }).then(function (resp) {
            data = resp.data;
        });
        return data;
    },

    /* 退出登录 */
    logout: async function(){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/logout",
            params: {
                cookie: config.cookie
            }
        }).then(function (resp) {
            data = resp.data;
        });
        return data;
    },

    /* 获取用户详情 */
    getUserDetail: async function(){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/user/account",
            params: {
                cookie: config.cookie
            }
        }).then(function (resp) {
            data = resp.data;
            console.log(resp.data);
        });
        return data;
    },

    /* 登录状态 */
    loginStatus: async function(){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/login/status",
            params: {
                cookie: config.cookie
            }
        }).then(function (resp) {
            data = resp.data.data;

        });
        return data;
    },

    /* 搜索歌曲信息 
        @param keyword 关键词
    */
    getSongInfo: async function(keyword){
        let song = null;
        await axios({
            method: "get",
            url: this.baseUrl +"/search",
            params: {
                cookie: config.cookie,
                keywords: keyword,
                limit: 10,
                type: 1,
            }
        }).then(function (resp) {
            // 获取歌曲列表
            let songs = resp.data.result.songs;
            if(songs.length > 0){
                // 封装歌曲信息
                song = musicMethod.getSongObject({
                    sid: songs[0].id,
                    sname: songs[0].name,
                    sartist:songs[0].artists[0].name,
                    duration: songs[0].duration
                });
            }
        })
        return song;
    },

    /* 获取歌曲链接
        @param songId 歌曲Id
    */
    getSongUrl: async function(songId){
        let url = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/song/url",
            params: {
                cookie: config.cookie,
                id: songId
            }
        }).then(function (resp) {
            if(resp.data.data[0].url){
                url = resp.data.data[0].url;
            }
        })
        return url;
    },

    /* 获取歌单列表 
        @param listId 歌单Id
    */
    getSongList: async function(listId){
        let songList = new Array();
        await axios({
            method: "get",
            url: this.baseUrl + "/playlist/track/all",
            params: {
                cookie: config.cookie,
                id: listId
            }
        }).then(function (resp) {
            let songs = resp.data.songs;
            // 获取歌单的所有歌曲
            for(let i = 0; i < songs.length; i++){
                let song = {
                    uid: 123456,
                    uname: "空闲歌单",
                    song: {
                        sid: songs[i].id,
                        sname:songs[i].name,
                        sartist:songs[i].ar[0].name
                    }
                }
                songList.push(song);
            }
        })
        return songList;
    },
    
}

/* 用于处理歌曲信息的方法函数 */
const musicMethod = {
    // 设置仅可访问的歌曲对象（好像也没必要^_^）
    getSongObject: function(value){
        let object = new Object();
        Object.defineProperties(object, {
            'sid':{
                value: value.sid,
                enumerable: true
            },
            'sname':{
                value: value.sname,
                enumerable: true
            },
            'sartist':{
                value: value.sartist,
                enumerable: true
            },
            'duration':{
                value: value.duration,
                enumerable: true
            }
        })
        return object;
    },
    // 验证点歌用户信息
    checkUser: function(uid){
        // 查询该用户是否被拉入黑名单
        for (let i = 0; i < config.userBlackList.length; i++) {
            if(config.userBlackList[i].uid == uid){
                this.pageAlert("你已被加入暗杀名单!(▼へ▼メ)!");
                return false;
            }
        }
        if(player.orderList.filter(value => value.uid == uid).length >= config.userOrder){
            // 用户点歌数是否已达上限
            this.pageAlert("你点太多啦，歇歇吧>_<!");
            return false;
        }else if(player.orderList.length >= config.maxOrder){
            // 最大点歌数是否已达上限
            this.pageAlert("我装不下更多的歌啦>_<!");
            return false;
        }
        return true;
    },
    // 验证点歌歌曲信息
    checkOrder: async function(order){
        // 查询该歌曲是否被拉入黑名单
        for (let i = 0; i < config.songBlackList.length; i++) {
            if(config.songBlackList[i].sid == order.song.sid){
                this.pageAlert("不要乱点奇怪的歌!(▼ヘ▼#)");
                return false;
            }
        }     
        if(player.orderList.some(value => value.song.sid == order.song.sid)){
            // 判断该歌曲是否已在点歌列表
            this.pageAlert("已经点上啦!>_<!");
            return false;
        } else if(order.song.duration > config.maxDuration * 1000){
            // 该歌曲是否超出时长
            this.pageAlert("你点的歌时太长啦!>_<");
            return false
        }else if(!await musicServer.getSongUrl(order.song.sid)){
            // 该歌曲url是否存在
            this.pageAlert("虽然找到了,但是放不出来>_<");
            return false;
        }
        return true;
    },
    // 页面提示输出
    pageAlert: function(str){
        let alertBox = document.getElementsByClassName("alertBox")[0];
        let div = document.createElement('div');
        div.textContent = str;
        div.className = "text";
        alertBox.appendChild(div);
        setTimeout(function(){
            div.remove();
        }, 7000)
    },
}

/* 用于处理socket数据包的方法对象 */
const packetMethod = {
    
    // 处理不用解压的arraybuffer数据包
    handlePacket: function (Packet) {

        // 创建一个数据视图
        const dv = new DataView(Packet);

        /* 1. 数据包的总长度， 包括头部（32bit） */
        const packetLen = dv.getUint32(0);
        
        /* 2. 数据包头部长度，固定为16（16bit） */
        const headerLen = dv.getUint16(4);
        
        /* 3. 协议版本 （16bit）
            version = 0, body中就是实际发送的数据
            version = 2, Body中是经过压缩后的数据，请使用zlib解压，然后按照Proto协议去解析
        */
        const version = dv.getUint16(6);
        
        /* 4. 消息的类型 （32bit）
            2: 客户端发送的心跳包(30秒发送一次),
            3: 服务器收到心跳包的回复,
            5: 服务器推送的弹幕消息包
            7: 客户端发送的鉴权包(客户端发送的第一个包)
            8: 服务器收到鉴权包后的回复
        */
        const operation = dv.getUint32(8);

        /* 5. 保留字段，可以忽略 */
        const sequenceId = dv.getUint32(12);

        /* 6. body消息体
            根据总长度和头部长度，提取消息体信息 
            客户端解析Body之前需要先解析Version字段 
        */
        let body = Packet.slice(headerLen, packetLen);

        if (version == 0) {
            // 协议版本号为 0 时，数据没有进行压缩
            if(operation == 5){

                // 消息体body格式转换  (bit->Byte->string->json)
                const jsonDanmu = JSON.parse(packetMethod.uintArrayToString(new Uint8Array(body)));
                // console.log(jsonDanmu);
                // 提取弹幕消息
                if(jsonDanmu.cmd == "DANMU_MSG"){
                    identifyDanmuCommand({
                        uid: jsonDanmu.info[2][0],
                        uname: jsonDanmu.info[2][1],
                        danmu: jsonDanmu.info[1],
                    });
                }
            }else{
                console.log("其他消息类型");
            }
        } else {
            // 协议版本号为 2 时，数据进行了压缩
            if (operation == 5) {
                try {
                    // 调用poke对数据包进行解压
                    packetMethod.handleUnzipPacket(pako.inflate(new Uint8Array(body)).buffer);
                } catch (err) {
                    console.log(err);
                }
            }
        }
        return packetLen;
    },

    // 处理解压后的arraybuffer数据包
    handleUnzipPacket: function (unzipBody) {
        /* zlib压缩后的body格式可能包含多个完整的数据包 */
        
        var len = 0, offect = 0;
        const maxLength = unzipBody.byteLength;
        
        while (offect < maxLength) {
            let body = unzipBody.slice(len, maxLength);
            // 层层递归解压
            let PacketLen = this.handlePacket(body);
            offect += PacketLen;
            len = PacketLen;
        }
    },

    // 字符串转为Uint8Array(Byte)
    stringToUintArray: function (str) {
        const uintArray = [];
        for (let i = 0; i < str.length; i++) {
            uintArray.push(str[i].charCodeAt(0));
        }
        return new Uint8Array(uintArray);
    },
    
    // Uint8Array(Byte)转为字符串
    uintArrayToString: function (uintArray) {
        return decodeURIComponent(escape(String.fromCodePoint.apply(null, uintArray)));
    },

    //用于合成心跳包和验证包 返回arraybuffer 16均为包头长度
    createPacket: function (packet, version, operation, sequenceId) {
        // 将字符串数据转为byte类型
        let packetUint8Array = packetMethod.stringToUintArray(packet);
        // 生成一个长度 = (数据+头部) 的缓存对象
        let buffer = new ArrayBuffer(packetUint8Array.byteLength + 16);
        let dv = new DataView(buffer);
        // 设置数据包的总长度，包括头部长度16
        dv.setUint32(0, packetUint8Array.byteLength + 16);
        // 设置头部长度 固定16
        dv.setUint16(4, 16);
        // 设置协议版本号
        dv.setUint16(6, parseInt(version, 10));
        // 设置消息类型
        dv.setUint32(8, parseInt(operation, 10));
        // 设置序列号 通常为1
        dv.setUint32(12, parseInt(sequenceId, 10));
        // 设置消息体部分
        for (let i = 0; i < packetUint8Array.byteLength; i++) {
            dv.setUint8(16 + i, packetUint8Array[i]);
        }
        return buffer;
    },
};

/* 用于处理设置方法 */
const configMethod = {
    // 添加用户历史记录
    addUserHistory: function(user){
        let existUser = false;
        // 检查历史用户中是否已经存在该用户
        for (let i = 0; i < player.userHistory.length; i++) {
            if(player.userHistory[i].uid == user.uid){
                existUser = true;
                break;
            }
        }
        if(!existUser){
            // 添加到播放器的用户历史记录中
            player.userHistory.push(user);
            // 同步页面的历史用户下拉框
            let userHistory = document.getElementById('userHistory');
            let op = document.createElement('option');
            op.value = user.uid;
            op.textContent = user.uname;
            userHistory.appendChild(op);
        }/* else{
            console.log("用户已存在历史用户记录中");
        } */
        
    },
    // 添加歌曲历史记录
    addSongHistory: function(song){
        let existSong = false;
        // 检查历史歌曲中是否已存在该歌曲
        for (let i = 0; i < player.songHistory.length; i++) {
            if(player.songHistory[i].sid == song.sid){
                existSong = true;
                break;
            }
        }
        if(!existSong){
            // 添加到播放器的歌曲历史记录中
            player.songHistory.push(song);
            // 同步页面的历史歌曲下拉框
            let songHistory = document.getElementById('songHistory');
            let op = document.createElement('option');
            op.value = song.sid;
            op.textContent = song.sname;
            songHistory.appendChild(op);
        }/* else{
            console.log("歌曲已存在歌曲历史记录中");
        } */
    },
    // 添加用户黑名单
    addUserBlackList: function(user){
        let existUser = false;
        // 检查用户黑名单是否已存在该用户
        for (let i = 0; i < config.userBlackList.length; i++) {
            if(config.userBlackList[i].uid == user.uid){
                existUser =  true;
                break;
            }
        }
        if(!existUser){
            // 如果黑名单人数大于50，则按队列结构出队（防止无限占用内存）
            if(config.userBlackList.length > 50){
                config.userBlackList.shift();
            }
            // 用户黑名单添加用户
            config.userBlackList.push(user);
            // 页面用户黑名单列表添加用户
            let userBlackList = document.getElementById('userBlackList');
            let op = document.createElement('option');
            op.value = user.uid;
            op.textContent = user.uname;
            userBlackList.appendChild(op);
        }else{
            musicMethod.pageAlert("用户已加入黑名单, 请勿重复添加!");
        }
    },
    // 添加歌曲黑名单 
    addSongBlackList: function(song){
        let existSong = false;
        // 检查歌曲黑名单是否已存在该歌曲
        for (let i = 0; i < config.songBlackList.length; i++) {
            if(config.songBlackList[i].sid == song.sid){
                existSong =  true;
                break;
            }
        }
        if(!existSong){
            // 如果歌曲黑名单大于50首，则按照队列结构出队（防止无限占用内存）
            if(config.songBlackList.length > 50){
                config.songBlackList.shift();
            }
            // 歌曲黑名单添加歌曲
            config.songBlackList.push(song);
            // 页面歌曲黑名单列表添加歌曲
            let songBlackList = document.getElementById('songBlackList');
            let op = document.createElement('option');
            op.value = song.sid;
            op.textContent = song.sname;
            songBlackList.appendChild(op);
        }else{
            musicMethod.pageAlert("歌曲已加入黑名单, 请勿重复添加!");
        }
    },
    // 加载空闲歌单
    loadSongList: async function(listId){
        if(listId){
            // 获取新的歌单
            let songList = await musicServer.getSongList(listId);
            if(songList.length > 0){
                player.freeList = songList;
                // 获取歌单成功后保存配置项
                config.listId = listId;
                localStorage.setItem("listId", config.listId);
                document.getElementById('songListId').value = listId;
                // 加载完成后自动播放下一首
                player.playNext();
                musicMethod.pageAlert("已获取空闲歌单列表!");
            }else{
                musicMethod.pageAlert("歌单列表获取失败!");
            }
        }else{
            musicMethod.pageAlert("歌单Id无效!");
        }
    }
}


