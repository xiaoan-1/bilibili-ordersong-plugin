import { player } from "../components/player.js";
import { musicMethod } from "../components/public/method.js";
import { wymusicServer } from "../servers/musicServers/wymusicServer.js";
import { qqmusicServer } from "../servers/musicServers/qqmusicServer.js";
import { danmuServer_bilibili } from "../servers/danmuServers/bilibili/websoket.js";

/* 在此处启动弹幕服务 */
export const danmuServer = {

    // 启动弹幕服务
    start: function(){
        danmuServer_bilibili.getDanmuMessage = this.identifyDanmuCommand;
        danmuServer_bilibili.init();
    },

    /*  识别弹幕命令
        @param: danmu 包括用户id、用户名、用户弹幕
    */
    identifyDanmuCommand: async function(danmu){
        let danmu = userDanmu.danmu.trim();

        // 点歌命令触发
        let order = null;
        if (danmu.slice(0, 2) == "点歌") {
            // 获取点歌关键词
            let keyword = danmu.slice(2).trim();
            // 根据平台通过API查询歌曲信息
            let song = null;
            switch(keyword.slice(0, 2)){
                case "wy":
                    song = await wymusicServer.getSongInfo(keyword);
                    break;
                case "qq":
                    song = await qqmusicServer.getSongInfo(keyword);
                    break;
                default: 
                    song = await wymusicServer.getSongInfo(keyword);
                    break;
            }
            if(!song){
                musicMethod.pageAlert("挺好听的，虽然我没找到<(▰˘◡˘▰)>");
                return;
            }
            // 封装点歌信息
            order = {
                uid: userDanmu.uid,
                uname: userDanmu.uname,
                song: song
            }

            // 添加点歌信息到点歌列表  
            player.addOrder(order);
            
            // 如果当前点歌列表第一首是空闲歌单，则播放下一首
            if(player.orderList.length > 0 && player.orderList[0].uname == "空闲歌单"){
                player.playNext();
            }

        }else if (danmu == "切歌") { 
            // 切歌命令，触发切歌流程
            if(player.orderList[0].uid == userDanmu.uid || userDanmu.uid == config.adminId){
                // 如果当前播放的是该用户的歌曲，或者发送命令的是管理员，则播放下一首歌曲
                player.playNext();
            }else{
                musicMethod.pageAlert("不能切别人点的歌哦(^o^)");
            }
        }
    }
}