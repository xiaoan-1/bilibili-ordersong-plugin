const voice = {
    // 音频播放器
    audio: null,
    
    // 定时器
    timer: null,

    // 播放器音频角色
    name: "可莉",

    // 开关
    switch: false,
}

function InitVoice(){
    // 播放器对象
    voice.audio = new Audio();

    // 定时器函数
    voice.play = async function(){
        if(this.audio){
            this.audio.src = await genshinVoiceServer.getVoiceUrl(this.name);
            if(this.audio.src){
                this.audio.play();
            }else{
                // 移除监听
                voice.audio.removeEventListener("ended", voice.timer);
                musicMethod.pageAlert("声音大概是被派蒙吃了吧>_<!");
            }
        }else{
            
            musicMethod.pageAlert("播放器未初始化!");
        }
    }

    voice.timer = async function(){
        setTimeout(() => voice.play(), 5 * 1000);
    }
}

function genshinVioce(userDanmu){
    let danmu = userDanmu.danmu.trim();
    
    if(danmu.slice(0, 2) == "配音"){
        // 获取弹幕指令
        let keyword = danmu.slice(2).trim();
        if(keyword == "开" && userDanmu.uid == config.adminId){     
            if(!voice.switch){    
                voice.switch = true;
                // 开启时启动播放
                voice.play();
                // 添加播放结束监听，每次播放完后继续播放实现循环播放
                voice.audio.addEventListener("ended", voice.timer);
            }
        }else if(keyword == "关" && userDanmu.uid == config.adminId){
            if(voice.switch){
                voice.audio.pause();
                voice.switch = false;
                // 移除监听
                voice.audio.removeEventListener("ended", voice.timer);
            }
        }else{
            // 设置角色
            voice.name = keyword;
        }
    }
}

