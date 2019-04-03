const logger = require("./logger").getLogger('wxWeb-eleme');

const redis = require("redis");


const client = redis.createClient(6379, 'ip地址', {no_ready_check:true} );

client.auth('密码', function(){
    logger.info(`redis-登陆成功`);
});

client.on('error', function(error){
    logger.error(`redis-${error}`);
});

client.on('connect', function(){
    logger.info(`redis-ok`);
});

/**异常捕获**/
function uncaughtExceptionHandler(err){
    if(err && err.code == 'ECONNREFUSED'){
        logger.info(`redis-连接拒绝`);
    }else{
        console.log(err);
        logger.error(`redis-服务异常`);
    }
}

process.on('uncaughtException', uncaughtExceptionHandler);

module.exports = client;