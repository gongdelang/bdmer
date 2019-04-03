const logger = require('../publicHelper/logger').getLogger('eleme');

const redirect = require('./helper/redirect');
const eleme = require("./eleme");
const mysql = require("./mysql");
const redis = require('./redis/redis9');

const hex2dec = require("hex2dec");
//const schedule = require('node-schedule');

//======================抓取sn========================//
/*const  scheduleCronstyleGetSn = ()=>{
    //每天晚上04：00：00执行一次:
    schedule.scheduleJob('00 00 04 * * *',async ()=>{
        let snKeys = await redis.getSnKeys();
        snKeys.sort(function sortNumber(a,b)
        {
            return a - b
        });

        if(snKeys.length < 5){
            if(snKeys.length === 0){
                snKeys.length = 1;
                snKeys = [0];
            }

            //连续失败次数
            let failCount = 0;

            let getInfo = {};
            getInfo.url = '一键最佳';
            getInfo.mobile = '18758896369';
            getInfo.nickname = `一键最佳`;
            getInfo.from = '帮点儿忙';
            while (snKeys.length < 5){
                logger.info(`sn数量-${snKeys.length}`);
                let resData = await eleme.getHongBao(getInfo);
                if(resData.myCode === 0){
                    failCount = 0;
                    //插入sn如redis-9
                    let uid = parseInt(snKeys[snKeys.length-1]) + 1;
                    let newSnInfo = {};
                    newSnInfo.sn = resData.sn;
                    newSnInfo.createStamp = new Date().getTime();
                    await redis.updateSn(uid, newSnInfo);
                    logger.info(`公众号-自动插入sn成公${resData.sn}`);
                    //重新获取snKeys
                    snKeys = await redis.getSnKeys();
                    logger.info(`更新后sn数量-${snKeys.length}`);
                    snKeys.sort(function sortNumber(a,b)
                    {
                        return a - b
                    });
                }else {
                    failCount++;
                    //连续失败2次以上
                    if(failCount > 2){
                        console.log('连续失败2次，补充sn失败，可能是红包没有了');
                        return;
                    }
                    continue;
                }
            }
        }
    });
};

(async ()=> {
    let snKeys = await redis.getSnKeys();
    snKeys.sort(function sortNumber(a,b)
    {
        return a - b
    });

    if(snKeys.length < 5){
        if(snKeys.length === 0){
            snKeys.length = 1;
            snKeys = [0];
        }

        //连续失败次数
        let failCount = 0;

        let getInfo = {};
        getInfo.url = '一键最佳';
        getInfo.mobile = '18758896369';
        getInfo.nickname = `一键最佳`;
        getInfo.from = '帮点儿忙';
        while (snKeys.length < 5){
            logger.info(`sn数量-${snKeys.length}`);
            let resData = await eleme.getHongBao(getInfo);
            if(resData.myCode === 0){
                failCount = 0;
                //插入sn如redis-9
                let uid = parseInt(snKeys[snKeys.length-1]) + 1;
                let newSnInfo = {};
                newSnInfo.sn = resData.sn;
                newSnInfo.createStamp = new Date().getTime();
                await redis.updateSn(uid, newSnInfo);
                logger.info(`公众号-自动插入sn成公${resData.sn}`);
                //重新获取snKeys
                snKeys = await redis.getSnKeys();
                logger.info(`更新后sn数量-${snKeys.length}`);
                snKeys.sort(function sortNumber(a,b)
                {
                    return a - b
                });
            }else {
                failCount++;
                //连续失败2次以上
                if(failCount > 2){
                    console.log('连续失败2次，补充sn失败，可能是红包没有了');
                    return;
                }
                continue;
            }
        }
    }

    scheduleCronstyleGetSn();
    console.log('每天晚上04：00：00,获取红包sn开启');
})();*/


