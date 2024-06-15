import { player } from "./player.js";
import { publicMethod } from "../utils/method.js";
import { musicServer } from "../servers/musicServers/musicServer.js"

 /* 设置对象
    用于为用户提供界面上的配置功能
*/
export const login = {

    // 历史加载的歌单ID
    freeListIdHistory: [],
    elem_freeListIdHistory: document.getElementById('freeListIdHistory'),

    // 空闲歌单ID
    freeListId: "7294328248", 
    elem_songListId: document.getElementById('songListId'),

    // 初始化登录信息
    init: function(){
        
        publicMethod.readConfig(this);

        this.loadConfig();
        
        this.addListener();

        publicMethod.pageAlert("已初始化登录");
    },
    
    // 加载配置信息
    loadConfig: function(){
        // 加载历史歌单到设置页面中
        for(let i = 0; i < this.freeListIdHistory.length; i++){
            if(this.freeListIdHistory[i].platform != musicServer.platform){
                continue;
            }
            let option = document.createElement('option'); 
            option.value = this.freeListIdHistory[i].listId;
            option.textContent = this.freeListIdHistory[i].listName;
            this.elem_freeListIdHistory.appendChild(option);
        }
        
        // 加载歌单
        if(this.freeListIdHistory.length > 0){
            this.elem_songListId.value = this.freeListIdHistory[0].listId;
            this.loadSongList();
        }
    },

    // 给页面配置项添加点击事件
    addListener: function(){
        // 登录方式切换
        let elem_types = document.getElementById('loginType');
        let elem_forms = document.getElementById('loginForm');
        for (let i = 0; i < elem_types.children.length; i++) {
            const btn = elem_types.children[i];
            btn.onclick = () => {
                elem_forms.style.left = -(400 * (i + 1)) + "px";
            }
        }

        // 退出登录
        document.getElementById('logout').onclick = () => {
            this.logout();
        };

        // 二维码登录
        document.getElementById('qrImg').onclick = () => {
            this.updateQrPicture();
        };

        // 获取验证码
        document.getElementById('getCaptcha').disabled = true;
        document.getElementById('getCaptcha').onclick = () => {
            this.getCaptcha();
        };

        // 验证码登录
        document.getElementById('captchaLogin').disabled = true;
        document.getElementById('captchaLogin').onclick = () => {
            this.captchaLogin();
        };

        // 账号登录
        document.getElementById('accountLogin').disabled = true;
        document.getElementById('accountLogin').onclick = () => {
            this.accountLogin();
        };

        // cookie登录
        document.getElementById('cookieLogin').disabled = true;
        document.getElementById('cookieLogin').onclick = () => {
            this.cookieLogin();
        };
   
        // 加载歌单按钮
        document.getElementById('loadSongList').onclick = () => {
            this.loadSongList();
        };

        // 选择歌单ID
        document.getElementById('selectSongList').onclick = () => {
            let select = this.elem_freeListIdHistory.selectedIndex;
            console.log(select);
            if(select < 0){
                publicMethod.pageAlert("未选择歌单！");
                return;
            }
            this.elem_songListId.value = this.elem_freeListIdHistory[select].value;
        };
    },

    // 加载空闲歌单
    loadSongList: async function(){
        let listId = this.elem_songListId.value;
        // 无效ID
        if(!listId){
            publicMethod.pageAlert("歌单Id无效!");
            return;
        }
        // 重复ID
        if(this.freeListId == listId){
            publicMethod.pageAlert("歌单ID未修改");
            return;
        }
        // 获取新的歌单列表
        let songList = await musicServer.getSongList(listId);
        if(!songList.length){
            publicMethod.pageAlert("歌单列表获取失败!");
            return false;
        }

        // 加载并播放空闲歌单
        this.freeListId = listId;
        player.freeList = songList;
        player.playNext();

        // 添加到历史记录中
        this.addFreeListIdHistory(listId);
        publicMethod.pageAlert("已获取空闲歌单列表!");
    },

    // 读取配置数据到设置页面中
    getUserInfo: async function(){
        // 获取登录信息
        let loginStatus = await musicServer.getLoginStatus();
        if(loginStatus.code == 200){
            // 获取当前cookie登录的手机号（隐藏信息）
            document.getElementById('userName').value = loginStatus.account.userName; 
            document.getElementById('userPhone').value = loginStatus.account.phone; 

            // 跳转至用户信息页
            document.getElementById('loginForm').style.left = "0px";
        }else{
            publicMethod.pageAlert("用户信息获取失败!");
        }
    },
    
    logout: async function(){
        // 退出后默认跳转至扫码登录
        document.getElementById('loginForm').style.left = "-400px";
    },

    // 扫码登录，更新二维码
    updateQrPicture: async function(){
        // 二维码图片
        let qrImg = document.getElementById('qrImg'); 
        let unikey = await musicServer.getQrPictureUrl(qrImg);

        // 轮询二维码状态
        qrCheck = setInterval(async () => {
            let data = await musicServer.checkQrStatus(unikey);
            if (!data) {
                publicMethod.pageAlert("请求失败!");
                clearInterval(qrCheck);
            }else if(data.code == 800){
                // 二维码过期
                publicMethod.pageAlert("二维码已过期");
                clearInterval(qrCheck);
            }else if(data.code == 803){
                // 授权成功, 保存cookie
                musicServer.setCookie(data.cookie);
                publicMethod.pageAlert("登录成功！");
                // 清除定时器
                clearInterval(qrCheck);
            }
        }, 3000)
    },

    // 获取验证码
    getCaptcha: async function(e){
        // 校验手机号格式 
        var regExp = new RegExp("^1[356789]\\d{9}$");
        if(phone.value != "" && regExp.test(phone.value)){     
            // 发送验证码
            let resp = await wymusicServer.sendCaptcha(phone.value);
            if(resp.code == 200){
                // 若发送成功，则保存手机号到配置项，用于登录时获取
                publicMethod.pageAlert("发送成功!");
            }else{
                // 发送失败，显示错误信息
                publicMethod.pageAlert(resp.msg);
            }
            // 进行倒计时，10秒后可再次发送验证码
            let second = 10;
            e.target.disabled = true;
            e.target.textContent = second;
            let sendTimer = setInterval(function(){
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
            publicMethod.pageAlert("手机号不正确!");
        }
    },

    // 验证码登录
    captchaLogin: async function(e){
        if(this.cookie == null){
            // 如果当前不存在cookie，则进行登录获取cookie
            if(phone.value != null && captcha.value != ""){
                // 先校验验证码是否正确
                let verify = await wymusicServer.verifyCaptcha(phone.value, captcha.value);
                if(verify.code == 200){
                    // 验证码正确，请求登录
                    let loginData = await wymusicServer.login(phone.value, captcha.value);
                    // 保存cookie
                    this.cookie = loginData.cookie;
                    localStorage.setItem("cookie", this.cookie);
                    // 登录成功后重新加载空闲歌单
                    this.loadSongList(this.songListId);
                    // 手机号保护
                    phone.value = "1_********" + phone.value.slice(8, 11);
                    // 登录成功后禁用手机号验证码功能
                    phone.disabled = true;
                    captcha.value = "";
                    captchaBtn.style.display = "none";
                    e.target.textContent = "退出登录";
                    clearInterval(loginAlert);
                }else{
                    publicMethod.pageAlert(verify.message);
                }
            }else{
                publicMethod.pageAlert("未输入手机号或者验证码！");
            }
        }else{
            // 若当前存在cookie信息，则进行退出登录
            // 发送退出登录请求
            wymusicServer.logout();
            // 清空手机号
            phone.value = "";
            // 删除本地cookie
            this.cookie = null;
            localStorage.removeItem("cookie");
            // 启用手机号验证码功能
            phone.value = "";
            phone.disabled = false;
            captcha.disabled = false;
            captchaBtn.style.display = "";
            e.target.textContent = "登录";
            publicMethod.pageAlert("已退出登录!");
        }  
    },

    // 账号登录
    accountLogin: async function(e){
        publicMethod.pageAlert("暂不支持!");
    },
    // cookie登录
    cookieLogin: async function(e){
        publicMethod.pageAlert("暂不支持!");
    },

    // 添加历史空闲歌单ID
    addFreeListIdHistory: function(listId){
         // 歌单ID查重
         for (let i = 0; i < this.freeListIdHistory.length; i++) {
            if(this.freeListIdHistory[i].platform == musicServer.platform && 
                this.freeListIdHistory[i].listId == listId){
                return;
            }
        }
        // 限长
        if(this.freeListIdHistory.length > 50){
            this.freeListIdHistory.shift();
        }

        // 添加歌单信息
        this.freeListIdHistory.push({
            platform: musicServer.platform,
            listId: listId,
            listName: listId
        });

        // 新建选项
        let elem_option = document.createElement('option');
        elem_option.value = listId;
        elem_option.textContent = listId;
        this.elem_freeListIdHistory.appendChild(elem_option);

        // 保存配置信息
        localStorage.setItem("freeSongList", JSON.stringify(this.freeListIdHistory));
    }
}