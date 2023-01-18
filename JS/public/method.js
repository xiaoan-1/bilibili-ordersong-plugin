
/* 用于处理点歌信息的函数 */
const musicMethod = {
    // 设置仅可访问的歌曲对象（好像也没必要^_^）
    getSongObject: function(value){
        let object = new Object();
        Object.defineProperties(object, {
            'sid':{
                value: value.sid,
                enumerable: true
            },
            'sname':{
                value: value.sname,
                enumerable: true
            },
            'sartist':{
                value: value.sartist,
                enumerable: true
            },
            'duration':{
                value: value.duration,
                enumerable: true
            }
        })
        return object;
    },
    // 验证点歌用户信息
    checkUser: function(uid){
        // 查询该用户是否被拉入黑名单
        for (let i = 0; i < config.userBlackList.length; i++) {
            if(config.userBlackList[i].uid == uid){
                this.pageAlert("你已被加入暗杀名单!(▼へ▼メ)!");
                return false;
            }
        }
        if(player.orderList.filter(value => value.uid == uid).length >= config.userOrder){
            // 用户点歌数是否已达上限
            this.pageAlert("你点太多啦，歇歇吧>_<!");
            return false;
        }else if(player.orderList.length >= config.maxOrder){
            // 最大点歌数是否已达上限
            this.pageAlert("我装不下更多的歌啦>_<!");
            return false;
        }
        return true;
    },
    // 验证点歌歌曲信息
    checkOrder: async function(order){
        // 查询该歌曲是否被拉入黑名单
        for (let i = 0; i < config.songBlackList.length; i++) {
            if(config.songBlackList[i].sid == order.song.sid){
                this.pageAlert("不要乱点奇怪的歌!(▼ヘ▼#)");
                return false;
            }
        }     
        if(player.orderList.some(value => value.song.sid == order.song.sid)){
            // 判断该歌曲是否已在点歌列表
            this.pageAlert("已经点上啦!>_<!");
            return false;
        } else if(config.overLimit <= 0 && order.song.duration > config.maxDuration){
            // 该歌曲是否无歌曲限制，且歌曲时长超出规定,
            this.pageAlert("你点的歌时太长啦!>_<");
            return false
        }else if(!await musicServer.getSongUrl(order.song.sid)){
            // 该歌曲url是否存在
            this.pageAlert("虽然找到了,但是放不出来>_<");
            return false;
        }
        return true;
    },
    // 页面提示输出
    pageAlert: function(str){
        let alertBox = document.getElementsByClassName("alertBox")[0];
        let div = document.createElement('div');
        div.textContent = str;
        div.className = "text";
        alertBox.appendChild(div);
        setTimeout(function(){
            div.remove();
        }, 7000)
    },
}

