const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// 解析 JSON 和 URL-encoded 请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== 配置文件初始化 ====================
// 如果运行时配置不存在，则从 default 目录拷贝
if (!fs.existsSync('config/config.yaml')) {
    fs.copyFileSync('config/default/config.yaml', 'config/config.yaml');
    console.log('已从默认配置创建 config/config.yaml');
}
if (!fs.existsSync('config/webapi.js')) {
    fs.copyFileSync('config/default/webapi.js', 'config/webapi.js');
    console.log('已从默认配置创建 config/webapi.js');
}
// 将 webapi.js 拷贝到 public 目录供前端使用
fs.copyFileSync('config/webapi.js', 'src/public/webapi.js');

// 读取服务端配置
const yaml = require('yaml');
const configText = fs.readFileSync('config/config.yaml', 'utf8');
const config = yaml.parse(configText);

// 读取 webapi 配置
const webapiConfig = require('./config/webapi.js');

// 静态文件
app.use(express.static(path.join(__dirname, 'src/public')));

// ==================== 按需启动集成服务 ====================
/**
 * 判断服务地址是否为集成挂载路径
 * 挂载路径：以 "/" 开头的路径（如 "/bili-api"），由主服务直接挂载
 * 独立服务：完整的远程地址，主服务不启动该服务
 *   - 带协议：http://localhost:3300、https://api.example.com
 *   - 协议相对：//localhost:3300
 *   - 无协议主机：localhost:3300、127.0.0.1:3300、example.com:3300
 */
function isMountPath(url) {
    if (!url || typeof url !== 'string') return false;
    // 以 "/" 开头且不是 "//" 开头（// 开头是协议相对URL，属于外部地址）
    return url.startsWith('/') && !url.startsWith('//');
}

// B站开放平台 API
if (isMountPath(webapiConfig.bili_api)) {
    const encrypt = require('./src/utils/encrypt');
    const biliRouter = require('./src/routers/bili-router');
    // 设置秘钥
    encrypt.access_key_id = config.access_key_id || '';
    encrypt.access_key_secred = config.access_key_secred || '';
    // 设置服务
    const biliPath = webapiConfig.bili_api || '/bili-api';
    app.use(biliPath, biliRouter);
    console.log(`B站API服务已挂载：http://localhost:${config.web_server_port}${webapiConfig.bili_api }`);
} else {
    console.log(`B站API服务为独立服务：${webapiConfig.bili_api}`);
}

// 网易云音乐 API
if (isMountPath(webapiConfig.netease_api)) {
    const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi');
    const neteasePath = webapiConfig.netease_api || '/music-api';
    app.use(neteasePath, async (req, res) => {
        try {
            let apiPath = req.path.replace(/^\//, '').replace(/\//g, '_');
            const apiFunc = NeteaseCloudMusicApi[apiPath];
            if (!apiFunc) {
                return res.status(404).json({ error: `未知的网易云API: ${apiPath}` });
            }
            const query = { ...req.query, ...req.body };
            const result = await apiFunc(query);
            res.status(result.status).json(result.body);
        } catch (error) {
            console.error('网易云API调用失败:', error);
            res.status(500).json({ error: error.message });
        }
    });
    console.log(`网易云音乐API服务已挂载：http://localhost:${config.web_server_port}${webapiConfig.netease_api}`);
} else {
    console.log(`网易云音乐API服务为独立服务：${webapiConfig.netease_api}`);
}

// 监听端口
app.listen(config.web_server_port, () => {
    console.log(`服务已启动：http://localhost:${config.web_server_port}`);
});