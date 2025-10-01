const express = require('express');
const path = require('path');
const expressApp = express();

// 生成配置文件
const fs = require('fs');
const webapiFile = require('path').join(__dirname, './src/webapi.js');
if (!fs.existsSync(webapiFile)) {
    const defaultWebapiFile = require('path').join(__dirname, './config/webapi_default.js');
    if (fs.existsSync(defaultWebapiFile)) {
        fs.copyFileSync(defaultWebapiFile, webapiFile);
        console.log("webapi.js文件不存在，已从webapi_default.js生成webapi.jsl文件");
    } else {
        console.log("webapi_default.js文件不存在，无法生成webapi.js文件");
    }
}

const staticDir = path.join(__dirname, 'src');
expressApp.use(express.static(staticDir));

expressApp.get('/', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'))
});


let serverPort = 8000;
// 读取配置文件端口号，若不存在则使用默认端口8000
const configPath = require('path').join(__dirname, './config/config.yaml');
if (fs.existsSync(configPath)) {
    const yaml = require('yaml');
    const file = fs.readFileSync(configPath, 'utf8');
    const config = yaml.parse(file);
    if (config.web_server_port) {
        serverPort = config.web_server_port;
    }
}

expressApp.listen(serverPort, () => {
    console.log(`Web server is running at http://localhost:${serverPort}`);
});
