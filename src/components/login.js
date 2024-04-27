import { config } from "./config.js";
import { musicMethod } from "../public/method.js";

/* 设置对象
    用于为用户提供界面上的配置功能
*/
export const login = {


    platform: ["qq", "wy"],

    loginType: [],

    // 初始化登录信息
    init: async function(){
        
        // 设置服务器的cookie数据
        

        // 增加登录相关的用户操作事件监听

        this.loadSongList(this.songListId);
        
        musicMethod.pageAlert("已初始化登录");
    }, 

    // 读取配置数据到设置页面中
    setServerCookie: async function(){

        let phone = document.getElementById('phone');
        let captcha = document.getElementById('captcha'); 
        let captchaBtn = document.getElementById('getCaptcha'); 
        
        // 获取用户登录状态
        if(this.cookie && this.cookie != ""){ 
            let btnLogin = document.getElementById('login');
            // 获取登录的用户信息
            let loginStatus = await wymusicServer.loginStatus();
            if(loginStatus.code == 200){
                // 获取当前cookie登录的手机号（隐藏信息）
                phone.value = loginStatus.account.userName; 
                // 仅退出登录
                phone.disabled = true;
                captcha.disabled = true;
                captchaBtn.style.display = "none";
                btnLogin.textContent = "退出登录";
                document.getElementById('qrInfo').value = "已登录";
                document.getElementById('qrLogin').textContent = "退出登录";
            }else{
                musicMethod.pageAlert("登录失败!");
            }
        }else{
            
            musicMethod.pageAlert("用户未登录, 可能无法播放歌曲!");
            
            // ------------待修改为游客登录--------
            // this.cookie = wymusicServer.anonimous();
        }
        // 加载歌单
        document.getElementById('loadSongList').onclick = async (e) =>{
            let listId = parseInt(songListId.value);
            if(!listId || this.songListId == listId){
                
                musicMethod.pageAlert("未修改歌单ID");
                return;
            }
            this.loadSongList(listId);
        };
    },

    // 给页面配置项添加点击事件
    addEvent: function(){
        // 获取验证码（已失效）
        captchaBtn.onclick = async function(e){
            // 校验手机号格式 
            var regExp = new RegExp("^1[356789]\\d{9}$");
            if(phone.value != "" && regExp.test(phone.value)){     
                // 发送验证码
                let resp = await wymusicServer.sendCaptcha(phone.value);
                if(resp.code == 200){
                    // 若发送成功，则保存手机号到配置项，用于登录时获取
                    musicMethod.pageAlert("发送成功!");
                }else{
                    // 发送失败，显示错误信息
                    musicMethod.pageAlert(resp.msg);
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
                musicMethod.pageAlert("手机号不正确!");
            }
        }
        // 手机号登录（已失效）
        document.getElementById('login').onclick = async (e) => {
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
                        musicMethod.pageAlert(verify.message);
                    }
                }else{
                    musicMethod.pageAlert("未输入手机号或者验证码！");
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
                musicMethod.pageAlert("已退出登录!");
            }  
        }
        // 网易二维码登录
        let qrCheck = null;
        document.getElementById('qrLogin').onclick = async (e) =>{
            if(!this.cookie || this.cookie == ""){
                // 二维码图片
                let qrImg = document.getElementById('qrImg'); 
                if(qrImg.style.display == "block"){
                    // 如果二维码已经显示，则隐藏并取消上一次轮询请求
                    clearInterval(qrCheck);
                    qrImg.style.display = "none";
                    return;
                }

                // 首先要获取二维码的key
                let unikey = await wymusicServer.getQrKey();
                // 用二维码key获取二维码图片
                let url = await wymusicServer.getQrPicture(unikey);
                // 显示二维码
                qrImg.style.display = "block";
                qrImg.setAttribute("src", url);
                
                // 轮询二维码状态
                qrCheck = setInterval(async () => {
                    let data = await wymusicServer.checkQrStatus(unikey);
                    if (!data) {
                        qrImg.style.display = "none";
                        musicMethod.pageAlert("请求失败!");
                        clearInterval(qrCheck);
                    }
                    if(data.code == 800){
                        // 二维码过期
                        qrImg.style.display = "none";
                        musicMethod.pageAlert("二维码已过期");
                        clearInterval(qrCheck);
                    }else if(data.code == 803){
                        // 授权成功
                        qrImg.style.display = "none";
                        // 保存cookie
                        this.cookie = data.cookie;
                        localStorage.setItem("cookie", this.cookie);
                        // 登录成功后重新加载空闲歌单
                        this.loadSongList(this.songListId);
                        e.target.textContent = "退出登录";
                        document.getElementById('qrInfo').value = "已登录";
                        musicMethod.pageAlert("登录成功");
                        // 清除定时器
                        clearInterval(qrCheck);
                        clearInterval(loginAlert);
                    }
                }, 3000)

            }else{
                // 若当前存在cookie信息，则进行退出登录
                // 发送退出登录请求
                wymusicServer.logout();
                // 清空手机号
                phone.value = "";
                // 删除本地cookie
                this.cookie = "";
                document.cookie = "";
                localStorage.removeItem("cookie");
                // 启用手机号验证码功能
                e.target.textContent = "二维码登录";
                document.getElementById('qrInfo').value = "请扫码登录";
                musicMethod.pageAlert("已退出登录!");
            }  
        };
        // QQ音乐设置cookie（仅临时设置）
        document.getElementById('qSetCookie').onclick = async (e) =>{
            let qqcookie = document.getElementById('cookie')
            qqmusicServer.setCookie(qqcookie.value);
        };

    },

    // 加载空闲歌单
    loadSongList: async function(listId){
        if(!listId){
            musicMethod.pageAlert("歌单Id无效!");
            return;
        }
        // 获取新的歌单
        let songList = await wymusicServer.getSongList(listId);
        if(!songList.length){
            musicMethod.pageAlert("歌单列表获取失败!");
            return false;
        }
        player.freeList = songList;
        
        document.getElementById('songListId').value = listId;
        // 获取歌单成功后保存配置项
        this.songListId = listId;
        localStorage.setItem("songListId", this.songListId);
        // 添加歌单到历史记录中
        this.addSongListHistory(listId);
        // 加载完成后自动播放下一首
        player.playNext();
        musicMethod.pageAlert("已获取空闲歌单列表!");
    },

}