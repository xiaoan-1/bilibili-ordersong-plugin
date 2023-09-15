import { player } from './components/player.js';
import { config } from './components/config.js';
import { webSocket } from './components/websoket.js';

window.onload = function(){
    // 1. 初始化播放器
    player.init();
      
    // 2. 初始化配置项
    config.init();

    // 3. 初始化webSocket对象
    let initSuccess = webSocket.init();

    // 4. 若初始化成功,打开websoket连接直播间
    if(initSuccess){
        webSocket.open();
    } 
}








