const interceptor = require("../interceptor");

/**
 * 项目心跳接口
 * @param ctx
*/
module.exports = async function gameHeartBeat(ctx) {
    const params = ctx.request.body;

    await interceptor.post("/v2/app/heartbeat", params)
        .then(({ data }) => {
            ctx.body = data;
        })
        .catch(err => {
            ctx.body = err;
        })
}
