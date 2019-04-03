const logger = require("../../publicHelper/logger").getLogger('eleme');

//const client = require("../../publicHelper/redis");

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

const db = '13';

/*redis是内存存储器，不需要连接池*/
const redis13 = {};

//*====================cookie管理===========================*//
/*获得所有keys*/
redis13.getKeys = function(){
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
                        logger.info(`redis-keys-${res}`);
                        resolve(res);
                    }
                });
            }
        });
    });
};


/*更新cookie*/
redis13.updateUserCookie = function(uid, cookieInfo) {
    if(!client) return;
    return new Promise((resolve, reject) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //hmset
                client.hmset(uid, cookieInfo,  async function(error, res){
                    if(error) {
                        logger.error(`redis-hmset-${error}`);
                        reject(error);
                    } else {
                        logger.info(`redis-hmset-${uid}-ok`);
                        resolve(res);
                    }
                });
            }
        });
    });

};

/*删除cookie*/
redis13.deleteUserCookie = function(uid) {
    if(!client) return;
    return new Promise((resolve, reject) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //del
                client.del(uid, function(error, res){
                    if(error) {
                        logger.error(`redis-hdel-${error}`);
                        reject(error);
                    } else {
                        logger.info(`redis-hdel-${uid}-ok`);
                        resolve(res);
                    }
                });
            }
        });
    });

};

/*获取cookie*/
redis13.getUserCookie = function(uid){
    if(!client) return;
    return new Promise(( resolve, reject ) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //hget
                client.hgetall(uid, async function(error, res){
                    if(error) {
                        logger.error(`redis-hgetall-${error}`);
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
redis13.redisClose = function() {
    if(!client) return;

    client.quit();
    logger.info(`redis-close`);
};

module.exports = redis13;
