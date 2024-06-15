import { orderConfig } from "./components/orderConfig.js";
import { login } from "./components/login.js";
import { player } from "./components/player.js";


window.onload = function (){
    
    // 设置界面导航
    let elem_menu = document.getElementById('menu');
    let elem_pages = document.getElementById('pages');
    for (let i = 0; i < elem_menu.children.length; i++) {
        const btn = elem_menu.children[i];
        btn.onclick = () => {
            elem_pages.style.left = -(520 * i) + "px";
        }
    }
    window.ppp = player;
    // 1、初始化点歌配置
    orderConfig.init();

    // 2、初始化播放器模块
    player.init();
    
    // 3、初始化登录模块 
    login.init();
    
    // 4、初始化
    
}