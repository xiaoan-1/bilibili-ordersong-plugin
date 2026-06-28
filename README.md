# B站直播姬点歌H5插件

为B站直播间提供观众弹幕点歌功能，支持网易云音乐、QQ音乐。

## 项目介绍

本插件是一个基于 H5 的直播间点歌组件，可嵌入直播姬、OBS 等直播软件的浏览器源中使用。观众通过发送弹幕指令即可点歌，插件自动获取歌曲资源并播放。

主要功能：
- 支持观众弹幕点歌、切歌、暂停、播放控制、空闲歌单自动播放
- 可设置用户点歌数、全局点歌数、歌曲时长限制、用户/歌曲黑名单管理
- B站开放平台弹幕对接、支持网易云音乐（集成）、QQ音乐（自行部署）
- API服务支持集成挂载或独立部署

## 部署
### 安装步骤

```bash
# 克隆项目（gitcode/github）
git clone https://gitcode.com/xiao-an/bilibili-ordersong-plugin.git

# git clone https://github.com/xiaoan-1/bilibili-ordersong-plugin.git

cd bilibili-ordersong-plugin

# 安装依赖
pnpm i
```

### 服务管理
```bash
# 启动服务
npm run start

# 停止服务
npm run stop

# 重启服务
npm run restart

# 查看日志
npm run log
```

首次启动时，会自动从 `config/default/` 目录拷贝默认配置到 `config/` 目录。

## 配置

### 服务端配置 `config/config.yaml`
| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `access_key_id` | B站开放平台项目密钥 | 空 |
| `access_key_secred` | B站开放平台签名密钥 | 空 |
| `web_server_port` | Web服务端口号 | 8000 |

>**密钥获取 → [B站直播创作者服务中心](https://open-live.bilibili.com/open-manage)**

### API地址配置 `config/webapi.js`

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `bili_api` | B站开放平台API地址 | `/bili-api`（集成模式） |
| `netease_api` | 网易云音乐API地址 | `/netease_api`（集成模式） |
| `qqmusic_api` | QQ音乐API地址 | `http://localhost:3300`（独立服务） |

**地址规则：**
- 以 `/` 开头的相对路径：表示该API集成在主服务中，启动时自动挂载
- 完整URL地址（如 `http://localhost:3300`）：表示该API独立运行，需单独启动

## 使用

在直播姬或 OBS 中选择添加浏览器源，输入网址链接即可：

```
http://localhost:8000?code={身份码}
```

**公益链接（若无法使用请自行搭建）：**

> **[http://xiaoan.website/order?code={身份码}](http://xiaoan.website/order)**

身份码获取：[开播设置（B站）](https://link.bilibili.com/p/center/index#/my-room/start-live) → 复制身份码


### 观众指令

1. **点歌**：发送 `点歌 (平台) 歌曲关键词`
   - 不带平台默认为网易云音乐，目前支持 `wy`（网易）和 `qq`（QQ音乐）
   - 开头两个字为"点歌"即可，无严格格式要求
   - 示例：`点歌起风了`、`点歌qq起风了`
2. **切歌**：发送 `切歌`
3. **暂停/播放**：发送 `暂停` 或 `播放`
   - 观众只能操作自己所点的歌曲
   - 管理员可以操作任何人的歌曲

## 设置简介

点击点歌列表表头进入设置页面，包含以下设置项：

### 登录设置
1. **音乐平台**：选择网易云音乐或QQ音乐
2. **网易云二维码登录**：点击刷新二维码，扫码登录
3. **QQ音乐Cookie登录**：在QQ音乐网页端登录后获取Cookie，粘贴设置
4. **空闲歌单ID**：网易云歌单ID，无人点歌时自动播放该歌单

### 点歌设置
1. **用户点歌数**：每个用户同时已点的最大歌曲数
2. **最大点歌数**：全局同时已点的最大歌曲数
3. **最大歌曲时长**：限制歌曲最大时长（秒），超过无法点歌
4. **超时限播时长**：超过最大时长也可以点，但播放到指定时间自动切歌
5. **历史记录与黑名单**：历史点歌用户、历史点歌歌曲、用户黑名单、歌曲黑名单

### 弹幕设置
1. **直播平台**：选择B站、抖音（暂不支持）、斗鱼（暂不支持）等平台，切换/重连弹幕服务

## 致谢

- ~~[NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) — 网易云音乐 Node.js API~~
