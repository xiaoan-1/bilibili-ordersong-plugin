import { player } from "./player.js";
import { publicMethod } from "../utils/method.js";
import { musicServer } from "../servers/musicServers/musicServer.js";
import { danmuServer } from "../servers/danmuServers/danmuServer.js"
 
/* 在此处启动弹幕服务 */
export const danmu = {

    // 主播UID
    adminId: "",

    // 弹幕平台(bilibili)
    danmuPlatform: "bilibili",

    // 弹幕服务
    dServer: danmuServer.getPlatform("bilibili"),

    // 启动弹幕服务
    init: async function(){

        // 读取配置文件
        publicMethod.readConfig(this);

        // 设置弹幕服务对象
        this.dServer = danmuServer.getPlatform(this.danmuPlatform);
        
        // *初始化弹幕服务器
        await this.dServer.init();
        
        this.adminId =  this.dServer.uid;
        this.dServer.danmuMessage = this.identifyDanmuCommand;
    },

    /*  识别弹幕命令
        @param: danmu 包括用户id、用户名、用户弹幕
    */
    identifyDanmuCommand: async function(userDanmu){
        let danmuMsg = userDanmu.danmu.trim();

        // 点歌命令触发
        let order = null;
        if (danmuMsg.slice(0, 2) == "点歌") {
            // 获取点歌关键词
            let keyword = danmuMsg.slice(2).trim();
            let platform = keyword.slice(0, 2); 
            // 根据平台通过API查询歌曲信息
            let song = await musicServer.getPlatform(danmuPlatform).getSongInfo(keyword);
            
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

        }else if (danmuMsg == "切歌") { 
            // 切歌命令，触发切歌流程
            if(player.orderList[0].uid == 0 || player.orderList[0].uid == userDanmu.uid || userDanmu.uid == this.adminId){
                // 如果当前播放的是空闲歌单、用户歌曲，或者发送命令的是管理员，则播放下一首歌曲
                player.playNext();
            }else{
                publicMethod.pageAlert("不能切别人点的歌哦(^o^)");
            }
        }else if(danmuMsg == "暂停"){
            if(userDanmu.uid == this.adminId){
                player.audio.pause();
            }else{
                publicMethod.pageAlert("您没有改权限进行该操作~");
            }
        }else if(danmuMsg == "播放"){
            if(userDanmu.uid == this.adminId){
                player.audio.play();
            }else{
                publicMethod.pageAlert("您没有改权限进行该操作~");
            }
        }
    }
}