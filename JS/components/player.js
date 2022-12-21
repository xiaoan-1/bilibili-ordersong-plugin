/* 播放器对象 */
const player = {
    //  音频对象
    audio: null,
    
    // 页面元素
    elem: null,

    // 用户点歌列表
    orderList: [],

    // 空闲歌单列表 
    freeList: [],

    // 空闲歌单列表的播放索引
    freeIndex: 0, 

    // 点歌历史用户
    userHistory: [],

    // 点歌历史歌曲
    songHistory: [],

    // 随机队列，防止随机重复
    randomList: [],

    // 歌曲播放时音量淡入，降低卡顿影响
    playFadeIn: null,
}
function initPlayer(){
    // 创建音频对象
    player.audio = new Audio();  
    // 绑定页面元素
    player.elem = document.getElementById('songList');

    // 添加点歌方法
    player.addOrder = function(order){
        // 添加点歌信息到点歌列表中
        this.orderList.push(order);
        // 页面同步添加
        var tr = document.createElement('tr');
        tr.innerHTML = `<td>${order.song.sname}</td>
            <td>${order.song.sartist}</td>
            <td>${order.uname}</td></td>`
        this.elem.appendChild(tr);
        
        // 添加用户历史记录
        configMethod.addUserHistory({
            uid: order.uid,
            uname: order.uname 
        })
        // 添加歌曲历史记录
        configMethod.addSongHistory({
            sid: order.song.sid,
            sname: order.song.sname
        })
       
    }
    // 播放歌曲方法
    player.play = async function(songId){
        if(player.audio){
            this.audio.src = await musicServer.getSongUrl(songId);
            if(this.audio.src){
                // 音量淡入
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
                }, 400);
                // 播放
                this.audio.play();
            }else{
                musicMethod.pageAlert("歌曲链接被吃了>_<!");
            }
        }else{
            musicMethod.pageAlert("播放器未初始化!");
        }
    }
    // 播放下一首方法
    player.playNext = function(){
        // 播放下一首时，如果点歌列表存在歌曲，则删除第一首
        if(this.orderList.length > 0){
            this.orderList.shift();
            this.elem.firstElementChild.remove();
        }
        // 点歌列表没有歌曲，则播放空闲歌单的歌曲
        if(this.orderList.length == 0){
            // 点歌列表没有歌曲时，则随机播放空闲歌单的歌曲
            if(this.freeList.length > 0){
                while(true)
                {
                    this.freeIndex = parseInt(Math.random() * this.freeList.length, 10);
                    // 随机检测，避免随机重复
                    if(!this.randomList.includes(this.freeIndex))
                    {
                        // 在末尾添加随机记录
                        this.randomList.push(this.freeIndex);
                        // 如果随机记录大于一半，就删除第一个，实现队列结构
                        if(this.randomList.length > this.freeList.length / 2)
                        {
                            this.randomList.shift();
                        }
                        break;
                    }
                }
                this.addOrder(this.freeList[this.freeIndex++]);
                this.play(this.orderList[0].song.sid);
            }else{
                musicMethod.pageAlert("没有下一首可以放了>_<!");
            }
        }else {           
            // 播放删除后的当前第一首歌曲
            this.play(this.orderList[0].song.sid)
        }
    }

    // 1. 开始播放事件
    player.audio.addEventListener("play", function () {
        let dot = document.getElementsByClassName('dot')[0]; 
        // 设置闪烁动画
        if (!dot.classList.contains("dot_blink")) {
            dot.classList.add("dot_blink");
        }
    });
    // 2. 暂停播放事件
    player.audio.addEventListener("pause", function () {
        let dot = document.getElementsByClassName('dot')[0]; 
        // 设置闪烁动画
        if (!dot.classList.contains("dot_blink")) {
            dot.classList.remove("dot_blink");
        }
    });
    // 3. 播放时间更新事件
    player.audio.addEventListener("timeupdate", function () {
        let progress = document.getElementsByClassName('progress_bar')[0];
        // 页面进度条实时修改
        progress.style.width = ((player.audio.currentTime / player.audio.duration) * 280) + "px";
    });
    // 4. 播放结束事件
    player.audio.addEventListener("ended", function(){  
        // 播放下一首歌曲
        player.playNext();
    });
    // 5. 播放失败事件
    player.audio.addEventListener("error", function(){  
        // 播放下一首歌曲
        player.playNext();
        musicMethod.pageAlert("播放错误，播放下一首");
    });
    musicMethod.pageAlert("已初始化播放器!");
}

