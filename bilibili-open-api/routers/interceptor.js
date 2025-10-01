const axios = require('axios');
const encrypt = require('../tool/encrypt');

// 创建拦截器
const api = axios.create({
    baseURL: "https://live-open.biliapi.com"
    // baseURL: "http://test-live-open.biliapi.net" //test
})

// 鉴权加密处理headers，下次请求自动带上
api.interceptors.request.use(config => {
    config.headers = encrypt.getEncodeHeader(config.data);
    return config
})

module.exports = api