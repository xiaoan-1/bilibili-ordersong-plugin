window.onload = function(){
    // 1. 初始化播放器
    initPlayer();
      
    // 2. 初始化配置项
    initConfig();

    // 3. 初始化webSocket对象
    let initSuccess = initSocket();
    
    // 扩展
    InitVoice();

    // 4. 若初始化成功,打开websoket连接直播间
    if(initSuccess){
        openWebSocket();
    } 
}


/*  识别弹幕命令
    @param: userDanmu 包括用户id、用户名、用户弹幕
*/
async function identifyDanmuCommand(userDanmu){
    let danmu = userDanmu.danmu.trim();
    // 点歌命令，触发点歌流程
    if (danmu.slice(0, 2) == "点歌" && musicMethod.checkUser(userDanmu.uid)) {
        // 获取点歌关键词
        let keyword = danmu.slice(2).trim();
        // 根据关键词通过API查询歌曲信息
        let song = await musicServer.getSongInfo(keyword);  
        if(song){
            // 封装点歌信息
            let order = {
                uid: userDanmu.uid,
                uname: userDanmu.uname,
                song: song
            }
            if(await musicMethod.checkOrder(order)){ 
                // 添加点歌信息到点歌列表  
                player.addOrder(order);

                // 如果当前点歌列表第一首是空闲歌单，则播放下一首
                if(player.orderList.length > 0 && player.orderList[0].uname == "空闲歌单"){
                    player.playNext();
                }
            }            
            // 如果当前播放没有播放歌曲，则开始播放第一首歌
            if(player.audio.paused && player.orderList.length > 0){
                player.play(player.orderList[0].song.sid);
            }
        }else{
            musicMethod.pageAlert("挺好听的，虽然我没找到<(▰˘◡˘▰)>");
        }      
    } else if (danmu == "切歌") { 
        // 切歌命令，触发切歌流程
        if(player.orderList[0].uid == userDanmu.uid || userDanmu.uid == config.adminId){
            // 如果当前播放的是该用户的歌曲，或者发送命令的是管理员，则播放下一首歌曲
            player.playNext();
        }else{
            musicMethod.pageAlert("不能切别人点的歌哦(^o^)");
        }
    }else{
        test(userDanmu);
    }
}









