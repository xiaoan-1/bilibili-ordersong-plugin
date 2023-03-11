/* 配置对象 */
const config = {
    
    // 管理员id（用于切歌命令的最高权限者）
    adminId: 352905327,

    // 用户点歌数量限制
    userOrder: 3,
    
    // 最大点歌数限制
    maxOrder: 15,

    // 最大歌曲时长限制(单位秒)
    maxDuration: 240,

    // 超过最大歌曲时长后限制播放的时间 (单位秒)，小于maxDuration
    overLimit: 0,

    // 空闲歌单ID (登录网易云网站，获取歌单页面url结尾ID)
    songListId: 7294328248, 
    
    // 用户黑名单
    userBlackList: [],
    
    // 歌曲黑名单
    songBlackList: [],

    // 用户登录的cookie
    cookie: null,
}

/* 用于初始化配置项 */
async function initConfig(){
    // 1. 在本地存储中更新配置项
    for(let key in config){
        if(localStorage.getItem(key)){
            switch(key){
                case 'cookie':
                    config[key] = localStorage.getItem(key);
                    break;
                case 'userBlackList':
                    config[key] = JSON.parse(localStorage.getItem(key));
                    break;
                case 'songBlackList': 
                    config[key] = JSON.parse(localStorage.getItem(key));
                    break;
                default: 
                    config[key] = parseInt(localStorage.getItem(key));
                    break;
            }           
        }
    }

    // 2. 加载空闲歌单
    configMethod.loadSongList(config.songListId);

    // 3. 获取用户登录状态
    let phone = document.getElementById('phone');
    let captcha = document.getElementById('captcha'); 
    let captchaBtn = document.getElementById('getCaptcha'); 
    if(config.cookie){ 
        let btnLogin = document.getElementById('login');
        // 获取登录的用户信息
        let loginStatus = await musicServer.loginStatus();
        if(loginStatus.code == 200){
            // 获取当前cookie登录的手机号（隐藏信息）
            phone.value = loginStatus.account.userName; 
            // 仅退出登录
            phone.disabled = true;
            captcha.disabled = true;
            captchaBtn.style.display = "none";
            btnLogin.textContent = "退出登录";
        }
    }
    
    // 4. 读取黑用户黑名单的配置项，并加载到页面中
    let userBlackList = document.getElementById('userBlackList');
    for(let i = 0; i < config.userBlackList.length; i++){
        let op = document.createElement('option');
        op.value = config.userBlackList[i].uid;
        op.textContent = config.userBlackList[i].uname;
        userBlackList.appendChild(op);
    }

    // 5. 读取歌曲黑名单配置项，并加载到页面中
    let songBlackList = document.getElementById('songBlackList');
    for(let i = 0; i < config.songBlackList.length; i++){
        let op = document.createElement('option');
        op.value = config.songBlackList[i].sid;
        op.textContent = config.songBlackList[i].sname;
        songBlackList.appendChild(op);
    }

    // 6. 设置实时修改部分配置项方法
    let keys = ["adminId", "userOrder", "maxOrder", "maxDuration", "overLimit"];
    for(let i = 0; i < keys.length; i++){
        let elem = document.getElementById(keys[i]);
        
        elem.value = config[keys[i]];
        elem.addEventListener("blur", function(e){
            // 规定限制时长和超时限播时长的区间大于30
            if (keys[i] == "maxDuration" && e.target.value < 30)
            {
                e.target.value = 30;
                musicMethod.pageAlert(`请输入大于30的数值!!!`);  
            }else if(keys[i] == "overLimit" && ((e.target.value != 0 && e.target.value < 30) || e.target.value > config.maxDuration)){
                e.target.value = 30;
                musicMethod.pageAlert(`请输入0或者30-${config.maxDuration}以内的数值!!!`);  
            }
            // 保存配置
            config[keys[i]] = parseInt(e.target.value);
            localStorage.setItem(keys[i], e.target.value);
        })
    }

    // 7. 绑定其他配置项按钮事件
    let sendTimer = null;
    // --获取验证码
    captchaBtn.onclick = async function(e){
        // 校验手机号格式 
        var regExp = new RegExp("^1[356789]\\d{9}$");
        if(phone.value != "" && regExp.test(phone.value)){     
            // 发送验证码
            let resp = await musicServer.sendCaptcha(phone.value);
            if(resp.code == 200){
                // 若发送成功，则保存手机号到配置项，用于登录时获取
                musicMethod.pageAlert("发送成功!");
            }else{
                // 发送失败，显示错误信息
                musicMethod.pageAlert(resp.msg);
            }
            // 进行倒计时，30秒后可再次发送验证码
            let second = 30;
            e.target.disabled = true;
            e.target.textContent = second;
            sendTimer = setInterval(function(){
                if(second > 0){
                    second--;
                    e.target.textContent = second;
                }else{
                    e.target.disabled = false;
                    e.target.textContent = "获取验证码";
                    clearInterval(sendTimer);
                }
            }, 1000)
        }else{
            musicMethod.pageAlert("手机号不正确!");
        }
    }
    // --登录
    document.getElementById('login').onclick = async function(e){
        if(config.cookie == null){
            // 如果当前不存在cookie，则进行登录获取cookie
            if(phone.value != null && captcha.value != ""){
                 // 先校验验证码是否正确
                let verify = await musicServer.verifyCaptcha(phone.value, captcha.value);
                if(verify.code == 200){
                    // 验证码正确，请求登录
                    let loginData = await musicServer.login(phone.value, captcha.value);
                    // 保存cookie
                    config.cookie = loginData.cookie;
                    localStorage.setItem("cookie", config.cookie);
                    // 登录成功后重新加载空闲歌单
                    configMethod.loadSongList(config.songListId);
                    // 手机号保护
                    phone.value = "1_********" + phone.value.slice(8, 11);
                    // 登录成功后禁用手机号验证码功能
                    phone.disabled = true;
                    captcha.value = "";
                    captchaBtn.style.display = "none";
                    e.target.textContent = "退出登录";
                }else{
                    musicMethod.pageAlert(verify.message);
                }
            }else{
                musicMethod.pageAlert("未输入手机号或者验证码！");
            }
        }else{
            // 若当前存在cookie信息，则进行退出登录
            // 发送退出登录请求
            musicServer.logout();
            // 清空手机号
            phone.value = "";
            phoneNumber = null;
            // 删除本地cookie
            config.cookie = null;
            localStorage.removeItem("cookie");
            // 启用手机号验证码功能
            phone.value = "";
            phone.disabled = false;
            captcha.disabled = false;
            captchaBtn.style.display = "";
            e.target.textContent = "登录";
            musicMethod.pageAlert("已退出登录!");
        }  
    }
    // --加载歌单
    document.getElementById('loadSongList').onclick = async function(e){
        let listId = parseInt(songListId.value);
        if(listId && config.songListId != listId){
            configMethod.loadSongList(listId);
            // 设置防抖功能, 使按钮失效几秒
            e.target.setAttribute("disabled", true);
            setTimeout(function(){
                e.target.removeAttribute("disabled");
            }, 3000);
        }else{
            musicMethod.pageAlert("未修改歌单Id");
        }
    };
    // --添加用户到黑名单
    document.getElementById('addUserBlack').onclick = function(){
        let userHistory = document.getElementById('userHistory');
        if(userHistory.children.length > 0){
            configMethod.addUserBlackList({
                uid: parseInt(userHistory[userHistory.selectedIndex].value),
                uname: userHistory[userHistory.selectedIndex].textContent
            });
            // 添加完成后删除历史用户的记录
            player.userHistory.splice(userHistory.selectedIndex,1);
            userHistory.options[userHistory.selectedIndex].remove();
            localStorage.setItem("userBlackList", JSON.stringify(config.userBlackList));
        }else{
            musicMethod.pageAlert("历史用户为空!");
        }
    };
    // --添加歌曲到黑名单
    document.getElementById('addSongBlack').onclick = function(){
        let songHistory = document.getElementById('songHistory');
        if(songHistory.children.length > 0){
            configMethod.addSongBlackList({
                sid: parseInt(songHistory[songHistory.selectedIndex].value),
                sname: songHistory[songHistory.selectedIndex].textContent
            });
            // 添加完成后删除历史歌曲的记录
            player.songHistory.splice(songHistory.selectedIndex,1);
            songHistory.options[songHistory.selectedIndex].remove();
            localStorage.setItem("songBlackList", JSON.stringify(config.songBlackList));
        }else{
            musicMethod.pageAlert("历史歌曲为空");
        }
    };
    // --移除黑名单的用户
    document.getElementById('delUserBlack').onclick = function(){
        let selectedIndex = userBlackList.selectedIndex;
        if(selectedIndex > -1){
            // 移除页面中用户黑名单的选中用户
            userBlackList.options[selectedIndex].remove();
            // 移除配置项中用户黑名单的对应用户
            config.userBlackList.splice(selectedIndex, 1);
            // 更新本地存储配置项
            localStorage.setItem("userBlackList", JSON.stringify(config.userBlackList));
        }else{
            musicMethod.pageAlert("移除失败，未选择移除用户");
        }
        
    };
    // --移除黑名单的歌曲
    document.getElementById('delSongBlack').onclick = function(){
        let selectedIndex = songBlackList.selectedIndex;
        if(selectedIndex > -1){
            // 移除页面中歌曲黑名单的选中歌曲
            songBlackList.options[selectedIndex].remove();
            // 移除配置项中歌曲黑名单对应的歌曲
            config.songBlackList.splice(selectedIndex, 1);
            // 更新本地存储配置项
            localStorage.setItem("songBlackList", JSON.stringify(config.songBlackList));

        }else{
            musicMethod.pageAlert("移除失败，未选择移除歌曲");
        }
    };
    // --设置界面的显示与隐藏
    document.getElementById('setting').onclick = function(){
        let configPanel = document.getElementsByClassName('config')[0];
        if(configPanel.clientHeight < 1){
            configPanel.style.height = "400px";
        }else{
            configPanel.style.height = "0px";
        }
    } 
    musicMethod.pageAlert("已初始化配置项");
}

