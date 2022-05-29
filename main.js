/* 默认全局配置信息 */
var config = {
    
    // 用户点歌数量限制
    userOrder: 3,
    
    // 最大点歌数限制
    maxOrder: 10,
    
    // 空闲歌单信息
    songListId: 7319049505, 
    
    // 用户黑名单
    userBlackList: [352905327, 0],
    
    // 歌曲黑名单
    songBlackList: [],
}

/* 播放器对象 */
const player = {
    
    //  音频对象
    audio: null,
    
    // 页面元素
    elem: null,

    // 用户点歌列表
    orderList: null,

    // 空闲歌单列表 
    freeList: null,

    // 空闲歌单列表的播放索引
    freeIndex: 0, 
}

// webSocket对象
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

window.onload = function(){
    // 1. 初始化播放器
    initPlayer();
    
    // 2. 加载全局配置
    loadGlobalConfig();
    
    // 3. 初始化webSocket对象
    let initSuccess = initSocket();
    
    // 4. 若初始化成功,打开websoket连接直播间
    /*if(initSuccess){
        openWebSocket();
    }  */
}

/* 初始化播放器对象 */
function initPlayer(){
    // 创建音频对象
    player.audio = new Audio();  
    // 绑定页面元素
    player.elem = document.getElementById('songList');
    // 初始化点歌列表
    player.orderList = new Array();
    // 初始化空闲歌单列表
    player.freeList = new Array(); 


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
            // 点歌列表没有歌曲时，则播放空闲歌单的歌曲
            if(this.freeList.length > 0){
                if(this.freeIndex >= this.freeList.length){
                    this.freeIndex = 0;
                }
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

    // 添加 监听播放器播放结束事件
    player.audio.addEventListener("ended", function(){  
        // 播放下一首歌曲
        player.playNext();
    });
    console.log("已初始化播放器!");
    musicMethod.pageAlert("已初始化播放器!");
}

/* 加载全局配置 */
async function loadGlobalConfig(){
    // 在本地存储中获取配置项
    if(localStorage.getItem("config")){
        config = extendCopy(JSON.parse(localStorage.getItem("config")));
    }
    // 根据配置中的歌单号，获取空闲歌单列表
    if(config.songListId){
        let songList = await musicServer.getSongList(config.songListId);
        if(songList.length > 0){
            player.freeList = songList;
            player.playNext();
            console.log("已获取空闲歌单列表!");
        }else{
            console.log("歌单列表获取失败!");
        }
    }
    console.log("已加载全局配置!");
    musicMethod.pageAlert("已加载全局配置!");
}

/* 初始化socket对象 */
function initSocket(){
    // 检查浏览器是否支持webSocket 
    if (typeof (WebSocket) == "undefined") {
        musicMethod.pageAlert("您的浏览器不支持WebSocket！");
        return false;
    } 

    // 设置连接url
    webSocket.url = "wss://broadcastlv.chat.bilibili.com:2245/sub";

    // 设置房间id
    webSocket.roomId = 22811879;
    /* let URLParam = window.location.search.substring(1).split('&');
    URLParam.forEach(str => {
        let param = str.split('=');
        if(param.length == 2 && param[0].toLocaleUpperCase() == "ROOMID"){
            webSocket.roomId = parseInt(param[1]);
            musicMethod.pageAlert("直播间ID =" + webSocket.roomId);
        }
    }); */

    if(!webSocket.roomId){
        musicMethod.pageAlert("未获取到直播间ID");
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

    console.log("已初始化webSocket连接!");
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
        // 错误信息
        console.log(error);
        return false;
    }

    // 1. 连接打开事件
    socket.onopen = function () {
        console.log("弹幕服务器连接已打开");
        musicMethod.pageAlert("弹幕服务器连接已打开");
        // 发送连接信息 
        socket.send(webSocket.authPacket);
        socket.send(webSocket.heartPacket);

        //发送心跳包
        let timer = setInterval(function () {
            socket.send(webSocket.heartPacket);
        }, 30000);

        // 设置webSocke
        webSocket.socket = socket;
        webSocket.timer = timer;
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
        console.log("弹幕服务器连接已关闭!");
    };

    // 4. 连接错误事件
    socket.onerror = function () {
        musicMethod.pageAlert("连接到弹幕服务器发生了错误!")
        console.log("连接到弹幕服务器发生了错误!");
    }
}



/*  识别弹幕命令
    @param: userDanmu 包括用户id、用户名、用户弹幕
*/
async function identifyDanmuCommand(userDanmu){
    let danmu = userDanmu.danmu.trim().toLocaleUpperCase();
    // 点歌命令，触发点歌流程
    if (danmu.length >= 4 && danmu.slice(0, 2) == "点歌" && musicMethod.checkUser(userDanmu.uid)) {
        // 1. 提取歌名、歌手
        let songName = musicMethod.getSongName(danmu);
        let songArtist = musicMethod.getSongArtist(danmu);
        // 2. 通过API查询歌曲信息（歌曲id、歌名、歌手）   
        let song = await musicServer.getSongInfo(songName, songArtist);  
        if(song){
            // 3. 封装点歌信息
            let order = {
                uid: userDanmu.uid,
                uname: userDanmu.uname,
                song: song
            }
            // 4. 添加点歌信息到点歌列表
            if(await musicMethod.checkOrder(order)){   
                player.addOrder(order);
                // 如果当前点歌列表第一首是空闲歌单，则播放下一首
                if(player.orderList.length > 0 && player.orderList[0].uname == "空闲歌单"){
                    musicMethod.pageAlert("让我看看~这是哪位帅哥美女点的歌(｀・ω・´)");
                    player.playNext();
                }
            }            
            // 5. 如果当前播放没有播放歌曲，则开始播放第一首歌
            if(player.audio.paused && player.orderList.length > 0){
                player.play(player.orderList[0].song.sid);
            }
        }else{
            musicMethod.pageAlert("挺好听的，虽然我没找到<(▰˘◡˘▰)>");
        }      
    } else if (danmu == "切歌") { 
        // 切歌命令，触发切歌流程
        if(player.orderList[0].uid == userDanmu.uid){
            // 播放下一首歌曲
            player.playNext();
        }else{
            musicMethod.pageAlert("不能切别人点的歌哦(^o^)");
        }
        
    }
}



/* 歌曲API服务 */
var musicServer = {
    /* 搜索歌曲信息 
        @param songName 歌名
        @param songAurhor 歌手
    */
    getSongInfo: async function(songName, songArtist){
        let song = null;
        await axios({
            method: "get",
            url: "http://music.eleuu.com/search?keywords=" + songName + " &limit=10&type=1"
        }).then(function (resp) {
            // 获取歌曲列表
            let songs = resp.data.result.songs;
            let nameIndex = -1, artistIndex = -1;
            // 查询歌名匹配的歌曲下标
            for(let i = 0; i < songs.length; i++){
                if(musicMethod.formatSongName(songs[i].name) == songName){
                    nameIndex = i;
                    if(songArtist){
                        // 若存在歌手要求、则查询歌手匹配的歌曲下标
                        for(let j = 0; j < songs[i].artists.length; j++){
                            if(musicMethod.formatSongName(songs[i].artists[j].name) == songArtist){
                                artistIndex = j;
                                break;
                            }
                        }
                    }else{
                        // 若无歌手要求，则默认匹配歌名的歌曲第一个歌手
                        artistIndex = 0;
                        break;
                    }
                    if(artistIndex >= 0){
                        break;
                    }
                }
            }
            // 如果歌名和歌手索引均存在，则证明查询成功
            if(nameIndex >= 0 && artistIndex >= 0){
                song = musicMethod.getSongObject({
                    sid: songs[nameIndex].id,
                    sname: songs[nameIndex].name,
                    sartist: songs[nameIndex].artists[artistIndex].name
                })
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
            url: "http://music.eleuu.com/song/url?id=" + songId
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
            url: "http://plugin.changsheng.space:3000/playlist/track/all?id=" + listId
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
        return songList
    }
}

/* 用于处理歌曲信息的方法函数 */
const musicMethod = {
    // 获取歌名
    getSongName: function (value) {
        let i, j, start = 0, end = 0;
        for(i = 2; i < value.length; i++){
            if(value[i] != ' ' && value[i] != '-' && value[i] != '/'){
                start = i;                
                break;
            }
        }
        for (j = start; j < value.length; j++) {
            if (value[j] == " " || value[j] == "-" || value[j] == "/" ) {
                end = j;
                break;
            }
        }
        if(j == value.length){
            end = j;
        }

        if (start > 2 && end > start) {
            return value.slice(start, end);
        } else {
            return null;
        }
    }, 
    // 获取歌手
    getSongArtist: function (value) {
        let i, j, start = 0, end = 0;
        for(i = 2; i < value.length; i++){
            if(value[i] != " " && value[i] != "-" && value[i] != "/"){
                start = i;
                break;
            }
        }
        for (j = start; j < value.length; j++) {
            if (value[j] == " " || value[j] == "-" || value[j] == "/") {
                end = j;
                break;
            }
        }
        if(j == value.length){
            return null;
        }else{
            for(i = end; i < value.length; i++){
                if(value[i] != " " && value[i] != "-" && value[i] != "/"){
                    start = i;
                    break;
                }
            }
            for (j = start; j < value.length; j++) {
                if (value[j] == " " || value[j] == "-" || value[j] == "/") {
                    end = j;
                    break;
                }
            }
            if(j == value.length){
                end = j;
            }
            if (start > 4 && end > start) {
                return value.slice(start, end);
            } else {
                return null;
            }
        }
    },
    // 格式化歌名，转大写+去空格
    formatSongName : function(songName){
        let pos = songName.indexOf('(');
        songName = songName.toLocaleUpperCase().replace(/\s+/g, "");;
        return pos >= 0 ? songName.slice(0, pos) : songName;
    },
    // 设置仅可访问的歌曲对象
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
            }
        })
        return object;
    },
    // 验证点歌用户信息
    checkUser: function(uid){
        if(config.userBlackList.indexOf(uid) >= 0){
            // 用户是否被拉入黑名单
            this.pageAlert("你已被加入暗杀名单!(▼へ▼メ)!");
            return false;
        }else if(player.orderList.filter(value => value.uid == uid).length >= config.userOrder){
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
        if(config.songBlackList.indexOf(order.song.sid) >= 0){
            // 该歌曲是否已被加入黑名单
            this.pageAlert("不要乱点奇怪的歌!(▼ヘ▼#)");
            return false;
        }else if(player.orderList.some(value => value.song.sid == order.song.sid)){
            // 该歌曲是否已在点歌列表
            this.pageAlert("已经点上啦!>_<!");
            return false;
        }else if(!await musicServer.getSongUrl(order.song.sid)){
            // 检查是否可获取歌曲链接
            this.pageAlert("虽然找到了,但是我放不出来>_<");
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
        }, 5000)
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



