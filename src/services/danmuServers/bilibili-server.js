import publicMethod from "../../utils/public-method.js";

export default class BilibiliServer {

    // API基础地址
    baseUrl = window.API_CONFIG.bili_api_url;

    // socket连接地址
    socketUrl = "";

    // webSoket对象
    webSocket = null;

    // 项目ID
    appId = 1711708120386;

    // 直播间ID
    roomId = 0;

    // 游戏场次Id
    gameId = 0;

    // 主播ID
    uid = 0;

    // 主播身份码
    anchorCode = "";

    // 发送心跳包的定时器
    timer = null;

    // 鉴权包
    authPacket = null;

    // 心跳包
    heartPacket = null;

    // 重连次数
    reconnectCount = 3;

    // 解码器
    textDecoder = new TextDecoder();

    // 弹幕消息
    danmuMessage = null;

    // 连接弹幕服务
    async connect() {
        // 获取URL中的身份码参数
        let URLParam = window.location.search.substring(1).split('&');
        URLParam.forEach(str => {
            let param = str.split('=');
            console.log(param);
            if (param.length == 2 && param[0].toLocaleUpperCase() == "CODE") {
                this.anchorCode = param[1];
            }
        });
        if (this.anchorCode == "") {
            publicMethod.pageAlertRepeat("无身份码, 请检查网址参数...");
            return false;
        }

        // 获取弹幕服务器连接信息
        const gameInfo = await this.getGameInfo(this.anchorCode, this.appId);
        if (!gameInfo) {
            publicMethod.pageAlertRepeat("弹幕连接信息获取失败!");
            return;
        }

        // 设置连接参数
        this.uid = gameInfo.game_info.open_id;
        this.gameId = gameInfo.game_info.game_id;
        this.roomId = gameInfo.anchor_info.room_id;
        this.socketUrl = gameInfo.websocket_info.wss_link[2];

        // 设置鉴权包
        this.authPacket = this.createPacket(gameInfo.websocket_info.auth_body, 1, 7, 1);;
        // 设置心跳包 
        this.heartPacket = this.createPacket("[object Object]", 1, 2, 1);

        // 初始化socket连接
        try {
            this.webSocket = new WebSocket(this.socketUrl);
        } catch (error) {
            console.log(error);
            publicMethod.pageAlertRepeat("弹幕链接创建失败!");
            return false;
        }

        // 初始化完毕，打开弹幕连接
        this.openSocket();
        return true;
    }

    // 获取项目信息
    async getGameInfo() {
        // 请求项目信息
        let gameInfo = null;
        await axios({
            method: "post",
            url: this.baseUrl + "/gameStart",
            data: {
                code: this.anchorCode,
                app_id: this.appId
            }
        }).then(function (resp) {
            gameInfo = resp.data.data;
            console.log(resp.data);
        }).catch(function (error) {
            console.log("获取弹幕信息失败!", error);
        });
        return gameInfo;
    }

    // 项目心跳，需要20s请求一次
    async gameHeartbeat() {
        await axios({
            method: "post",
            url: this.baseUrl + "/gameHeartBeat",
            data: {
                game_id: this.gameId
            }
        }).then(function (resp) {
            if (resp.data.code == 0) {
                console.log("项目心跳成功!");
            } else {
                console.log(resp.data);
            }
        }).catch(function (error) {
            console.log("项目心跳失败!", error.message);
        });
    }

    // 打开websocket连接 
    openSocket() {
        // 1. 连接打开事件
        this.webSocket.onopen = () => {

            // 发送心跳包和鉴权包 
            this.webSocket.send(this.authPacket);
            this.webSocket.send(this.heartPacket);

            //发送心跳包 每20s发送一次
            this.timer = setInterval(() => {
                // 项目心跳
                this.gameHeartbeat(this.gameId);
                // ws心跳包
                this.webSocket.send(this.heartPacket);
                console.log("websocket心跳包");
            }, 20000);

            publicMethod.pageAlert("弹幕服务器连接已打开!");
        };


        // 2. 获得消息事件
        this.webSocket.onmessage = (msg) => {
            // 接收弹幕消息，开始处理前端触发逻辑
            var reader = new FileReader();

            //读取blob对象（二进制流）为arraybuffer（二进制数组）
            reader.readAsArrayBuffer(msg.data);

            // 读取完毕后， 处理服务端数据
            reader.onload = () => {
                this.handlePacket(reader.result);
            };
        };

        // 3. 连接关闭事件 => 重连
        this.webSocket.onclose = () => this.reconnect;

        // 4. 连接错误事件 => 重连
        this.webSocket.onerror = () => this.reconnect;
    }

    // 重连
    reconnect() {
        if (this.reconnect) {
            publicMethod.pageAlert("连接错误，正在重连...");
            this.reconnect--;
            setTimeout(this.connect, 3000);
        } else {
            publicMethod.pageAlertRepeat("重连失败,请确认网络并刷新页面!");
        }
    }

    // 处理不用解压的arraybuffer数据包
    handlePacket(Packet) {
        // 创建一个数据视图
        const dv = new DataView(Packet);

        /* 数据包的总长度，包括头部（32bit） */
        const packetLen = dv.getUint32(0);

        /* 数据包头部长度，固定为16（16bit） */
        const headerLen = dv.getUint16(4);

        /* 协议版本 (16bit）
            version = 0, body中就是实际发送的数据
            version = 2, Body中是经过压缩后的数据，请使用zlib解压，然后按照Proto协议去解析
        */
        const version = dv.getUint16(6);

        /* 消息的类型 （32bit）
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

        if (operation != 5) {
            // 非弹幕信息
            return;
        }
        // 弹幕消息
        if (version == 0) {
            // 协议版本号为 0 时，数据没有进行压缩
            // 消息体body格式转换 (Byte -> string -> json)
            const jsonDanmu = JSON.parse(this.textDecoder.decode(new Uint8Array(body)));
            // 提取弹幕消息
            if (jsonDanmu.cmd == "LIVE_OPEN_PLATFORM_DM" && this.danmuMessage) {
                console.log(jsonDanmu);
                this.danmuMessage({
                    uid: jsonDanmu.data.open_id,
                    uname: jsonDanmu.data.uname,
                    danmu: jsonDanmu.data.msg,
                });
            }
        } else if (version == 2) {
            // 协议版本号为 2 时，数据进行了压缩
            try {
                // 调用poke对数据包进行解压
                this.handleUnzipPacket(pako.inflate(new Uint8Array(body)).buffer);
            } catch (err) {
                console.log(err);
            }
        }
        return packetLen;
    }

    // 处理解压后的arraybuffer数据包
    handleUnzipPacket(unzipBody) {
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
    }

    // 用于合成心跳包和验证包 返回arraybuffer 16均为包头长度
    createPacket(packet, version, operation, sequenceId) {
        // 编码器
        const textEncoder = new TextEncoder();
        // 将字符串数据转为byte类型
        let packetUint8Array = textEncoder.encode(packet);
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
    }
}