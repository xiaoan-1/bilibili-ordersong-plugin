import orderConfiger from "./order-configer.js";
import publicMethod from "../utils/public-method.js";
import musicServer from "../services/musicServers/music-server.js";

/**
 * 音乐播放器
 * 包括播放、暂停、下一首等功能
 */
class MusicPlayer {
    //  音频对象
    audio = new Audio();

    // 用户点歌队列
    orderList = [];
    elem_orderList = document.getElementById('orderList');

    // 空闲歌单播放索引
    idleIndex = 0;

    // 空闲歌单列表 
    idleSongList = [];

    // 歌曲播放时音量淡入，降低卡顿影响
    playFadeIn = null;

    constructor() {
        this.addListener();
        console.log("音乐播放器初始化完成");
    }

    // 播放器添加事件监听
    addListener() {
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
            if (orderConfiger.overLimitSkip > 0 && this.audio.currentTime > orderConfiger.overLimitSkip) {
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
            publicMethod.pageAlert("播放错误，即将播放下一首...");
            setTimeout(() => {
                // 播放下一首歌曲
                this.playNext();
            }, 6000);
        });
    }

    // 播放歌曲
    async play(song) {

        // 根据平台查询歌曲链接
        const songurl = await musicServer.getServer(song.platform).getSongUrl(song.sid);

        if (!songurl) {
            publicMethod.pageAlert("获取歌曲链接失败，即将播放下一首...");
            return;
        }

        this.audio.src = songurl;

        /*----------------------------音量淡入-------------------------------*/
        if (this.playFadeIn) {
            clearInterval(this.playFadeIn);
            this.playFadeIn = null;
        }
        /*
            此处有两个注意点
            1. 此处若自增 0.1 会出现精度问题，0.1 + 0.2 不等于 0.3
            2. setInterval为全局函数，需要用箭头函数来保证this的指向
        */
        this.audio.volume = 0;
        this.playFadeIn = setInterval(() => {
            this.audio.volume = (this.audio.volume * 10 + 1) / 10;
            if (this.audio.volume == 1) {
                clearInterval(this.playFadeIn);
                this.playFadeIn = null;
            }
        }, 300);
        /*----------------------------音量淡入-------------------------------*/

        // 播放
        this.audio.play();
    }

    // 播放下一首
    playNext() {
        if (this.orderList.length > 0) {
            // 若点歌列表存在歌曲，则删除第一首
            this.orderList.shift();

            // 页面同步删除第一个点歌项
            const elem = this.elem_orderList.children[0];

            // 设置删除动画效果
            elem.style.animation = "fadeOut 1s forwards";

            // 延迟删除，等待动画完成
            setTimeout(() => {
                // 删除点歌项
                elem.remove();
                // 所有点歌项位置上移动一个单位
                for (let j = 0; j < this.elem_orderList.children.length; j++) {
                    const elem_other = this.elem_orderList.children[j];
                    elem_other.style.top = (elem_other.offsetTop - 40) + "px";
                }
                this.elem_orderList.style.height = (this.orderList.length * 40) + "px";
            }, 1000);
        }

        // 若点歌列表还有歌曲，则直接播放第一首
        if (this.orderList.length) {
            this.play(this.orderList[0].song);
            return;
        }

        // 若点歌列表没有歌曲，则随机播放空闲歌单的歌曲            
        if (!this.idleSongList.length) {
            publicMethod.pageAlert("没有下一首可以放了>_<!");
            return;
        }

        // 随机播放
        if (this.idleIndex == this.idleSongList.length - 1) {
            // 洗牌空闲歌单
            this.idleSongList = publicMethod.shuffle(this.idleSongList);
        }
        this.idleIndex = (++this.idleIndex) % this.idleSongList.length;

        // 将空闲歌单的歌曲添加到点歌列表中
        this.addOrder(this.idleSongList[this.idleIndex]);

        // 播放当前第一首歌曲
        this.play(this.orderList[0].song)
    }

    // 添加点歌对象
    addOrder(order) {
        // 检查点歌信息
        if (!this.checkOrder(order)) {
            return;
        }

        // 点歌成功，添加点歌信息到点歌列表中
        this.orderList.push(order);

        // 页面同步添加点歌项
        this.elem_orderList.style.height = (this.orderList.length * 40) + "px";
        let tr = document.createElement('tr');
        tr.innerHTML = `<td>${order.song.sname}</td>
                <td>${order.song.sartist}</td>
                <td>${order.uname}</td></td>`;
        tr.style.top = (40 + (this.elem_orderList.children.length - 1) * 40) + "px"
        tr.style.animation = "fadeIn 1s forwards";
        this.elem_orderList.appendChild(tr);

        // 同时存储到配置项的历史用户列表、历史点歌列表中，忽略空闲歌单歌曲
        if (order.uid != 0) {
            orderConfiger.addUserHistory({
                uid: order.uid,
                uname: order.uname,
            });

            orderConfiger.addSongHistory({
                sid: order.song.sid,
                sname: order.song.sname,
            });
        }
    }

    // 检查点歌信息
    checkOrder(order) {
        // 查询用户是否被拉入黑名单
        for (let i = 0; i < orderConfiger.userBlackList.length; i++) {
            if (orderConfiger.userBlackList[i].uid == order.uid) {
                publicMethod.pageAlert("你已被加入暗杀名单!(▼へ▼メ)!");
                return false;
            }
        }

        // 用户点歌数是否已达上限
        if (this.orderList.filter(value => value.uid == order.uid).length >= orderConfiger.userMaxOrder) {
            publicMethod.pageAlert("你点太多啦，歇歇吧>_<!");
            return false;
        }

        // 全局点歌数是否已达上限
        if (this.orderList.length >= orderConfiger.globalMaxOrder) {
            publicMethod.pageAlert("我装不下更多的歌啦>_<!");
            return false;
        }

        // 查询歌曲是否被拉入黑名单
        for (let i = 0; i < orderConfiger.songBlackList.length; i++) {
            if (orderConfiger.songBlackList[i].sid == order.song.sid) {
                publicMethod.pageAlert("请不要乱点奇怪的歌!(▼ヘ▼#)");
                return false;
            }
        }

        // 判断该歌曲是否已在点歌列表
        if (this.orderList.some(value => value.song.sid == order.song.sid)) {
            publicMethod.pageAlert("已经点上啦!>_<!");
            return false;
        }

        // 该歌曲是否有歌曲时长限制，且歌曲时长是否超出规定时长
        if (orderConfiger.orderMaxDuration > 0 && order.song.duration > orderConfiger.orderMaxDuration) {
            publicMethod.pageAlert("你点的歌时太长啦!>_<");
            return false;
        }

        return true;
    }
}

export default new MusicPlayer();