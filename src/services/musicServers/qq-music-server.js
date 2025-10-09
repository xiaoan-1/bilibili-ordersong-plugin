class QQMusicServer {

    // https://github.com/jsososo/QQMusicApi
    baseUrl = window.API_CONFIG.qqmusic_api_url;

    cookie = localStorage.getItem("qqcookie");

    // 设置cookie
    async setCookie(cookie) {
        let isSuccess = false;
        await axios({
            method: "post",
            url: this.baseUrl + "/user/setCookie",
            data: {
                data: cookie,
            },
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(function (resp) {
            isSuccess = true;
            console.log(resp.data.message);
        }).catch(function (error) {
            console.log("设置Cookie失败", error.message);
        });
        return isSuccess;
    }

    // 获取cookie
    async getCookie(qq) {
        let isSuccess = false;
        await axios({
            method: "get",
            url: this.baseUrl + "/user/getCookie",
            params: {
                id: qq,
            },
        }).then(function (resp) {
            isSuccess = true;
            console.log(resp.data.message);
        }).catch(function (error) {
            console.log("qq音乐获取Cookie失败", error.message);
        });
        return isSuccess;
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
                key: keyword,
                pageSize: 5,
                pageNo: 1
            }
        }).then(function (resp) {
            // 获取歌曲列表
            let songs = resp.data.data.list;
            if (songs.length > 0) {
                // 封装歌曲信息
                song = {
                    platform: "qq",
                    sid: songs[0].songmid,
                    sname: songs[0].songname,
                    sartist: songs[0].singer[0].name,
                    duration: songs[0].interval
                };
            }
        }).catch(function (error) {
            console.log("歌曲搜索失败", error.message);
        });
        return song;
    }

    /* 获取播放链接
        @param songmid 歌曲ID
    */
    async getSongUrl(songmid) {
        let url = null;
        await axios({
            method: "get",
            url: this.baseUrl + "/song/url",
            params: {
                id: songmid
            }
        }).then(function (resp) {
            if (resp.data.result == 100) {
                // 获取对象的所有键
                url = resp.data.data;
            } else {
                console.log(resp.data);
            }
        }).catch(function (error) {
            console.log("歌曲链接获取失败", error.message);
        });
        return url;
    }

    /* 获取歌单列表
        @param listId 歌单Id
    */
    async getSongList(listId) {
        return [];
    }
}

export default new QQMusicServer();