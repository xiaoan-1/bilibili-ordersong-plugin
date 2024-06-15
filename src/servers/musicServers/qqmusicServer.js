import { publicMethod } from "../../utils/method.js";

export const qqmusicServer = {
    
    // https://github.com/jsososo/QQMusicApi
    baseUrl: "",

    cookie: "",

    /* 搜索歌曲信息 
        @param keyword 关键词
    */
    getSongInfo: async function(keyword){
        let song = null;
        await axios({
            method: "get",
            url: this.baseUrl +"/search",
            params: {
                key: keyword,
                pageSize: 5,
                pageNo: 1,
                t:0
            }
        }).then(function (resp) {
            // 获取歌曲列表
            let songs = resp.data.data.list;
            if(songs.length > 0){
                // 根据歌曲ID获取歌曲链接
                let songurl = this.getSongUrl(songs[0].id);
                // 封装歌曲信息
                song = {
                    platform: "qq",
                    sid: songs[0].songmid,
                    url: songurl,
                    sname: songs[0].songname,
                    sartist:songs[0].singer[0].name,
                    duration: songs[0].interval
                };
            }
        }).catch(function(error){
            publicMethod.pageAlert(error.message);
        });
        return song;
    },

    /* 获取播放链接
        @param    
    */
    getSongUrl: async function(songmid){
        let url = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/song/url",
            params: {
                id: songmid
            }
        }).then(function (resp) {
            if(resp.data.result == 100){
                // 获取对象的所有键
                url = resp.data.data;
            }else{
                console.log(resp.data);
                publicMethod.pageAlert("链接获取失败");
            }
        }).catch(function(error){
            publicMethod.pageAlert(error.message);
        });
        return url;
    },

    /* 设置cookie
        param qqcookie QQ音乐cookie
    */
    setCookie: async function(cookie){
        await axios({
            method: "post",
            url: this.baseUrl + "/user/setCookie",
            data: {
                data: this.cookie,
            },
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(function (resp) {
            publicMethod.pageAlert("cookie设置成功！");
            
        }).catch(function(error){
            publicMethod.pageAlert("cookie设置失败！");
        });
    },
    /* 获取cookie
        param qq qq号
    */
    getCookie: async function(qq){
        await axios({
            method: "get",
            url: this.baseUrl + "/user/getCookie",
            params: {
                id: qq,
            },
        }).then(function (resp) {
            publicMethod.pageAlert("获取cookie成功！");
        }).catch(function(error){
            publicMethod.pageAlert("获取cookie失败！");
        });
    },
}