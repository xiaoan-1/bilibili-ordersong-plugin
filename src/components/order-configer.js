import publicMethod from "../utils/public-method.js";

/**
 * 点歌配置项
 * 包括用户点歌数限制、黑名单等
 */
class OrderConfiger {

    // 用户点歌数量限制
    userMaxOrder = parseInt(localStorage.getItem("userMaxOrder")) || 3;
    elem_userMaxOrder = document.getElementById('userMaxOrder');

    // 全局最大点歌数限制
    globalMaxOrder = parseInt(localStorage.getItem("globalMaxOrder")) || 15;
    elem_globalMaxOrder = document.getElementById('globalMaxOrder');

    // 限制点歌歌曲的时长(单位秒), 超过则无法点上
    orderMaxDuration = parseInt(localStorage.getItem("orderMaxDuration")) || 0;
    elem_orderMaxDuration = document.getElementById('orderMaxDuration');

    // 限制歌曲播放的时长(单位秒)，超过则自动播放下一首歌曲
    overLimitSkip = parseInt(localStorage.getItem("overLimitSkip")) || 0;
    elem_overLimitSkip = document.getElementById('overLimitSkip');

    // 历史点歌用户
    userHistory = JSON.parse(localStorage.getItem("userHistory")) || [];
    elem_userHistory = document.getElementById("userHistory");

    // 历史点歌歌曲
    songHistory = JSON.parse(localStorage.getItem("songHistory")) || [];
    elem_songHistory = document.getElementById("songHistory");

    // 用户黑名单
    userBlackList = JSON.parse(localStorage.getItem("userBlackList")) || [];
    elem_userBlackList = document.getElementById("userBlackList");

    // 歌曲黑名单
    songBlackList = JSON.parse(localStorage.getItem("songBlackList")) || [];
    elem_songBlackList = document.getElementById("songBlackList");

    // 构造函数
    constructor() {
        // 为页面元素设置配置项数据
        this.elem_userMaxOrder.value = this.userMaxOrder;
        this.elem_globalMaxOrder.value = this.globalMaxOrder;
        this.elem_orderMaxDuration.value = this.orderMaxDuration;
        this.elem_overLimitSkip.value = this.overLimitSkip;

        // 加载历史用户列表
        for (let i = 0; i < this.userHistory.length; i++) {
            let option = document.createElement('option');
            option.value = this.userHistory[i].uid;
            option.textContent = this.userHistory[i].uname;
            this.elem_userHistory.appendChild(option);
        }

        // 加载用户黑名单
        for (let i = 0; i < this.userBlackList.length; i++) {
            let option = document.createElement('option');
            option.value = this.userBlackList[i].uid;
            option.textContent = this.userBlackList[i].uname;
            this.elem_userBlackList.appendChild(option);
        }

        // 加载历史点歌歌曲
        for (let i = 0; i < this.songHistory.length; i++) {
            let option = document.createElement('option');
            option.value = this.songHistory[i].sid;
            option.textContent = this.songHistory[i].sname;
            this.elem_songHistory.appendChild(option);
        }

        // 加载歌曲黑名单
        for (let i = 0; i < this.songBlackList.length; i++) {
            let option = document.createElement('option');
            option.value = this.songBlackList[i].sid;
            option.textContent = this.songBlackList[i].sname;
            this.elem_songBlackList.appendChild(option);
        }

        this.addListener();
        console.log("点歌配置初始化完成");
        publicMethod.pageAlert("已初始化配置项!");
    }

