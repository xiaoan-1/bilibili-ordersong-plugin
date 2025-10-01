b站直播姬点歌H5插件

本插件用于bilibili直播姬提供给观众点歌的功能，音源来自网易音乐、QQ音乐

## 部署

```shell script
git clone https://github.com/xiaoan-1/bilibili-ordersong-plugin.git

cd ./bilibili-ordersong-plugin

npm i

npm install pm2 -g

# 后台启动web服务
npm run start

# 后台启动所有服务
npm run all
```

## 观众指令
1. 点歌 + (平台) + 歌曲关键词，不带平台默认为网易云音乐（目前仅支持网易和QQ）
   - 开头两个字为“点歌”即可，无其他格式要求（例如：点歌起风了、点歌qq起风了）
2. 切歌/暂停/播放
   - 观众可以切换、暂停、播放当前自己所点的歌曲，无权限操作其他人的歌曲
   - 管理员可以切换任何人的歌曲

## 使用简介
在直播姬或者obs中选择添加浏览器插件,输入网址链接即可

个人公益链接（若无法使用请自行搭建对应API服务）

https://order.xiaoan.website?code={身份码}

身份码获取：[直播中心](https://link.bilibili.com/p/center/index#/my-room/start-live)  ▶ 身份码

## 设置简介
点击表头进入设置页面
1. 网易二维码登录：点击对应登录即可弹出二维码，扫码即可
2. QQ音乐cookie：请在QQ音乐网页端登录获取cookie，获取方式自行百度
3. 管理员uid：个人的b站账号ID，可在个人主页网址获取或者直播姬头像详细信息
4. 用户点歌数：每个用户当前已点的最大歌曲数（过多一人霸榜）
5. 最大点歌数：所有用户当前已点的最大歌曲数（过多无法显示）
6. 最大歌曲时长：限制歌曲最大时长，超过无法点上（一小时歌长警告）
7. 超时限播时长：超过歌曲最大时长也可以点上，但放到指定时间自动切换
8. 空闲歌单ID：目前只支持网易歌单，在网页中网址获取歌单ID，无人点歌时播放
9. 历史歌单列表、历史点歌用户、历史点歌歌曲、黑名单，字面意思

## 致谢
~~本插件用到的网易音乐API来源于Binaryify的[网易云音乐 Node.js API service](https://github.com/Binaryify/NeteaseCloudMusicApi)~~

本插件用到的QQ音乐API来源于jsososo的[QQMusicApi](https://github.com/jsososo/QQMusicApi)