module.exports = {
    getSnRedis:async ()=>{
        let snKeys = await redis.getSnKeys();
        snKeys.sort(function sortNumber(a,b)
        {
            return a - b
        });

        if(snKeys.length < 300){
            logger.info('开始手动添加sn');
            if(snKeys.length === 0){
                snKeys.length = 1;
                snKeys = [0];
            }

            //连续失败次数
            let failCount = 0;

            let getInfo = {};
            getInfo.url = '一键最佳';
            getInfo.mobile = '18758896369';
            getInfo.nickname = `一键最佳`;
            getInfo.from = '帮点儿忙';
            let i = 0;
            while(i < 2){
                let resData = await eleme.getHongBao(getInfo);
                if(resData.myCode === 0){
                    failCount = 0;
                    //插入sn如redis-9
                    let uid = parseInt(snKeys[snKeys.length-1]) + 1;
                    let newSnInfo = {};
                    newSnInfo.sn = resData.sn;
                    newSnInfo.createStamp = new Date().getTime();
                    await redis.updateSn(uid, newSnInfo);
                    logger.info(`管理员-自动插入sn成功${resData.sn}`);
                    //重新获取snKeys
                    snKeys = await redis.getSnKeys();
                    snKeys.sort(function sortNumber(a,b)
                    {
                        return a - b
                    });
                    i = i+1;
                }else {
                    failCount++;
                    //连续失败2次以上
                    if(failCount>2){
                        logger.info('管理员-连续失败2次，补充sn失败，可能是红包没有了');
                        return {myCode:1, message:`抓取了${i}个-cookie不足,现在sn数量${snKeys.length}`};
                    }
                    continue;
                }
            }
            return {myCode:0, message:`抓了${i+1}个了，现在sn数量${snKeys.length}`};
        }

        return {myCode:0, message:`红包池现在是满的，有${snKeys.length}个`}

    },

    checkoutInfo: async (info, typeUrl) => {
        let {url, mobile, nickname, province, city, sex, from} = info;

        if (!mobile) {
            throw new Error('请将信息填写完整');
        }

        if (/^\d{19}$/.test(url) && typeUrl === 'get') {
            url = hex2dec.decToHex(url, { prefix:false});
        }else if(url === '一键最佳' && typeUrl === 'get'){
            url = '一键最佳';
        } else{

            // 短链接处理
            if (/^http?:\/\/url\.cn\//i.test(url)) {
                url = await redirect(url);
            }

            // 短链接处理
            if (/^https?:\/\/url\.cn\//i.test(url)) {
                url = await redirect(url);
            }

            if(typeUrl === "get"){
                if (url.indexOf('h5.ele.me/hongbao') === -1) {
                    throw new Error('红包链接不正确');
                }
            }else if(typeUrl === "chai"){
                if (url.indexOf('https://h5.ele.me/grouping/') === -1) {
                    throw new Error('红包链接不正确');
                }
            }
        }


        if (!/^1\d{10}$/.test(mobile)) {
            throw new Error('请填写 11 位手机号码');
        }

        if (!nickname || nickname === undefined) {
            nickname = mobile;
        }

        if (!province || province === undefined) {
            province = "未知";
        }

        if (!city  || city === undefined) {
            city = "未知";
        }

        if (!sex || sex === undefined) {
            sex = "未知";
        }

        if (!from || from === undefined) {
            from = "微信fb2111";
        }

        return {url, mobile, nickname, province, city, sex, from};
    },

    get: async (info) => {
        let {url, mobile, nickname, province, city, sex, from} = info;
        //查找用户
        //let res = await mysql.findUser(mobile);
        //改（公众号）
        let res = {};
        res.length = 0;

        logger.info(`公众号-开始抢红包`, [nickname, mobile]);

        if(res.length === 0){
            //添加新用户（新手机）-改（公众号）
            //await mysql.insertUser({url, mobile, nickname, province, city, sex, from});
            let myBody = {};
            //是否是一键领取
            /*if((url === '一键最佳')){
                //一键最佳
                //从reids-9获取红包sn
                let snKeys = await redis.getSnKeys();
                snKeys.sort(function sortNumber(a,b)
                {
                    return a - b
                });
                if(snKeys && snKeys.length !== 0){
                    let snInfoKey = '';
                    let snInfo = false;

                    snInfoKey = snKeys[0];
                    snInfo = await redis.getSn(snInfoKey);
                    if((new Date().getTime() - snInfo.createStamp) < (10*1000)){
                        snInfoKey = '';
                        snInfo = false;
                    }

                    if(!snInfo){
                        logger.error(`公众号-一键最佳，领取失败，红包链接待会儿才有`);
                        myBody.message = `领取失败，红包链接待会儿才有`;
                        myBody.myCode = 1;
                        return myBody;
                    }else{
                        url = snInfo.sn;

                        myBody.message = `还剩一个是大红包，请点击领取`;
                        myBody.money = "未知";
                        myBody.myCode = 0;
                        myBody.sn = snInfo.sn;

                        //删除已领取的sn
                        await redis.deleteSn(snInfoKey);

                        //补充链接
                        eleme.getHongBao({url:'一键最佳', mobile, nickname, from}).then(
                            async function(data){
                                if(data.myCode === 0){
                                    //插入sn如redis-9
                                    let uid = parseInt(snKeys[snKeys.length-1]) + 1;
                                    let newSnInfo = {};
                                    newSnInfo.sn = data.sn;
                                    newSnInfo.createStamp = new Date().getTime();
                                    await redis.updateSn(uid, newSnInfo);
                                    logger.info(`公众号-自动插入sn成功${data.sn}`);
                                    logger.info(`更新后sn数量-${snKeys.length}`);
                                    return;
                                }else{
                                    let resData = {};
                                    for(let i=0; i<2; i++){
                                       resData = await eleme.getHongBao({url:'一键最佳', mobile, nickname, from});
                                        if(resData.myCode === 0){
                                            //插入sn如redis-9
                                            let uid = parseInt(snKeys[snKeys.length-1]) + 1;
                                            let newSnInfo = {};
                                            newSnInfo.sn = resData.sn;
                                            newSnInfo.createStamp = new Date().getTime();
                                            await redis.updateSn(uid, newSnInfo);
                                            logger.info(`公众号-自动插入sn成公${resData.sn}`);
                                            logger.info(`更新后sn数量-${snKeys.length}`);
                                            return;
                                        }else {
                                            continue;
                                        }
                                    }
                                    if(resData && /正在补充/.test(resData.message)){
                                        eleme.bindAutoFun().then(
                                            function (data) {
                                                logger.info(data);
                                            },
                                            function (err) {
                                                logger.error(data);
                                            }
                                        );
                                    }
                                    logger.error(`公众号-自动获取sn问题-2次${data.message}`);
                                }
                            },
                            async function(err){
                                logger.error(`公众号-自动获取sn出错${err.message}`);
                            }
                        );

                        //插入记录
                        logger.info(`公众号-领取红包成功`, [nickname, mobile, '5元']);
                        mysql.addRecord({url, mobile, nickname, money:'5元', from});
                        return myBody;
                    }

                }else{
                    logger.error(`公众号-一键最佳，领取失败，sn没有了`);
                    myBody.message = `领取失败，红包链接没有了`;
                    myBody.myCode = 1;
                    return myBody;
                }

            }else{*/
            //非一键最佳
            myBody = await eleme.getHongBao({url, mobile, nickname, from});
            if(myBody.myCode === 0){
                //后期每人10次
                //mysql.updateCount(mobile);

                //记录领取
                let money = myBody.money;
                mysql.addRecord({url, mobile, nickname, money, from});
                logger.info(`公众号-领取红包成功`, [nickname, mobile, money]);
            }else if(myBody && /正在补充/.test(myBody.message)){
               /* eleme.bindAutoFun().then(
                    function (data) {
                        logger.info(data);
                    },
                    function (err) {
                        logger.error(data);
                    }
                );*/
            }
            return myBody;
            //}
        }else{
            let validCounts = 10;
            let breakCode = 0;
            if(breakCode === 0){
                if(validCounts && validCounts > 0){
                    //获取红包
                    let myBody = await eleme.getHongBao({url, mobile, nickname, from});

                    if(myBody.myCode === 0){
                        //mysql.updateCount(mobile);

                        //记录领取
                        let money = myBody.money;
                        mysql.addRecord({url, mobile, nickname, money, from});
                        logger.info(`领取红包成功`, [nickname, mobile, money]);
                    }

                    return myBody;

                }else{
                    throw new Error('您剩余次数不足\n充值请联系管理员-曹三岁(微信fb2111)');
                }
            }else{
                throw new Error(`\n申诉请联系管理员-曹三岁(微信fb2111)`);
            }
        }
    },

    chai: async (info) => {
        let {url, mobile, nickname, province, city, sex, from} = info;
        //查找用户
        //let res = await mysql.findUser(mobile);
        //改（公众号）
        let res = {};
        res.length = 0;
        logger.info(`公众号-开始拆红包`, [nickname, mobile]);

        if (res.length === 0) {
            //添加新用户（新手机）-改（公众号）
            //await mysql.insertUser({url, mobile, nickname, province, city, sex, from});
            let myBody = await eleme.chaiHongBao({url, mobile, nickname, from});

            if (myBody.myCode === 0) {
                //mysql.updateCount(mobile);

                //记录领取
                let money = myBody.money;
                mysql.addRecord({url, mobile, nickname, money, from});
                logger.info(`公众号-拆取红包成功`, [nickname, mobile, money]);
            }

            return myBody;

        } else {
            let validCounts = 10;
            let breakCode = 0;
            if (breakCode === 0) {
                if (validCounts && validCounts > 0) {
                    //获取红包
                    let myBody = await eleme.chaiHongBao({url, mobile, nickname, from});

                    if (myBody.myCode === 0) {
                        //mysql.updateCount(mobile);

                        //记录领取
                        let money = myBody.money;
                        mysql.addRecord({url, mobile, nickname, money, from});
                        logger.info(`拆取红包成功`, [nickname, mobile, money]);
                    }

                    return myBody;

                } else {
                    throw new Error('您剩余次数不足\n充值请联系管理员-曹三岁(微信fb2111)');
                }
            } else {
                throw new Error(`\n申诉请联系管理员-曹三岁(微信fb2111)`);
            }
        }
    },

    checkGet: async (info) => {
        let {url, mobile, nickname, province, city, sex, from} = info;
        logger.info(`开始检测cookieGet`, [nickname, mobile]);
        return await eleme.checkCookieGet({url, mobile, nickname, from});
    },

    checkChai: async (info) => {
        let {url, mobile, nickname, province, city, sex, from} = info;
        logger.info(`开始检测cookieChai`, [nickname, mobile]);
        return await eleme.checkCookieChai({url, mobile, nickname, from});
    },

    bind:async (info) => {
        if(info.type === "bindPhone"){
            return await eleme.bindPhone(info.uid, info.phone);
        }else if(info.type === "bindPictrueCode"){
            return await eleme.bindPictrueCode(info.uid, info.pictrueCode);
        }else if(info.type === "bindCode"){
            return await eleme.bindCode(info.uid, info.code);
        }
    },

    isBind:async (uid) => {
        return await eleme.isBind(uid);
    },

    adminBind:async (postInfo) =>{
        switch (postInfo.method) {
            case 'bindPhone': return await eleme.adminBindPhone(postInfo.name);
            case 'bindPictrueCode': return await eleme.adminBindPictrueCode(postInfo.nameP, postInfo.pictrueCode);
        }
    },

    bindAuto:async (isBind) => {
        return await eleme.bindAuto(isBind);
    }
};

/*test*/
/*(async ()=>{

    let sss = new Date("2018-11-05 24:00:00").getTime();
    console.sss;

})();*/
