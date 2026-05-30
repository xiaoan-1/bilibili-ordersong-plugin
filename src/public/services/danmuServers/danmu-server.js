import BilibiliServer from "./bilibili-server.js";

/**
 * 弹幕服务器
 */
class DanmuServer {

    // 默认bilibili弹幕
    platform = "bilibili";

    // 弹幕服务对象
    serverObj = new BilibiliServer();

    // 切换弹幕平台
    changePlatform(platform) {
        if (platform == "bilibili") {
            this.platform = platform;
            this.serverObj = new BilibiliServer();
            return true;
        } else {
            console.log("不支持该弹幕平台");
            return false;
        }
    }
}

export default new DanmuServer;