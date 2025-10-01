const interceptor = require("../interceptor");

/**
 * 批量项目心跳接口
 * @param ctx
 */
module.exports = async function gameBatchHeartBeat(ctx) {
    const params = ctx.request.body;

    await interceptor.post("/v2/app/batchHeartbeat", params)
        .then(({ data }) => {
            ctx.body = data;
        })
        .catch(err => {
            ctx.body = err;
        })
}
