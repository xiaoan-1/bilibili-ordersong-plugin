import musicPlayer from "./music-player.js";
import publicMethod from "../utils/public-method.js";
import musicServer from "../services/musicServers/music-server.js";
import danmuServer from "../services/danmuServers/danmu-server.js";

/* 在此处启动弹幕服务 */
class DanmuConfiger {

    // 管理员ID
    adminId = 0;

    // 平台切换下拉框
    elem_danmuPlatformSelect = document.getElementById("danmuPlatformSelect");

    // 重连/切换按钮
    elem_danmuPlatformButton = document.getElementById("danmuPlatformButton");

    constructor() {
        // 监听弹幕平台切换
        this.elem_danmuPlatformButton.onclick = async (e) => {
            const platform = this.elem_danmuPlatformSelect.value;
            const isChanged = danmuServer.changePlatform(platform);
            if (isChanged) {
                await this.startDanmu();
            } else {
                publicMethod.pageAlert("弹幕平台切换/重连失败！");
            }
        }

        console.log("弹幕配置初始化完毕");

    }

    // 启动弹幕链接
    async startDanmu() {
        // 连接弹幕服务器
        await danmuServer.serverObj.connect();
        // 获取管理员ID
        this.adminId = danmuServer.serverObj.uid;
        // 实现弹幕消息回调函数
        danmuServer.serverObj.danmuMessage = this.identifyDanmuCommand.bind(this);
    }


    /*  识别弹幕命令, 触发点歌流程
        @param: userDanmu 包括用户id、用户名、用户弹幕
    */
    async identifyDanmuCommand(userDanmu) {
        let danmuMsg = userDanmu.danmu.trim();

        // 点歌命令触发
        if (danmuMsg.slice(0, 2) == "点歌") {
            let keyword = danmuMsg.slice(2).trim();
            let platform = keyword.slice(0, 2);
            if (musicServer.platformList.includes(platform)) {
                // 如果存在平台信息，关键字剔除平台信息
                keyword = danmuMsg.slice(4).trim();
            }

            // 根据平台通过API查询歌曲信息
            let song = await musicServer.getServer(platform).getSongInfo(keyword);
            if (!song) {
                publicMethod.pageAlert("没找到<(▰˘◡˘▰)>");
                return;
            }
            // 封装点歌信息
            const order = {
                uid: userDanmu.uid,
                uname: userDanmu.uname,
                song: song
            }

            // 添加点歌信息到点歌列表  
            musicPlayer.addOrder(order);

            if(musicPlayer.orderList[0].song.sid == order.song.sid){
                // 如果没有点歌，则直接播放该歌曲
                musicPlayer.play(order.song);
            }else if (musicPlayer.orderList.length > 0 && musicPlayer.orderList[0].uid == 0) {
                // 如果当前点歌列表第一首是空闲歌单，则播放下一首
                musicPlayer.playNext();
            }

        } else if (danmuMsg == "切歌") {

            // 是否为空闲歌单歌曲
            const isOwner = musicPlayer.orderList[0].uid == 0;
            // 是否为管理员
            const isAdmin = userDanmu.uid == this.adminId;
            // 是否为用户自己的歌曲
            const isFree = musicPlayer.orderList[0].uid == userDanmu.uid;

            if (isOwner || isAdmin || isFree) {
                // 如果当前播放的是空闲歌单、用户歌曲，或者发送命令的是管理员，则播放下一首歌曲
                musicPlayer.playNext();
            } else {
                publicMethod.pageAlert("不能切别人点的歌哦(^o^)");
            }
        } else if (danmuMsg == "暂停") {
            if (userDanmu.uid == this.adminId) {
                musicPlayer.audio.pause();
            } else {
                publicMethod.pageAlert("您没有改权限进行该操作~");
            }
        } else if (danmuMsg == "播放") {
            if (userDanmu.uid == this.adminId) {
                musicPlayer.audio.play();
            } else {
                publicMethod.pageAlert("您没有改权限进行该操作~");
            }
        }
    }
}

export default new DanmuConfiger();