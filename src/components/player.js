import { config } from "./config.js";
import { musicMethod } from "./public/method.js";

/* 播放器对象 
    用于控制歌曲的添加、播放等
*/
export const player = {
    //  音频对象
    audio: new Audio(),
    
    // 用户点歌队列
    orderList: [],
    elem_orderList: document.getElementById('orderList'),

    // 空闲歌单列表 
    freeList: [],
    
    // 空闲歌单列表的播放索引
    freeIndex: 0, 

    // 随机队列，防止随机重复
    randomList: [],

    // 歌曲播放时音量淡入，降低卡顿影响
    playFadeIn: null,

    // 初始化播放器
    init: function(){

        // 播放器添加事件监听
        this.addListener();
        
        musicMethod.pageAlert("已初始化播放器!");
    },

    // 播放歌曲
    play: function(song){
        // 设置播放链接
        this.audio.src = song.url;

        /*----------------------------音量淡入-------------------------------*/
        if(this.playFadeIn){
            clearInterval(this.playFadeIn);
            this.playFadeIn = null;
        }
        this.audio.volume = 0;
        this.playFadeIn = setInterval(function(){
            /* 
                此处有两个注意点
                1. 此处若自增 0.1 会出现精度问题，0.1 + 0.2 不等于 0.3
                2. setInterval为全局函数，无法使用 this 指定对象
                */
            player.audio.volume = (player.audio.volume * 10 + 1) / 10;
            if(player.audio.volume == 1){
                clearInterval(player.playFadeIn);
                player.playFadeIn = null;
            }
        }, 300);
        /*----------------------------音量淡入-------------------------------*/
        
        // 播放
        this.audio.play();
    },

    // 播放下一首
    playNext: function(){
        if(this.orderList.length > 0){
            // 若点歌列表存在歌曲，则删除第一首
            this.orderList.shift();
            this.elem_orderList.firstElementChild.remove();
            
        }
        if(!this.orderList.length){
            // 若点歌列表没有歌曲，则随机播放空闲歌单的歌曲
            if(!this.freeList.length){
                musicMethod.pageAlert("没有下一首可以放了>_<!");
                return;
            }
            // 随机检测，减小重复几率
            while(true)
            {
                this.freeIndex = parseInt(Math.random() * this.freeList.length, 10);
                if(!this.randomList.includes(this.freeIndex))
                {
                    // 在末尾添加随机记录
                    this.randomList.push(this.freeIndex);
                    // 如果随机记录大于一半，就删除第一个，(队列结构)
                    if(this.randomList.length > this.freeList.length / 2)
                    {
                        this.randomList.shift();
                    }
                    break;
                }
            }
            this.addOrder(this.freeList[this.freeIndex++]);
        }
        
        // 播放当前第一首歌曲
        this.play(this.orderList[0].song)
    },

    // 添加点歌对象
    addOrder: function(order){
        // 检查点歌信息
        if(!this.checkOrder(order)){
            return;
        }

        // 点歌成功，添加点歌信息到点歌列表中
        this.orderList.push(order);
        
        // 页面同步添加
        var tr = document.createElement('tr');
        tr.innerHTML = `<td>${order.song.sname}</td>
            <td>${order.song.sartist}</td>
            <td>${order.uname}</td></td>`
        this.elem_orderList.appendChild(tr);

        // 同时存储到配置项的历史用户列表、历史点歌列表中
        config.addUserHistory({
            uid: order.uid,
            uname: order.uname,
        });

        config.addSongHistory({
            sid: order.song.sid,
            sname: order.song.sname,
        });
    },

    // 检查点歌信息
    checkOrder: function(order){
        // 检查歌曲链接是否存在
        if(!order.song.url || order.song.url == ""){
            musicMethod.pageAlert("歌曲链接丢失啦~");
            return false;
        }

        // 查询用户是否被拉入黑名单
        for (let i = 0; i < config.userBlackList.length; i++) {
            if(config.userBlackList[i].uid == order.uid){
                musicMethod.pageAlert("你已被加入暗杀名单!(▼へ▼メ)!");
                return false;
            }
        }
        
        // 用户点歌数是否已达上限
        if(this.orderList.filter(value => value.uid == order.uid).length >= config.userOrder){
            musicMethod.pageAlert("你点太多啦，歇歇吧>_<!");
            return false;
        }

        // 最大点歌数是否已达上限
        if(this.orderList.length >= config.maxOrder){
            musicMethod.pageAlert("我装不下更多的歌啦>_<!");
            return false;
        }
        
        // 查询歌曲是否被拉入黑名单
        for (let i = 0; i < config.songBlackList.length; i++) {
            if(config.songBlackList[i].sid == order.song.sid){
                musicMethod.pageAlert("请不要乱点奇怪的歌!(▼ヘ▼#)");
                return false;
            }
        }     
        
        // 判断该歌曲是否已在点歌列表
        if(this.orderList.some(value => value.song.sid == order.song.sid)){
            musicMethod.pageAlert("已经点上啦!>_<!");
            return false;
        }

         // 该歌曲是否有歌曲时长限制，且歌曲时长是否超出规定时长
        if(config.maxDuration > 0 && order.song.duration > config.maxDuration){
            musicMethod.pageAlert("你点的歌时太长啦!>_<");
            return false;
        }

        return true; 
    },

    // 播放器添加事件监听
    addListener: function(){
        // 1. 开始播放事件
        this.audio.addEventListener("play", () => {
            let dot = document.getElementsByClassName('dot')[0]; 
            // 设置闪烁动画
            if (!dot.classList.contains("dot_blink")) {
                dot.classList.add("dot_blink");
            }
        });
        // 2. 暂停播放事件
        this.audio.addEventListener("pause", () => {
            let dot = document.getElementsByClassName('dot')[0]; 
            // 设置闪烁动画
            if (!dot.classList.contains("dot_blink")) {
                dot.classList.remove("dot_blink");
            }
        });
        // 3. 播放时间更新事件
        this.audio.addEventListener("timeupdate", () => {
            let progress = document.getElementsByClassName('progress_bar')[0];
            // 页面进度条实时修改
            progress.style.width = ((this.audio.currentTime / this.audio.duration) * 280) + "px";
            // 超过歌曲限长则自动播放下一首
            if (config.overLimit > 0 && this.audio.currentTime > config.overLimit) {
                this.playNext();
            }
        });
        // 4. 播放结束事件
        this.audio.addEventListener("ended", () => {  
            // 播放下一首歌曲
            this.playNext();
        });
        // 5. 播放失败事件
        this.audio.addEventListener("error", () => {
            musicMethod.pageAlert("播放错误，即将播放下一首...");
            setTimeout(() =>{
                // 播放下一首歌曲
                this.playNext();  
            }, 3000);
        });
    },

}


