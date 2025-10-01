const Router = require('koa-router');

const GameStart = require('./interface/gameStart');
const GameEnd = require('./interface/gameEnd');
const GameHeartBeat = require('./interface/gameHeartBeat');
const GameBatchHeartBeat = require('./interface/gameBatchHeartBeat');

// 开启路由
const router = new Router()

router.post("/gameStart", GameStart)
router.post("/gameEnd", GameEnd)
router.post("/gameHeartBeat", GameHeartBeat)
router.post("/gameBatchHeartBeat", GameBatchHeartBeat)

module.exports = router;
