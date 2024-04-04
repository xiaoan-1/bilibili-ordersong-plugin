import { player } from './components/player.js';
import { config } from './components/config.js';
import { webSocket } from './components/websoket.js';

window.onload = function(){
    // 1. 初始化播放器
    player.init();
      
    // 2. 初始化配置项
    config.init();

    // 3. 初始化webSocket对象
    webSocket.init();
}








