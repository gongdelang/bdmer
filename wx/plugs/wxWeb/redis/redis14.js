const logger = require("../../publicHelper/logger").getLogger('wxWeb');

const redis = require("redis");

const client = redis.createClient(6379, '', {no_ready_check:true} );

client.auth('', function(){
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

const db = '14';


/*redis是内存存储器，不需要连接池*/
const redis14 = {};

//*====================订单管理===========================*//
/*更新订单*/
redis14.updateOrder = function(payId, payInfo) {
    if(!client) return;
    return new Promise((resolve, reject) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //hmset
                client.hmset(payId, payInfo,  async function(error, res){
                    if(error) {
                        logger.error(`redis-hmset-${error}`);
                        reject(error);
                    } else {
                        logger.info(`redis-hmset-${payId}-ok`);
                        resolve(res);
                    }
                });
            }
        });
    });

};

/*删除订单*/
redis14.deleteOrder = function(payId) {
    if(!client) return;
    return new Promise((resolve, reject) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //del
                client.del(payId, function(error, res){
                    if(error) {
                        logger.error(`redis-hdel-${error}`);
                        reject(error);
                    } else {
                        logger.info(`redis-hdel-${payId}-ok`);
                        resolve(res);
                    }
                });
            }
        });
    });

};

/*获取订单*/
redis14.getOrder = function(payId){
    if(!client) return;
    return new Promise(( resolve, reject ) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //hget
                client.hgetall(payId, async function(error, res){
                    if(error) {
                        logger.error(`redis-hgetall-${error}`);
                        reject(error);
                    } else {
                        if(res){
                            if(res.createStamp){
                                res.createStamp = parseInt(res.createStamp);
                            }
                        }

                        resolve(res);
                    }
                });
            }
        });
    });
};



/*获取所有订单keys*/
redis14.getAllOrderKeys = function(){
    if(!client) return;
    return new Promise(( resolve, reject ) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //getKeys
                client.keys("*", async function(error, res){
                    if(error) {
                        logger.error(`redis-keys-${error}`);
                        reject(error);
                    } else {
                        resolve(res);
                    }
                });
            }
        });
    });
};




//*====================链接管理===========================*//
/*断开连接*/
redis14.redisClose = function() {
    if(!client) return;

    client.quit();
    logger.info(`redis-close`);
};

module.exports = redis14;