    // 添加控件的监听事件
    addListener() {
        // 输入框失去焦点保存配置
        this.elem_userMaxOrder.addEventListener("blur", (e) => this.setUserMaxOrder(e.target.value));
        this.elem_globalMaxOrder.addEventListener("blur", (e) => this.setGlobalMaxOrder(e.target.value));
        this.elem_orderMaxDuration.addEventListener("blur", (e) => this.setOrderMaxDuration(e.target.value))
        this.elem_overLimitSkip.addEventListener("blur", (e) => this.setOverLimitSkip(e.target.value));

        // 添加用户到黑名单
        document.getElementById('addUserBlack').onclick = () => {
            let select = this.elem_userHistory.selectedIndex;
            if (this.elem_userHistory.children.length == 0 || select < 0) {
                publicMethod.pageAlert("未选择用户!");
                return;
            }
            // 在历史用户里查询完整的数据，添加到黑名单中
            for (let i = 0; i < this.userHistory.length; i++) {
                if (this.userHistory[i].uid == this.elem_userHistory[select].value) {
                    this.addUserBlackList(this.userHistory[i]);
                    break;
                }
            }
        };
        // 移除黑名单的用户
        document.getElementById('delUserBlack').onclick = () => {
            let select = this.elem_userBlackList.selectedIndex;
            if (this.elem_userBlackList.children.length == 0 || select < 0) {
                publicMethod.pageAlert("未选择用户！");
                return;
            }
            this.removeUserBlackList(this.elem_userBlackList[select].value);
        };

        // 添加歌曲到黑名单
        document.getElementById('addSongBlack').onclick = () => {
            let select = this.elem_songHistory.selectedIndex;
            if (this.elem_songHistory.children.length == 0 || select < 0) {
                publicMethod.pageAlert("未选择歌曲");
                return;
            }
            // 在历史歌曲中查询完整的歌曲数据，添加到歌曲黑名单中
            for (let i = 0; i < this.songHistory.length; i++) {
                if (this.songHistory[i].sid == this.elem_songHistory[select].value) {
                    this.addSongBlackList(this.songHistory[i]);
                    break;
                }
            }
        };

        // 移除黑名单的歌曲
        document.getElementById('delSongBlack').onclick = () => {
            let select = this.elem_songBlackList.selectedIndex;
            if (this.elem_songBlackList.children.length == 0 || select < 0) {
                publicMethod.pageAlert("未选择歌曲！");
                return;
            }
            this.removeSongBlackList(this.elem_songBlackList[select].value);
        };
    }

    // 设置用户点歌数
    setUserMaxOrder(userOrder) {
        if (userOrder == "" || userOrder <= 0) {
            this.elem_userMaxOrder.value = this.userMaxOrder;
            return;
        }
        this.userMaxOrder = userOrder;
        localStorage.setItem("userMaxOrder", this.userMaxOrder);
    }

    // 设置全局最大点歌数
    setGlobalMaxOrder(globalMaxOrder) {
        if (globalMaxOrder == "" || globalMaxOrder <= 0) {
            this.elem_globalMaxOrder.value = this.globalMaxOrder;
            return;
        }
        this.globalMaxOrder = globalMaxOrder;
        localStorage.setItem("globalMaxOrder", this.globalMaxOrder);
    }

    // 设置最大点歌歌曲时长
    setOrderMaxDuration(orderMaxDuration) {
        if (orderMaxDuration == "" || orderMaxDuration < 0) {
            this.elem_orderMaxDuration.value = this.orderMaxDuration;
            return;
        }
        this.orderMaxDuration = orderMaxDuration;
        localStorage.setItem("orderMaxDuration", this.orderMaxDuration);
    }

    // 设置歌曲限制时长
    setOverLimitSkip(overLimitSkip) {
        if (overLimitSkip == "" || overLimitSkip < 0) {
            this.elem_overLimitSkip.value = this.overLimitSkip;
            return;
        }
        this.overLimitSkip = overLimitSkip;
        localStorage.setItem("overLimitSkip", this.overLimitSkip);
    }

