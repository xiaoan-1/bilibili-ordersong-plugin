b站直播姬点歌H5插件

本插件用于bilibili直播姬提供给观众点歌的功能，音源来自网易音乐、QQ音乐

## 观众指令
1. 点歌 + (平台) + 歌曲关键词，不带平台默认为网易云音乐（目前仅支持网易和QQ）
   - 开头两个字为“点歌”即可，无其他格式要求（例如：点歌起风了、点歌qq起风了）
2. 切歌
   - 观众可以切换当前自己所点且正在播放的歌曲，无权限切其他人的歌曲
   - 管理员可以切换任何人的歌曲
## 使用简介
在直播姬或者obs中选择添加浏览器插件,输入网址链接即可

个人公益链接（若无法使用请自行搭建对应API服务）
http://plugin.changsheng.space/plugin?roomid=你的直播间ID

若发现用户名被***屏蔽，请获取自己的uid、buvid、key三个参数添加到链接后面，用&符号分隔

例如：http://plugin.changsheng.space/plugin?roomid=你的直播间ID&uid=123456&buvid=ABCD&key=ABCD

获取方式：在B站网页端进入自己的直播页面，按F12调出控制台，如下图

![提示1](https://github.com/xiaoan-1/bilibili-ordersong-plugin/blob/main/img/help.png)

## 设置简介
1. 网易二维码登录：点击对应登录即可弹出二维码，扫码即可
2. QQ音乐cookie：请在QQ音乐网页端登录获取cookie，获取方式自行百度
3. 管理员uid：个人的b站账号ID，可在个人主页网址获取或者直播姬头像详细信息
4. 用户点歌数：每个用户当前已点的最大歌曲数（过多一人霸榜）
5. 最大点歌数：所有用户当前已点的最大歌曲数（过多无法显示）
6. 最大歌曲时长：限制歌曲最大时长，超过无法点上（一小时歌长警告）
7. 超时限播时长：超过歌曲最大时长也可以点上，但放到指定时间自动切换
8. 空闲歌单ID：目前只支持网易歌单，在网页中网址获取歌单ID，无人点歌时播放
9. 历史歌单列表、历史点歌用户、历史点歌歌曲、黑名单，字面意思

## 点歌面板
![点歌界面](https://github.com/xiaoan-1/bilibili-ordersong-plugin/blob/main/img/panel.png)

## 设置面板
![设置面板1](https://github.com/xiaoan-1/bilibili-ordersong-plugin/blob/main/img/set1.png)

![设置面板1](https://github.com/xiaoan-1/bilibili-ordersong-plugin/blob/main/img/set2.png)

## 提示信息
![提示1](https://github.com/xiaoan-1/bilibili-ordersong-plugin/blob/main/img/tip1.png)

![提示2](https://github.com/xiaoan-1/bilibili-ordersong-plugin/blob/main/img/tip2.png)


## 致谢
~~本插件用到的网易音乐API来源于Binaryify的[网易云音乐 Node.js API service](https://github.com/Binaryify/NeteaseCloudMusicApi)~~

本插件用到的QQ音乐API来源于jsososo的[QQMusicApi](https://github.com/jsososo/QQMusicApi)