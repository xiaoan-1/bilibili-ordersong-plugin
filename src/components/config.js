import { musicMethod } from "./public/method.js";

/*  配置对象
    用于保存和修改需要存储在本地的配置数据
 */
export const config = {
    
    // 管理员id（用于切歌命令的最高权限者）
    adminId: "0",
    elem_adminId: document.getElementById("adminId"),

    // 用户点歌数量限制
    userOrder: 3,
    elem_userOrder: document.getElementById('userOrder'),

    // 最大点歌数限制
    maxOrder: 15,
    elem_maxOrder: document.getElementById('maxOrder'),

    // 限制点歌歌曲的时长(单位秒), 超过则无法点上所点歌曲
    maxDuration: 0,
    elem_maxDuration: document.getElementById('maxDuration'),

    // 限制歌曲播放的时长(单位秒)，超过则自动播放下一首歌曲
    overLimit: 0,
    elem_overLimit: document.getElementById('overLimit'),
    
    // 空闲歌单ID (登录网易云网站，获取歌单页面url结尾ID)
    songListId: 7294328248, 
    elem_songListId: document.getElementById('songListId'),
    
    // 历史空闲歌单
    freeListHistory: [],
    elem_freeListHistory: document.getElementById('freeListHistory'),

    // 历史点歌用户
    userHistory: [],
    elem_userHistory: document.getElementById('userBlackList'),
    
    // 历史点歌歌曲
    songHistory: [],
    elem_songHistory: document.getElementById('userBlackList'),

    // 用户黑名单
    userBlackList: [],
    elem_userBlackList: document.getElementById('userBlackList'),
    
    // 歌曲黑名单
    songBlackList: [],
    elem_songBlackList: document.getElementById('songBlackList'),

    // 登录音乐平台的cookie
    cookies: [],

    // 初始化配置项
    init: function() {
        // 根据字段名读取配置项
        for(const key in this){
            if(!localStorage.getItem(key)){
                continue;
            }
            if (typeof this[key] == "string") {
                // 字符串类型配置项
                this[key] = localStorage.getItem(key);
            }else if( typeof this[key] == "number"){
                // 数字类型配置项
                this[key] = parseInt(localStorage.getItem(key));
            }else if(Array.isArray( this[key] )){
                // 数组类型配置项
                this[key] = JSON.parse(localStorage.getItem(key));
            }
            // 其他为function类型
        }

        // 读取完本地配置数据后，加载配置数据到页面中
        this.loadConfig();
        
        // 为页面控件添加事件
        this.addListener();

        musicMethod.pageAlert("已初始化配置项!");
    },

    // 加载配置数据到页面中
    loadConfig: function(){
        // 为页面元素设置配置项数据
        this.elem_adminId.value = this.adminId; 
        this.elem_userOrder.value = this.userOrder;
        this.elem_maxOrder.value = this.maxOrder;
        this.elem_maxDuration.value = this.maxDuration;
        this.elem_overLimit.value = this.overLimit;
        this.elem_songListId.value = this.songListId;

        // 加载历史歌单到设置页面中
        for(let i = 0; i < this.freeListHistory.length; i++){
            let option = document.createElement('option');
            option.value = this.freeListHistory[i].listId;
            option.textContent = this.freeListHistory  + "_" + this.freeListHistory[i];
            this.elem_freeListHistory.appendChild(option);
        }
        
        // 加载用户黑名单到设置页面中
        for(let i = 0; i < this.userBlackList.length; i++){
            let option = document.createElement('option');
            option.value = this.userBlackList[i].uid;
            option.textContent = this.userBlackList[i].uname;
            this.elem_userBlackList.appendChild(option);
        }

        // 加载歌曲黑名单到设置页面中
        for(let i = 0; i < this.songBlackList.length; i++){
            let option = document.createElement('option');
            option.value = this.songBlackList[i].sid;
            option.textContent = this.songBlackList[i].sname;
            this.elem_songBlackList.appendChild(option);
        }  
    },

    // 添加控件的监听事件
    addListener: function(){
        // 输入框失去焦点保存配置
        this.elem_adminId.addEventListener("blur", (e) => this.setAdminId(e.target.value));
        this.elem_userOrder.addEventListener("blur", (e) => this.setUserOrder(e.target.value));
        this.elem_maxOrder.addEventListener("blur",  (e) => this.setMaxOrder(e.target.value));
        this.elem_maxDuration.addEventListener("blur", (e) => this.setMaxDuration(e.target.value))
        this.elem_overLimit.addEventListener("blur", (e) => this.setOverLimit(e.target.value));
        this.elem_songListId.addEventListener("blur", (e) => this.setSongListId(e.target.value));

        // 设置界面的显示与隐藏
        document.getElementById('setting_btn').onclick = () =>{
            console.log("11");
            let settingPanel = document.getElementsByClassName('settingPanel')[0];
            settingPanel.clientHeight < 1 ? settingPanel.style.height = "400px" : settingPanel.style.height = "0px";
        } 

        // 历史歌单选择
        document.getElementById('selectSongList').onclick = () =>{
            let select = this.elem_freeListHistory.selectedIndex;

            if(this.elem_freeListHistory.children.length == 0 || select < 0){
                musicMethod.pageAlert("未选择歌单!");
                return;
            }

            this.elem_songListId.value = this.freeSongList[select];
        }

        // 添加用户到黑名单
        document.getElementById('addUserBlack').onclick = () =>{
            let select = this.elem_userHistory.selectedIndex;
            
            if(this.elem_userHistory.children.length == 0 || select < 0){
                musicMethod.pageAlert("未选择用户!");
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

        // 添加歌曲到黑名单
        document.getElementById('addSongBlack').onclick = () =>{
            let select = this.elem_songHistory.selectedIndex;

            if(this.elem_songHistory.children.length == 0 ||select < 0){
                musicMethod.pageAlert("未选择歌曲");
                return;
            }

            // 在历史歌曲中查询完整的歌曲数据，添加到歌曲黑名单中
            for (let i = 0; i < this.songHistory.length; i++) {
                if(this.songHistory[i].sid == this.elem_songHistory[select].value){
                    this.addSongBlackList(this.songHistory[i]);
                    break;
                }
            }
        };

        // 移除黑名单的用户
        document.getElementById('delUserBlack').onclick = () => {
            let select = this.elem_userBlackList.selectedIndex;
            
            if(this.elem_userBlackList.children.length == 0 || select < 0){
                musicMethod.pageAlert("未选择用户！");
                return;
            }
                
            // 移除用户黑名单配置项中对应的用户信息
            let uid = this.elem_userBlackList[select].value;
            for (let i = 0; i < this.userBlackList.length; i++) {
                if(this.userBlackList[i].uid == uid){
                    this.userBlackList.splice(i, 1);
                    break;
                }
            }
            // 移除页面中用户黑名单的选中用户
            this.elem_userBlackList.options[select].remove();
            
            // 更新本地存储配置项
            localStorage.setItem("userBlackList", JSON.stringify(this.userBlackList));
        };

        // 移除黑名单的歌曲
        document.getElementById('delSongBlack').onclick = () => {
            let select = this.elem_songBlackList.selectedIndex;
                
            if(this.elem_songBlackList.children.length == 0 || select < 0){
                musicMethod.pageAlert("未选择歌曲！");
                return;
            }

            // 移除歌曲黑名单配置项中对应的歌曲信息
            let sid = this.elem_songBlackList[select].value;
            for (let i = 0; i < this.songBlackList.length; i++) {
                if(this.songBlackList[i].sid == sid){
                    this.songBlackList.splice(i, 1);
                    break;
                }

            }
            // 移除页面中歌曲黑名单的选中歌曲
            this.elem_songBlackList.options[select].remove();

            // 更新本地存储配置项
            localStorage.setItem("songBlackList", JSON.stringify(this.songBlackList));
        };
    },

    // 设置管理员Id
    setAdminId: function(adminId){
        this.adminId = adminId;
        localStorage.setItem("adminId", this.adminId);
    },

    // 设置用户点歌数
    setUserOrder: function(userOrder){
        this.userOrder = userOrder;
        localStorage.setItem("userOrder", this.userOrder);
    },

    // 设置最大点歌数
    setMaxOrder: function(maxOrder){
        this.maxOrder = maxOrder;
        localStorage.setItem("maxOrder", this.maxOrder);
    },

    // 设置最大歌曲时长
    setMaxDuration: function(maxDuration){
        this.maxDuration = maxDuration;
        localStorage.setItem("maxDuration", this.maxDuration);
    },

    // 设置歌曲限制时长
    setOverLimit: function(overLimit){
        this.overLimit = overLimit;
        localStorage.setItem("overLimit", this.overLimit);
    },

    // 设置歌单ID
    setSongListId: function(songListId){
        this.songListId = songListId;
        localStorage.setItem("songListId", this.songListId);
    },

    // 添加空闲歌单ID
    addFreeListHistory: function(songListInfo){
        // 查重
        for (let i = 0; i < this.freeListHistory.length; i++) {
            if(this.freeListHistory[i].platform == songListInfo.platform &&
                this.freeListHistory[i].listId == songListInfo.listId){
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if(this.freeListHistory.length > 50){
            this.freeListHistory.shift();
        }
        // 添加歌单信息
        this.freeListHistory.push(songListInfo);

        // 同步页面的历史用户下拉框
        let elem_freeListHistory = document.getElementById('freeListHistory');
        let elem_option = document.createElement('option');
        elem_option.value = songListInfo.listId;
        elem_option.textContent = songListInfo.platform + "_" + songListInfo.listId;
        elem_freeListHistory.appendChild(elem_option);

        // 保存配置信息
        localStorage.setItem("freeSongList", JSON.stringify(this.freeSongList));
    },
    
    // 添加历史用户信息
    addUserHistory: function(user){
        // 查重
        for (let i = 0; i < this.userHistory.length; i++) {
            if(this.userHistory[i].uid == user.uid){
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if(this.userHistory.length > 50){
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
    },
    
    // 添加历史歌曲信息
    addSongHistory: function(song){
        for (let i = 0; i < songHistory.length; i++) {
            if(songHistory[i].sid == song.sid){
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if(this.songHistory.length > 50){
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
    },

    // 添加用户黑名单信息
    addUserBlackList: function(user){
        // 查重
        for (let i = 0; i < this.userBlackList.length; i++) {
            if(this.userBlackList[i].uid == user.uid){
                musicMethod.pageAlert("用户已加入黑名单, 请勿重复添加!");
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if(this.userBlackList.length > 50){
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
    },

    // 添加歌曲黑名单信息
    addSongBlackList: function(song){
        // 查重
        for (let i = 0; i < this.songBlackList.length; i++) {
            if(this.songBlackList[i].sid == song.sid){
                musicMethod.pageAlert("歌曲已加入黑名单, 请勿重复添加!");
                return;
            }
        }
        // 限长，按队列结构出队（防止无限占用内存）
        if(this.songBlackList.length > 50){
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
    },

    // 添加Cookie
    addCookie: function(cookie){
        this.cookies.push(cookie);
        localStorage.setItem("cookies", JSON.stringify(this.cookies));
    },

    removeCookie: function(){
        
    },

}