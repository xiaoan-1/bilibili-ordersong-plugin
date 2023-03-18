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

    // 是否正在重连、重连次数
    flag: false,
    reconnect: 3,

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

    // 设置重连

    musicMethod.pageAlert("已初始化webSocket连接!");
    return true;
}

/* 打开websocket连接 */ 
function openWebSocket(){
    // 检查是否已存在socket连接
    if(webSocket.socket != null){
        webSocket.socket.close();
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
        if(!webSocket.flag)
        {
            webSocket.flag = true;
            if(webSocket.reconnect )
            {
                musicMethod.pageAlert("连接已关闭，正在重连..." + webSocket.reconnect );
                openWebSocket();
                webSocket.reconnect--;
            }
            else
            {
                setInterval(function(){
                    musicMethod.pageAlert("重连失败! 连接已关闭!");
                }, 7000);
            }
            webSocket.flag = false;
        }else{
            return;
        }
    };

    // 4. 连接错误事件
    socket.onerror = function () {
        // 停止发送心跳包
        clearInterval(webSocket.timer);
        if(!webSocket.flag)
        {
            webSocket.flag = true;
            if(webSocket.reconnect )
            {
                musicMethod.pageAlert("服务器发生错误，正在重连..." + webSocket.reconnect );
                openWebSocket();
                webSocket.reconnect--;
            }
            else
            {
                setInterval(function(){
                    musicMethod.pageAlert("重连失败! 连接已关闭!");
                }, 7000);
            }
            webSocket.flag = false;
        }else{
            return;
        }
    }
}

/* 用于处理socket数据包的函数 */
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