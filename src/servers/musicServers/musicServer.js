import { publicMethod } from "../../utils/method.js";
import { qqmusicServer } from "./qqmusicServer.js";
import { wymusicServer } from "./wymusicServer.js";

export const musicServer = {

    // 默认平台
    platform: "wy",

    // 平台cookie
    cookies: [{"wy": ""},{"qq": ""}],

    // 初始化
    init: function(){
        publicMethod.readConfig(this);

        // 加载cookie数据
        for (let i = 0; i < this.cookies.length; i++) {
            const ck = this.cookies[i];
            if(ck.hasOwnProperty("wy")){
                wymusicServer.cookie = ck["wy"];
            }else if(ck.hasOwnProperty("qq")){
                qqmusicServer.cookie = ck["qq"];
            }
        }
    },

    // 获取登录状态
    getLoginStatus: async function(){
        if(this.platform == "wy"){
            return await wymusicServer.loginStatus();
        }else{
            publicMethod.pageAlert("该平台暂不支持获取歌单");
        }
    },

    updateQrPicture: async function(qrImg){
        if(this.platform == "wy"){
            // 先获取二维码的key
            let unikey = await wymusicServer.getQrKey();
            // 用二维码key获取二维码图片地址
            let url = await wymusicServer.getQrPicture(unikey);
            // 显示二维码
            qrImg.setAttribute("src", url);

            return unikey;

        }else if(this.platform == "qq"){
            publicMethod.pageAlert("暂不支持该平台二维码登录");
            return null;
        }
    },

    checkQrStatus: async function(unikey){
        if(this.platform == "wy"){
            return await wymusicServer.checkQrStatus(unikey);
        }else if(this.platform == "qq"){
            publicMethod.pageAlert("暂不支持该平台获取cookie");
        }
    },

    // 获取歌单列表
    getSongList: async function(listId){
        if(this.platform == "wy"){
            return wymusicServer.getSongList(listId);
        }else{
            publicMethod.pageAlert("该平台暂不支持获取歌单");
        }
        return null;
    },

    // 获取歌曲信息
    getSongInfo: async function(keyword){
        let platform = keyword.slice(0, 2);
        if(this.platform == "wy"){
            return await wymusicServer.getSongInfo(keyword);
        }else if(platform == "qq"){
            return await qqmusicServer.getSongInfo(keyword);
        }else{
            return await wymusicServer.getSongInfo(keyword);
        }
    },

    // 获取cookie
    getCookie: function(){
        if(this.platform == "wy"){
            return wymusicServer.cookie;
        }else if(this.platform == "qq"){
            return qqmusicServer.cookie;
        }
        return null;
    },

    // 设置cookie
    setCookie: function(cookie){
        if(this.platform == "wy"){
            wymusicServer.cookie = cookie;
            
        }else if(this.platform == "qq"){
            qqmusicServer.cookie = cookie;
        }
        // 加载cookie数据
        for (let i = 0; i < this.cookies.length; i++) {
            const ck = this.cookies[i];
            if(cookie.hasOwnProperty("wy")){
                ck["wy"] = cookie;
                break;
            }else if(cookie.hasOwnProperty("qq")){
                ck["qq"] = cookie;
                break;
            }
        }
        localStorage.setItem("cookies", JSON.stringify(this.cookies));
    },
}