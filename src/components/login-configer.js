import musicPlayer from "./music-player.js";
import publicMethod from "../utils/public-method.js";
import musicServer from "../services/musicServers/music-server.js";

/**
 * 登录配置
 */
class LoginConfiger {

    // 空闲歌单ID
    songListId = localStorage.getItem("songListId") || "7294328248";
    elem_songListId = document.getElementById("songListId");

    // 历史加载的歌单ID
    songListHistory = JSON.parse(localStorage.getItem("songListHistory")) || [];
    elem_songListHistory = document.getElementById("songListHistory");

    constructor() {
        // 加载历史歌单列表
        this.loadSongListHistory();

        // 添加按钮监听事件
        this.addListener();

        console.log("登录配置初始化完成");
    }

    // 给页面配置项添加点击事件
    addListener() {
        // 音乐平台切换
        document.getElementById('musicPlatformSelect').onchange = (e) => this.swithPlatform(e);

        // 网易二维码登录
        document.getElementById('qrButton').onclick = () => this.updateQrPicture();

        // qq cookie登录
        document.getElementById('ckButton').onclick = () => this.cookieLogin();

        // 加载歌单按钮
        document.getElementById('loadSongList').onclick = () => this.loadSongList();

        // 选择历史歌单ID
        document.getElementById('selectSongList').onclick = () => {
            let selectIndex = this.elem_songListHistory.selectedIndex;
            if (selectIndex < 0) {
                publicMethod.pageAlert("未选择歌单！");
                return;
            }
            this.elem_songListId.value = this.elem_songListHistory[selectIndex].value;
        };
    }

    // 切换音乐平台
    async swithPlatform(e) {
        document.getElementById('loginForm').style.left = (-400 * e.target.selectedIndex) + "px";

        // 切换音乐API服务对象
        musicServer.changePlatform(e.target.value);
    }

    // 扫码登录，更新二维码
    async updateQrPicture() {
        // 二维码图片
        let qrImg = document.getElementById('qrImg');
        // 先获取二维码的key
        let unikey = await musicServer.getServer("wy").getQrKey();
        if (!unikey) {
            qrImg.textContent = "二维码获取失败！";
            return;
        }

        // 用二维码key获取二维码图片地址
        let qrUrl = await musicServer.getServer("wy").getQrPicture(unikey);

        // 显示二维码/设置不可点击刷新
        qrImg.setAttribute("src", qrUrl);

        // 轮询二维码状态
        let qrCheck = setInterval(async () => {
            let data = await musicServer.getServer("wy").checkQrStatus(unikey);
            if (!data) {
                // 二维码失效
                clearInterval(qrCheck);
                publicMethod.pageAlert("二维码获取失败!");
            } else if (data.code == 800) {
                // 二维码过期
                clearInterval(qrCheck);
                publicMethod.pageAlert("二维码已过期");
            } else if (data.code == 803) {
                // 授权成功, 保存cookie
                musicServer.getServer("wy").cookie = data.cookie;
                localStorage.setItem("wycookie", JSON.stringify(data.cookie));
                qrImg.setAttribute("src", "");
                clearInterval(qrCheck);
                publicMethod.pageAlert("登录成功!");
            }
        }, 3000)
    }

    // cookie登录，设置cookie
    async cookieLogin() {
        const qqNumber = document.getElementById('qqNumber').value;
        if (!qqNumber) {
            publicMethod.pageAlert("请输入QQ号");
            return;
        }
        const cookie = document.getElementById('ckText').value;
        if (!cookie) {
            publicMethod.pageAlert("请输入cookie");
            return;
        }

        const setResult = await musicServer.getServer("qq").setCookie(cookie);
        if (setResult) {
            publicMethod.pageAlert("QQ设置cookie成功!");
        } else {
            publicMethod.pageAlert("QQ设置cookie失败!");
        }

        // 获取QQ号指定的cookie
        const getResult = await musicServer.getServer("qq").getCookie(qqNumber);
        if (setResult) {
            publicMethod.pageAlert("获取cookie成功!");
        } else {
            publicMethod.pageAlert("获取cookie失败!");
        }
    }

    // 加载空闲歌单
    async loadSongList() {
        let listId = document.getElementById("songListId").value;
        // 无效ID
        if (!listId) {
            publicMethod.pageAlert("请输入有效歌单ID");
            return;
        }
        // 获取新的歌单列表
        let songList = await musicServer.getServer().getSongList(listId);
        if (!songList.length) {
            publicMethod.pageAlert("歌单列表获取失败!");
            return false;
        }

        // 加载并播放空闲歌单
        this.songListId = listId;
        // 洗牌后加载歌单信息
        musicPlayer.idleSongList = publicMethod.shuffle(songList);
        musicPlayer.playNext();

        // 添加到历史记录中
        this.addSongListHistory(listId);
        // 保存配置
        localStorage.setItem("songListId", this.songListId);
        publicMethod.pageAlert("已获取空闲歌单列表!");
    }

    // 加载历史歌单列表
    loadSongListHistory() {
        // 设置默认歌单
        this.elem_songListId.value = this.songListId;

        // 清空option
        this.elem_songListHistory.innerHTML = '';

        // 加载历史歌单到设置页面中
        for (let i = 0; i < this.songListHistory.length; i++) {
            if (this.songListHistory[i].platform != musicServer.platform) {
                continue;
            }
            let option = document.createElement('option');
            option.value = this.songListHistory[i].listId;
            option.textContent = this.songListHistory[i].listName;
            this.elem_songListHistory.appendChild(option);
        }
    }

    // 添加历史歌单ID
    addSongListHistory(listId) {
        // 歌单ID查重
        for (let i = 0; i < this.songListHistory.length; i++) {
            if (this.songListHistory[i].platform == musicServer.platform &&
                this.songListHistory[i].listId == listId) {
                return;
            }
        }
        // 限长
        if (this.songListHistory.length > 50) {
            this.songListHistory.shift();
        }

        // 添加歌单信息
        this.songListHistory.push({
            platform: musicServer.platform,
            listId: listId,
            listName: listId
        });

        // 新建选项
        let elem_option = document.createElement('option');
        elem_option.value = listId;
        elem_option.textContent = listId;
        this.elem_songListHistory.appendChild(elem_option);

        // 保存配置信息
        localStorage.setItem("songListHistory", JSON.stringify(this.songListHistory));
    }

}

export default new LoginConfiger();
