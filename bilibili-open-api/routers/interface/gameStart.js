const interceptor = require("../interceptor");

/**
 * 互动玩法游戏启动接口
 * @param ctx 
*/
module.exports =  async function gameStart(ctx) {
    const params = ctx.request.body;
    await interceptor.post("/v2/app/start", params)
        .then(({ data }) => {
            ctx.body = data;
            console.log(data);
        })
        .catch(err => {
            ctx.body = err;
        })
}
