import { config } from "./components/config.js";
import { danmu } from "./components/danmu.js";
import { login } from "./components/login.js";
import { player } from "./components/player.js";
import { setting } from "./components/setting.js";

window.onload = function (){
    
    // 设置界面导航
    setting.init();

    // 1、初始化点歌配置
    config.init();

    // 2、初始化播放器模块
    player.init();
    
    // 3、初始化登录模块 
    login.init();
    
    // 4、初始化弹幕服务器
    danmu.init();
}
// 测试
window.danmu = danmu;
// danmu.identifyDanmuCommand({
//     uid: "123456",
//     uname: "测试用户",
//     danmu: "点歌晴天"
// });