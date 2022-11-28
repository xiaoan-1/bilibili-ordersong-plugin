/* 歌曲API服务 */
const musicServer = {
    
    // 服务器地址
    baseUrl: "http://plugin.changsheng.space:3000",
    
    /* 发送验证码 
        @param phone 手机号
    */
    sendCaptcha: async function(phone){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/captcha/sent",
            params:{
                phone: phone
            }
        }).then(function (resp) {
            data = resp.data;
        })/* .catch(function(error){
            musicMethod.pageAlert(error.response);
        }); */        
        return data;
    },

    /* 校验验证码 
        @param phone 手机号
       @param captcha 验证码
    */
    verifyCaptcha: async function(phone, captcha){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/captcha/verify",
            params: {
                phone: phone,
                captcha: captcha,
            }
        }).then(function (resp) {
            data = resp.data;
        })/* .catch(function(error){
            musicMethod.pageAlert(error.response);
        }); */
        return data;
    },

    /* 登录
       @param phone 手机号
       @param captcha 验证码
     */
    login: async function(phone, captcha){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/login/cellphone",
            params: {
                phone: phone,
                captcha: captcha,
            }
        }).then(function (resp) {
            data = resp.data;
        })/* .catch(function(error){
            musicMethod.pageAlert(error.response);
        }); */
        return data;
    },

    /* 退出登录 */
    logout: async function(){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/logout",
            params: {
                cookie: config.cookie
            }
        })/* .catch(function(error){
            musicMethod.pageAlert(error.response);
        }); */
        return data;
    },

    /* 获取用户详情 */
    getUserDetail: async function(){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/user/account",
            params: {
                cookie: config.cookie
            }
        }).then(function (resp) {
            data = resp.data;
            console.log(resp.data);
        })/* .catch(function(error){
            musicMethod.pageAlert(error.response);
        }); */
        return data;
    },

    /* 登录状态 */
    loginStatus: async function(){
        let data;
        await axios({
            method: "get",
            url: this.baseUrl + "/login/status",
            params: {
                cookie: config.cookie
            }
        }).then(function (resp) {
            data = resp.data.data;
        })/* .catch(function(error){
            musicMethod.pageAlert(error.response);
        }); */
        return data;
    },

    /* 搜索歌曲信息 
        @param keyword 关键词
    */
    getSongInfo: async function(keyword){
        let song = null;
        await axios({
            method: "get",
            url: this.baseUrl +"/search",
            params: {
                cookie: config.cookie,
                keywords: keyword,
                limit: 10,
                type: 1,
            }
        }).then(function (resp) {
            // 获取歌曲列表
            let songs = resp.data.result.songs;
            if(songs.length > 0){
                // 封装歌曲信息
                song = musicMethod.getSongObject({
                    sid: songs[0].id,
                    sname: songs[0].name,
                    sartist:songs[0].artists[0].name,
                    duration: songs[0].duration
                });
            }
        })/* .catch(function(error){
            musicMethod.pageAlert(error.response);
        }); */
        return song;
    },

    /* 获取歌曲链接
        @param songId 歌曲Id
    */
    getSongUrl: async function(songId){
        let url = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/song/url",
            params: {
                cookie: config.cookie,
                id: songId
            }
        }).then(function (resp) {
            if(resp.data.code < 0){
                musicMethod.pageAlert(resp.data.message + "(登录)");
            }else if(resp.data.data[0].url){
                url = resp.data.data[0].url;
            }
        })/* .catch(function(error){
            musicMethod.pageAlert(error.response);
        }); */
        return url;
    },

    /* 获取歌单列表 
        @param listId 歌单Id
    */
    getSongList: async function(listId){
        let songList = new Array();
        await axios({
            method: "get",
            url: this.baseUrl + "/playlist/track/all",
            params: {
                cookie: config.cookie,
                id: listId
            }
        }).then(function (resp) {
            let songs = resp.data.songs;
            // 获取歌单的所有歌曲
            for(let i = 0; i < songs.length; i++){
                let song = {
                    uid: 123456,
                    uname: "空闲歌单",
                    song: {
                        sid: songs[i].id,
                        sname:songs[i].name,
                        sartist:songs[i].ar[0].name
                    }
                }
                songList.push(song);
            }
        }).catch(function(error){
            musicMethod.pageAlert(error.response.data.message + "(登录)");
        });
        return songList;
    },
    
}