import { websocket as bilibili } from "./bilibili/websoket.js";


/* 在此处启动弹幕服务 */
export const danmuServer = {

    getPlatform: function(platform){
        if(platform == "bilibili"){
            return bilibili;
        }else{
            return bilibili;
        }
    }
}