import { server } from "./server.js";
import { publicMethod } from "../../../utils/method.js";

/* webSocket对象 */
export const websocket = {
    // socket连接地址
    url: "",

    // webSoket对象
    socket: null,
    
    // 直播间ID
    roomId: 0,
    
    // 游戏场次Id
    gameId: 0,

    // 主播ID
    uid: 0,
    
    // 主播身份码
    anchorCode: "",

    // 发送心跳包的定时器
    timer: null,

    // 鉴权包
    authPacket: null,

    // 心跳包
    heartPacket: null,

    // 重连次数
    reconnectCount: 3,

    // 弹幕消息
    danmuMessage: null,
    
    // 初始化websocket链接
    init: async function(){
        // 检查浏览器是否支持webSocket 
        if (typeof (WebSocket) == "undefined") {
            publicMethod.pageAlert("您的浏览器不支持WebSocket!");
            return false;
        } 

        // 获取URL中的身份码参数
        let URLParam = window.location.search.substring(1).split('&');
        URLParam.forEach(str => {
            let param = str.split('=');
            console.log(param);
            if(param.length == 2 && param[0].toLocaleUpperCase() == "CODE"){
                this.anchorCode = param[1];
            }
        });

        if(this.anchorCode == ""){
            publicMethod.pageAlertRepeat("无身份码, 请检查url参数...");
            return;
        }

        // 项目启动获取连接信息
        let gameInfo = await server.gameStart(this.anchorCode, 1711708120386);

        if(!gameInfo){
            publicMethod.pageAlertRepeat("弹幕连接信息获取失败!");
            return;
        }
        
        // 获取连接信息
        this.url = gameInfo.websocket_info.wss_link[2];
        this.roomId = gameInfo.anchor_info.room_id;
        this.gameId = gameInfo.game_info.game_id;
        this.uid = gameInfo.game_info.open_id;

        // 设置鉴权包
        this.authPacket = this.createPacket(gameInfo.websocket_info.auth_body, 1, 7, 1);;
        // 设置心跳包 
        this.heartPacket = this.createPacket("[object Object]", 1, 2, 1);

        // 检查是否已存在socket连接
        if(this.socket != null){
            this.socket.close();
            delete this.socket;
            this.socket = null;
        }

        // 初始化定时器
        if(this.timer != null){
            clearInterval(this.timer);
            this.timer = null;
        }

        // 初始化socket连接
        try {
            this.socket = new WebSocket(this.url);
        } catch (error) {
            console.log(error);
            publicMethod.pageAlertRepeat("websocket创建失败!");
            return false;
        }

        // 初始化完毕，打开弹幕连接
        this.open();
    },

    // 打开websocket连接 
    open: function(){
        // 1. 连接打开事件
        this.socket.onopen = ()=> {
            
            // 发送心跳包和鉴权包 
            this.socket.send(this.authPacket);
            this.socket.send(this.heartPacket);

            //发送心跳包 每20s发送一次
            this.timer = setInterval(() => {
                // 项目心跳
                server.gameHeartbeat(this.gameId);
                // ws心跳包
                this.socket.send(this.heartPacket);
                console.log("心跳包");
            }, 20000);

            publicMethod.pageAlert("弹幕服务器连接已打开!");
        };

        // 2. 获得消息事件
        this.socket.onmessage = (msg) => {
            // 接收弹幕消息，开始处理前端触发逻辑
            var reader = new FileReader();

            //读取blob对象（二进制流）为arraybuffer（二进制数组）
            reader.readAsArrayBuffer(msg.data);

            // 读取完毕后， 处理服务端数据
            reader.onload = ()=> {
                this.handlePacket(reader.result); 
            };
        };

        // 3. 连接关闭事件 => 重连
        this.socket.onclose = () => this.reconnect;

        // 4. 连接错误事件 => 重连
        this.socket.onerror = () => this.reconnect;
    },

    // 重连
    reconnect: function() {
        if( this.reconnect ){
            publicMethod.pageAlert("连接错误，正在重连..." + this.reconnect );
            this.reconnect--;
            setTimeout(this.init, 3000);
        }else{
            publicMethod.pageAlertRepeat("重连失败! 请确认网络/服务器状态!");
        }
    },

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
                const jsonDanmu = JSON.parse(this.uintArrayToString(new Uint8Array(body)));
                // 提取弹幕消息
                if(jsonDanmu.cmd == "LIVE_OPEN_PLATFORM_DM" && this.danmuMessage){
                    console.log(jsonDanmu);
                    this.danmuMessage({
                        uid: jsonDanmu.data.open_id,
                        uname: jsonDanmu.data.uname,
                        danmu: jsonDanmu.data.msg,
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
                    this.handleUnzipPacket(pako.inflate(new Uint8Array(body)).buffer);
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
        let packetUint8Array = this.stringToUintArray(packet);
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
}