/* 用于处理设置的函数 */
const configMethod = {
    // 添加用户历史记录
    addUserHistory: function(user){
        let existUser = false;
        // 检查历史用户中是否已经存在该用户
        for (let i = 0; i < player.userHistory.length; i++) {
            if(player.userHistory[i].uid == user.uid){
                existUser = true;
                break;
            }
        }
        if(!existUser){
            // 添加到播放器的用户历史记录中
            player.userHistory.push(user);
            // 同步页面的历史用户下拉框
            let userHistory = document.getElementById('userHistory');
            let op = document.createElement('option');
            op.value = user.uid;
            op.textContent = user.uname;
            userHistory.appendChild(op);
        }/* else{
            console.log("用户已存在历史用户记录中");
        } */
        
    },
    // 添加歌曲历史记录
    addSongHistory: function(song){
        let existSong = false;
        // 检查历史歌曲中是否已存在该歌曲
        for (let i = 0; i < player.songHistory.length; i++) {
            if(player.songHistory[i].sid == song.sid){
                existSong = true;
                break;
            }
        }
        if(!existSong){
            // 添加到播放器的歌曲历史记录中
            player.songHistory.push(song);
            // 同步页面的历史歌曲下拉框
            let songHistory = document.getElementById('songHistory');
            let op = document.createElement('option');
            op.value = song.sid;
            op.textContent = song.sname;
            songHistory.appendChild(op);
        }/* else{
            console.log("歌曲已存在歌曲历史记录中");
        } */
    },
    // 添加用户黑名单
    addUserBlackList: function(user){
        let existUser = false;
        // 检查用户黑名单是否已存在该用户
        for (let i = 0; i < config.userBlackList.length; i++) {
            if(config.userBlackList[i].uid == user.uid){
                existUser =  true;
                break;
            }
        }
        if(!existUser){
            // 如果黑名单人数大于50，则按队列结构出队（防止无限占用内存）
            if(config.userBlackList.length > 50){
                config.userBlackList.shift();
            }
            // 用户黑名单添加用户
            config.userBlackList.push(user);
            // 页面用户黑名单列表添加用户
            let userBlackList = document.getElementById('userBlackList');
            let op = document.createElement('option');
            op.value = user.uid;
            op.textContent = user.uname;
            userBlackList.appendChild(op);
        }else{
            musicMethod.pageAlert("用户已加入黑名单, 请勿重复添加!");
        }
    },
    // 添加歌曲黑名单 
    addSongBlackList: function(song){
        let existSong = false;
        // 检查歌曲黑名单是否已存在该歌曲
        for (let i = 0; i < config.songBlackList.length; i++) {
            if(config.songBlackList[i].sid == song.sid){
                existSong =  true;
                break;
            }
        }
        if(!existSong){
            // 如果歌曲黑名单大于50首，则按照队列结构出队（防止无限占用内存）
            if(config.songBlackList.length > 50){
                config.songBlackList.shift();
            }
            // 歌曲黑名单添加歌曲
            config.songBlackList.push(song);
            // 页面歌曲黑名单列表添加歌曲
            let songBlackList = document.getElementById('songBlackList');
            let op = document.createElement('option');
            op.value = song.sid;
            op.textContent = song.sname;
            songBlackList.appendChild(op);
        }else{
            musicMethod.pageAlert("歌曲已加入黑名单, 请勿重复添加!");
        }
    },
    // 加载空闲歌单
    loadSongList: async function(listId){
        if(listId){
            // 获取新的歌单
            let songList = await musicServer.getSongList(listId);
            if(songList.length > 0){
                player.freeList = songList;
                // 获取歌单成功后保存配置项
                config.songListId = listId;
                localStorage.setItem("songListId", config.songListId);
                document.getElementById('songListId').value = listId;
                // 加载完成后自动播放下一首
                player.playNext();
                musicMethod.pageAlert("已获取空闲歌单列表!");
            }else{
                musicMethod.pageAlert("歌单列表获取失败!");
               
            }
        }else{
            musicMethod.pageAlert("歌单Id无效!");
        }
    },
}