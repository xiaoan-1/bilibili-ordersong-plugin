import {axios} from "../../../libraries/axios.min.js"
import { musicMethod } from "../public/method.js";

export const server = {

    baseUrl: "http://plugin.changsheng.space:3100",
    
    /* 项目启动APi
        @param code [主播身份码]
        @param app_id 项目ID
    */
    gameStart: async function(code, app_id){
        let gameInfo = null;
        await axios({
            method: "post",
            url: this.baseUrl +"/gameStart",
            data: {
                code: code,
                app_id: app_id
            }
        }).then(function (resp) {
            if(resp.data.code == 0){  
                gameInfo = resp.data.data;
            }else{
                console.log(resp.data);
                musicMethod.pageAlert(resp.data.message);
            }
        }).catch(function(error){
            console.log(error);
            musicMethod.pageAlert("项目启动失败!");
        });
        return gameInfo;
    },

    /* 项目心跳，需要20s请求一次
        @param  game_id 游戏场次ID
    */
    gameHeartbeat: async function(game_id){
        await axios({
            method: "post",
            url: this.baseUrl + "/gameHeartBeat",
            data: {
                game_id: game_id
            }
        }).then(function (resp) {
            if(resp.data.code == 0){  
                console.log("项目心跳成功!");
            }else{
                console.log(resp.data);
                musicMethod.pageAlert("项目心跳失败!", resp.data.message);
            }
        }).catch(function(error){
            console.log("项目心跳失败!", error.message);
        });
    },
}