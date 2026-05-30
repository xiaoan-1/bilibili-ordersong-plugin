//  ---web客户端API地址配置---
// 相对路径（如 "/bili-api"）表示该服务集成在主服务中，会自动启动
// 完整URL（如 "http://localhost:3300"）表示该服务独立运行，主服务不会启动它
const API_CONFIG = {
    // B站开放平台API
    bili_api: "/bili-api",
    // 网易云音乐API
    netease_api: "/netease_api",
    // QQ音乐API
    qqmusic_api: "http://localhost:3300"
};

// 浏览器环境
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
}

// Node.js环境
if (typeof module !== 'undefined') {
    module.exports = API_CONFIG;
}