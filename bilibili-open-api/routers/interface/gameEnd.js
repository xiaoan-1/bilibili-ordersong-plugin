const interceptor = require("../interceptor");

/**
 * 互动玩法游戏结束接口
 * @param ctx
 */
module.exports = async function gameEnd(ctx) {
    const params = ctx.request.body
    
    await interceptor.post("/v2/app/end", params)
        .then(({ data }) => {
            ctx.body = data
        })
        .catch(err => {
            ctx.body = err
        })
}