    // 添加历史用户信息
    addUserHistory(user) {
        // 查重
        for (let i = 0; i < this.userHistory.length; i++) {
            if (this.userHistory[i].uid == user.uid) {
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if (this.userHistory.length > 50) {
            this.userHistory.shift();
        }
        // 添加用户信息
        this.userHistory.push(user);
        // 同步页面的历史用户下拉框
        let elem_userHistory = document.getElementById('userHistory');
        let elem_option = document.createElement('option');
        elem_option.value = user.uid;
        elem_option.textContent = user.uname;
        elem_userHistory.appendChild(elem_option);
        // 保存到本地
        localStorage.setItem("userHistory", JSON.stringify(this.userHistory));
    }

    // 添加历史歌曲信息
    addSongHistory(song) {
        for (let i = 0; i < this.songHistory.length; i++) {
            if (this.songHistory[i].sid == song.sid) {
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if (this.songHistory.length > 50) {
            this.songHistory.shift();
        }
        // 添加歌曲信息
        this.songHistory.push(song);
        // 同步页面的历史歌曲下拉框
        let elem_songHistory = document.getElementById('songHistory');
        let elem_option = document.createElement('option');
        elem_option.value = song.sid;
        elem_option.textContent = song.sname;
        elem_songHistory.appendChild(elem_option);
        // 保存到本地
        localStorage.setItem("songHistory", JSON.stringify(this.songHistory));
    }

    // 添加用户黑名单信息
    addUserBlackList(user) {
        // 查重 
        for (let i = 0; i < this.userBlackList.length; i++) {
            if (this.userBlackList[i].uid == user.uid) {
                publicMethod.pageAlert("用户已加入黑名单, 请勿重复添加!");
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if (this.userBlackList.length > 50) {
            this.userBlackList.shift();
        }
        // 用户黑名单添加用户
        this.userBlackList.push(user);
        // 页面用户黑名单列表添加用户
        let elem_userBlackList = document.getElementById('userBlackList');
        let elem_option = document.createElement('option');
        elem_option.value = user.uid;
        elem_option.textContent = user.uname;
        elem_userBlackList.appendChild(elem_option);
        // 保存到本地
        localStorage.setItem("userBlackList", JSON.stringify(this.userBlackList));
    }

    // 移除用户黑名单配置项中对应的用户信息
    removeUserBlackList(uid) {
        // 查找
        for (let i = 0; i < this.userBlackList.length; i++) {
            if (this.userBlackList[i].uid == uid) {
                this.userBlackList.splice(i, 1);
                break;
            }
        }
        // 移除页面中用户黑名单的选中用户
        this.elem_userBlackList.querySelector(`option[value='${uid}']`).remove();
        // 更新本地存储配置项
        localStorage.setItem("userBlackList", JSON.stringify(this.userBlackList));
    }

    // 添加歌曲黑名单信息
    addSongBlackList(song) {
        // 查重
        for (let i = 0; i < this.songBlackList.length; i++) {
            if (this.songBlackList[i].sid == song.sid) {
                publicMethod.pageAlert("歌曲已加入黑名单, 请勿重复添加!");
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if (this.songBlackList.length > 50) {
            this.songBlackList.shift();
        }
        // 歌曲黑名单添加歌曲
        this.songBlackList.push(song);
        // 页面歌曲黑名单列表添加歌曲
        let elem_songBlackList = document.getElementById('songBlackList');
        let elem_option = document.createElement('option');
        elem_option.value = song.sid;
        elem_option.textContent = song.sname;
        elem_songBlackList.appendChild(elem_option);
        // 保存到本地
        localStorage.setItem("songBlackList", JSON.stringify(this.songBlackList));
    }

    // 歌曲黑名单移除歌曲
    removeSongBlackList(sid) {
        // 查找
        for (let i = 0; i < this.songBlackList.length; i++) {
            if (this.songBlackList[i].sid == sid) {
                this.songBlackList.splice(i, 1);
                break;
            }
        }
        // 移除页面中歌曲黑名单的选中歌曲
        this.elem_songBlackList.querySelector(`option[value='${sid}']`).remove();
        // 更新本地存储配置项
        localStorage.setItem("songBlackList", JSON.stringify(this.songBlackList));
    }

}

export default new OrderConfiger();