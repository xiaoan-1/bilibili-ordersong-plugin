import { player } from "../../components/player.js";
import { publicMethod } from "../../utils/method.js";
import { musicServer } from "../musicServers/musicServer.js";
import { bilibili } from "./bilibili/websoket.js";


/* 在此处启动弹幕服务 */
export const danmuServer = {

    // 启动弹幕服务
    start: function(danmu_platform){
        if(danmu_platform == "bilibili"){
            bilibili.danmuMessage = this.identifyDanmuCommand;
            bilibili.init();
        }else{
            publicMethod.pageAlert("暂不支持该平台的弹幕服务!");
        }
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
            let song = musicServer.getSongInfo(keyword);
            
            if(!song){
                publicMethod.pageAlert("挺好听的，虽然我没找到<(▰˘◡˘▰)>");
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
            if(player.orderList[0].uid == userDanmu.uid || userDanmu.uid == danmuServer_bilibili.uid){
                // 如果当前播放的是该用户的歌曲，或者发送命令的是管理员，则播放下一首歌曲
                player.playNext();
            }else{
                publicMethod.pageAlert("不能切别人点的歌哦(^o^)");
            }
        }else if(danmu == "暂停"){
            if(userDanmu.uid == danmuServer_bilibili.adminId){
                player.audio.pause();
            }else{
                publicMethod.pageAlert("您没有改权限进行该操作~");
            }
        }else if(danmu == "播放"){
            if(userDanmu.uid == danmuServer_bilibili.adminId){
                player.audio.play();
            }else{
                publicMethod.pageAlert("您没有改权限进行该操作~");
            }
        }
    }
}