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

const db = '12';


/*redis是内存存储器，不需要连接池*/
const redis12 = {};

//*====================access_token管理===========================*//
/*更新access_token*/
redis12.updateAccessToken = function(id, accessToken) {
    if(!client) return;
    return new Promise((resolve, reject) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //hmset
                client.hmset(id, accessToken,  async function(error, res){
                    if(error) {
                        logger.error(`redis-hmset-${error}`);
                        reject(error);
                    } else {
                        logger.info(`redis-hmset-${id}-ok`);
                        resolve(res);
                    }
                });
            }
        });
    });

};

/*获取access_token*/
redis12.getAccessToken = function(id){
    if(!client) return;
    return new Promise(( resolve, reject ) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //hget
                client.hgetall(id, async function(error, res){
                    if(error) {
                        logger.error(`redis-hgetall-${error}`);
                        reject(error);
                    } else {
                        if(res){
                            if(res.updateStamp){
                                res.updateStamp = parseInt(res.updateStamp);
                            }
                        }

                        resolve(res);
                    }
                });
            }
        });
    });
};


//*====================用户管理===========================*//
/*更新用户*/
redis12.updateUserBdmer = function(unionid, userInfo) {
    if(!client) return;
    return new Promise((resolve, reject) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //hmset
                client.hmset(unionid, userInfo,  async function(error, res){
                    if(error) {
                        logger.error(`redis-hmset-${error}`);
                        reject(error);
                    } else {
                        logger.info(`redis-hmset-${unionid}-ok`);
                        resolve(res);
                    }
                });
            }
        });
    });

};

/*删除用户*/
redis12.deleteUserBdmer = function(unionid) {
    if(!client) return;
    return new Promise((resolve, reject) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //del
                client.del(unionid, function(error, res){
                    if(error) {
                        logger.error(`redis-hdel-${error}`);
                        reject(error);
                    } else {
                        logger.info(`redis-hdel-${unionid}-ok`);
                        resolve(res);
                    }
                });
            }
        });
    });

};

/*获取用户*/
redis12.getUserBdmer = function(unionid){
    if(!client) return;
    return new Promise(( resolve, reject ) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //hget
                client.hgetall(unionid, async function(error, res){
                    if(error) {
                        logger.error(`redis-hgetall-${error}`);
                        reject(error);
                    } else {
                        if(res){
                            if(res.point){
                                res.point = parseInt(res.point);
                            }
                            if(res.uid){
                                res.uid = parseInt(res.uid);
                            }
                        }

                        resolve(res);
                    }
                });
            }
        });
    });
};



/*获取所有用户keys*/
redis12.getAllKeys = function(){
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

/**每天晚上12点重置count**/
redis12.restCount = function(arrUnionId) {
    if(!client) return;
    return new Promise(( resolve, reject ) => {
        client.select(db, function(error){
            if(error) {
                logger.error(`redis-select-${error}`);
                reject(error);
            } else {
                //resetAllCount
                let information = {};
                information.count = 1;
                for (let i = 0; i < arrUnionId.length; i++) {
                    client.hmset(arrUnionId[i], information, async function(error, res){
                        if(error) {
                            logger.error(`$redis-reset-${arrUnionId[i]}-${error}`);
                        } else {
                            logger.info(`redis-reset-${arrUnionId[i]}-${res}`);
                        }

                        if(i === (arrUnionId.length-1)){
                            resolve("OK");
                        }
                    });
                }
            }
        });
    });
};


//*====================链接管理===========================*//
/*断开连接*/
redis12.redisClose = function() {
    if(!client) return;

    client.quit();
    logger.info(`redis-close`);
};

module.exports = redis12;
