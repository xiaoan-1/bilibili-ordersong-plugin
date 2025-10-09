class WyMusicServer {

    // 服务器地址
    baseUrl = window.API_CONFIG.netease_api_url;

    cookie = localStorage.getItem("wycookie");

    // 游客登录
    async anonimousLogin() {
        let data = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/register/anonimous",
        }).then(function (resp) {
            data = resp.data;
        }).catch(function (error) {
            console.log("游客登录失败！", error.response);
        });
        return data;
    }

    // 获取用户详情
    async getUserDetail() {
        let data = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/user/account",
            params: {
                cookie: this.cookie
            }
        }).then(function (resp) {
            data = resp.data;
        }).catch(function (error) {
            console.log("获取用户详情失败!", error.response);
        });
        return data;
    }

    // 获取登录状态
    async getLoginStatus() {
        let data = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/login/status",
            params: {
                cookie: this.cookie
            }
        }).then(function (resp) {
            data = resp.data.data;
        }).catch(function (error) {
            console.log("获取登录状态失败!", error.response);
        });
        return data;
    }

    // 获取二维码
    async getQrKey() {
        let unikey = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/login/qr/key",
            params: {
                timestamp: Date.now(),
            }
        }).then(function (resp) {
            unikey = resp.data.data.unikey;
        }).catch(function (error) {
            console.log("获取二维码key失败!", error.response);
        });
        return unikey;
    }

    // 获取二维码图片
    async getQrPicture(key) {
        let qrImgUrl = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/login/qr/create",
            params: {
                key: key,
                qrimg: true,
                timestamp: Date.now(),
            }
        }).then(function (resp) {
            qrImgUrl = resp.data.data.qrimg;
        }).catch(function (error) {
            console.log("二维码图片获取失败!", error.response);
        });
        return qrImgUrl;
    }

    // 检查二维码扫描状态
    async checkQrStatus(key) {
        let data = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/login/qr/check",
            params: {
                key: key,
                timestamp: Date.now(),
            }
        }).then(function (resp) {
            // cookie
            data = resp.data;
        }).catch(function (error) {
            console.log("获取二维码扫描状态失败!", error.response);
        });
        return data;
    }

    // 退出登录
    async logout() {
        let data = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/logout",
            params: {
                cookie: this.cookie
            }
        }).catch(function (error) {
            console.log("退出登录失败！", error.response);
        });
        return data;
    }

    /* 搜索歌曲信息 
        @param keyword 关键词
    */
    async getSongInfo(keyword) {
        let song = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/search",
            params: {
                cookie: this.cookie,
                keywords: keyword,
                limit: 10,
                type: 1,
            }
        }).then(function (resp) {
            // 获取歌曲列表
            let songs = resp.data.result.songs;
            if (songs.length > 0) {
                // 封装歌曲信息
                song = {
                    platform: "wy",
                    sid: songs[0].id,
                    sname: songs[0].name,
                    sartist: songs[0].artists[0].name,
                    duration: songs[0].duration / 1000,
                };
            }
        }).catch(function (error) {
            console.log("歌曲搜索失败!", error.response);
        });
        return song;
    }

    /* 获取歌曲链接
        @param songId 歌曲Id
    */
    async getSongUrl(songId) {
        let url = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/song/url/v1",
            params: {
                cookie: this.cookie,
                id: songId,
                level: "standard",
            }
        }).then(function (resp) {
            if (resp.data.code < 0) {
                console.log("歌曲链接获取失败!", resp.data.message);
            } else if (resp.data.data[0].url) {
                url = resp.data.data[0].url;
            }
        }).catch(function (error) {
            console.log("歌曲链接获取失败!", error.message);
        });
        return url;
    }

    /* 获取歌单列表 
        @param listId 歌单Id
    */
    async getSongList(listId) {
        let songList = new Array();
        await axios({
            method: "get",
            url: this.baseUrl + "/playlist/track/all",
            params: {
                cookie: this.cookie,
                id: listId
            }
        }).then(async function (resp) {
            let songs = resp.data.songs;
            // 获取歌单的所有歌曲
            for (let i = 0; i < songs.length; i++) {
                let song = {
                    uid: 0,
                    uname: "空闲歌单",
                    song: {
                        platform: "wy",
                        sid: songs[i].id,
                        url: null,
                        sname: songs[i].name,
                        sartist: songs[i].ar[0].name,
                        // duration: songs[0].duration / 1000 ,
                    }
                }
                songList.push(song);
            }
        }).catch(function (error) {
            console.log("歌单信息获取失败!", error.response);
        });
        return songList;
    }
}

export default new WyMusicServer();

