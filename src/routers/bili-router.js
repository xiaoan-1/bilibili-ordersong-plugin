const express = require('express');
const axios = require('axios');
const encrypt = require('../utils/encrypt');

// 创建axios实例，指向B站开放平台
const api = axios.create({
    baseURL: "https://live-open.biliapi.com"
});

// 鉴权加密处理headers
api.interceptors.request.use(config => {
    config.headers = encrypt.getEncodeHeader(config.data);
    return config;
});

// 创建Express路由器
const router = express.Router();

/**
 * 默认路由
 */
router.get("/", (req, res) => {
    res.send("B站开放平台API服务运行中");
});

/**
 * 互动玩法游戏启动接口
 */
router.post("/gameStart", async (req, res) => {
    await api.post("/v2/app/start", req.body)
        .then(({ data }) => {
            res.json(data);
            console.log(data);
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

/**
 * 互动玩法游戏结束接口
 */
router.post("/gameEnd", async (req, res) => {
    await api.post("/v2/app/end", req.body)
        .then(({ data }) => {
            res.json(data);
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

/**
 * 项目心跳接口
 */
router.post("/gameHeartBeat", async (req, res) => {
    await api.post("/v2/app/heartbeat", req.body)
        .then(({ data }) => {
            res.json(data);
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

/**
 * 批量项目心跳接口
 */
router.post("/gameBatchHeartBeat", async (req, res) => {
    await api.post("/v2/app/batchHeartbeat", req.body)
        .then(({ data }) => {
            res.json(data);
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

module.exports = router;