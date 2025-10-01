// 读取秘钥
const fs = require('fs');
const yaml = require('yaml');
const encrypt = require('./tool/encrypt');
const configPath = require('path').join(__dirname, '../config/config.yaml');
if (!fs.existsSync(configPath)) {
    const defaultConfigPath = require('path').join(__dirname, '../config/config_default.yaml');
    if (fs.existsSync(defaultConfigPath)) {
        fs.copyFileSync(defaultConfigPath, configPath);
        console.log("config.yaml文件不存在，已从config_default.yaml生成config.yaml文件");
    } else {
        console.log("config_default.yaml文件不存在，无法生成config.yaml文件");
    }
    console.log("请前往config目录下修改配置");
    process.exit(1);
}
const file = fs.readFileSync(configPath, 'utf8');
const config = yaml.parse(file);
encrypt.access_key_id = config.access_key_id || "";
encrypt.access_key_secred = config.access_key_secred || "";

if (!encrypt.access_key_id || !encrypt.access_key_secred) {
    console.log("config.yaml文件配置不完整");
    process.exit(1);
}

// 引入Koa相关中间件
const Koa = require('koa');
const cors = require('koa2-cors');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const router = require('./routers/router');
const defaultConfigPath = require('path').join(__dirname, '../config/config_default.yaml');

// init
const app = new Koa();

// 开启跨域
app.use(cors());

// 开启logger
app.use(logger());

// 开启bodyParser
app.use(bodyParser());

// 开启router
app.use(router.routes())
app.use(router.allowedMethods())
app.use(async ctx => {
    ctx.body = "bilibili创作者服务中心"
})

// B站弹幕开放平台转发服务
const serverPort = config.bili_server_port || 3100;
app.listen(serverPort, () => {
    console.log(`bilili-open-api is running on http://localhost:${serverPort}`);
})