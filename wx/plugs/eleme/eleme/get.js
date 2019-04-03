const logger  = require("../../publicHelper/logger").getLogger('eleme');

const randomImage = require('../helper/randomImage');
const randomName = require('../helper/randomName');
const checkMobile = require('../helper/checkMobile');
const timeout = require("../helper/timeout");
const { Request } = require("../request");
const cookieGet = require('../helper/cookieGet');

const querystring = require("querystring");

//使用本地请求
const axios = require('axios');


async function request({ mobile, url, nickname, from}) {
    let res = {};

    //==================================================================================//
    /**暂时停止服务**/
    /* logger.error(`领红包维护`);
     res.message = `目前领红包正在维护，请等待通知`;
     res.myCode = 1;
     return res;*/
    //==================================================================================//

    let get_count = 0;
    let get_invalid = 0;
    let record = '';
    //一键领取
    if(url === '一键最佳'){
        record = await cookieGet.getHongBaoSn();
        if(record){
            url = record.getUrl;
        }else{
            logger.error(`一键最佳，领取失败，sn没有了`);
            res.message = `领取失败，红包链接没有了`;
            res.myCode = 1;
            return res;
        }
    }



    /*获取sn*/
    let sn = "";
    let theme_id = "5";
    if(/^http/.test(url)){
        let query = querystring.parse(url);
        sn = query.sn;
        theme_id = query.theme_id;
    }else{
        sn = url;
    }

    //微信公众号需要sn
    res.sn = sn;
    let fromUid = 0;
    if(/^uid/.test(nickname)){
        fromUid  = parseInt(nickname.slice(3));
        if(!fromUid){
            fromUid = 0;
        }
    }


    if (sn) {

        let cookieData = await cookieGet.get();
        if(cookieData === ""){
            logger.error(`系统cookie不足,正在补充，请10分钟后再来`);
            res.message = `领红包小号不足，正在补充，请10分钟后再来`;
            res.myCode = 1;
            return res;
        }

        let cookie_sid = cookieData[get_count];

        let request = new Request({
            data:cookie_sid.data,
            openid: cookie_sid.openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
            sign: cookie_sid.sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
            sid: cookie_sid.sid, // 接码后可得
            userid:cookie_sid.userid,
            trackid:cookie_sid.trackid
        });

        const luckyNumber = await request.getLuckyNumber(sn, theme_id);
        if (luckyNumber) {
            logger.info(`是拼手气链接，第${luckyNumber}个最大`);
            /*循坏领取红包*/
            while(true){
                if(get_count >= cookieData.length){
                    logger.error(`系统cookie不足`);
                    res.message = `领红包小号不足，管理员正在补充，请10分钟后再来`;
                    res.myCode = 1;
                    return res;
                }

                cookie_sid = cookieData[get_count];
                get_count++;
                //剔除用户自己的cookie(不能使用自己的cookie领取)
                if((fromUid !==0) && (fromUid === cookie_sid.fromUid)){
                    continue;
                }

                request = new Request({
                    data:cookie_sid.data,
                    openid: cookie_sid.openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
                    sign: cookie_sid.sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
                    sid: cookie_sid.sid,// 接码后可得
                    userid:cookie_sid.userid,
                    trackid:cookie_sid.trackid
                });

                //let avatar = randomImage();
                //let name = randomName();
                //let avatar = "http://thirdqq.qlogo.cn/qqapp/101204453/EBF7F0BF90A3F997D9B25C71C942C75A/40";
                //let name = from;
                let url_cookie = JSON.parse(decodeURIComponent(cookie_sid.data.split(/;\s+/).find(item => /^snsInfo/.test(item)).split('=').pop()));
                let avatar = url_cookie.avatar;
                let name = url_cookie.name;

                let data = await request.getHongbao(sn, avatar, name);

                if(!data){
                    if(record !== ''){
                        await cookieGet.updateRecord(record.id, 2);
                    }

                    logger.error(`该红包已经被取消`);
                    console.log(data);
                    res.message = `该红包已经被取消`;
                    res.myCode = 1;
                    return res;
                }

                //=========================返回数据是空============================
                if(data.promotion_records === undefined){
                    if(data.name === "PHONE_IS_EMPTY"){
                        logger.error(`绑定手机号码失效的cookie-${cookie_sid.id}`);
                        await cookieGet.enValidIsGet(cookie_sid.id, 1);
                    }else if(data.name === "TOO_BUSY"){
                        logger.error(`请求繁忙，等待3秒`);
                        timeout(3000);
                    }else if(data.name === "UNAUTHORIZED"){
                        logger.error(`没有登陆cookie-${cookie_sid.id}`);
                        await cookieGet.enValidIsGet(cookie_sid.id, 2);
                    } else{
                        logger.error(`${data.name}`);
                        console.log(data);
                    }
                    //继续领取
                    continue;
                }

                //如果cookie为1，并且又有效了，那么更新cookie
                if(cookie_sid.getCode !== 0){
                    await cookieGet.getBind(cookie_sid.id, data.account);
                }
                //领取后补充/以免被风控
                //let external = await request.getExternal(sn, avatar, name, data.account);


                if (data.ret_code === 6) {
                    if(record !== ''){
                        await cookieGet.updateRecord(record.id, 2);
                    }

                    logger.error(`该红包已经被取消`);
                    console.log(data);
                    res.message = `该红包已经被取消`;
                    res.myCode = 1;
                    return res;
                }else if(data.ret_code === 5){
                    logger.error(`cookie 5次限制-${cookie_sid.id}`);
                    await cookieGet.clearGetCount(cookie_sid.id);
                }else if(data.ret_code === 4){
                    logger.info(`消耗一次cookie-${cookie_sid.id}`);
                    await cookieGet.updateGetCount(cookie_sid.id);
                }else if(data.ret_code === 1){

                    if(record !== ''){
                        await cookieGet.updateRecord(record.id, 3);
                    }

                    logger.info(`该红包早就被领取完了，无法再领取`);
                    res.message = `该红包早就被领取完了，无法再领取`;
                    res.myCode = 1;
                    return res;
                }


                if (data.promotion_records.length <= 0) {
                    get_invalid++;
                    if(get_invalid >= 3){

                        if(record !== ''){
                            await cookieGet.updateRecord(record.id, 3);
                        }

                        logger.info(`该红包早就被领取完了，无法再领取`);
                        res.message = `该红包早就被领取完了，无法再领取`;
                        res.myCode = 1;
                        return res;
                    }
                    continue;
                }

                //=========================最大红包已被领取============================
                if (luckyNumber - data.promotion_records.length <= 0) {
                    if(record !== ''){
                        await cookieGet.updateRecord(record.id, 4);
                    }

                    let lucky = data.promotion_records[luckyNumber - 1];

                    // 还是取不到，可能是因为领完了，不会返回数组
                    if (!lucky) {
                        logger.info(`该红包的大红包已被领取`);
                        res.message = '该红包的大红包已被领取';
                        res.myCode = 1;
                        return res;
                    }

                    if (checkMobile(mobile, lucky.sns_username)) {
                        logger.info(`这个手气最佳已经被你领过了`);
                        res.message = `这个手气最佳已经被你领过了\n手气最佳：${mobile}\n红包金额：${lucky.amount}元`;
                        res.myCode = 1;
                        return res;
                    }

                    logger.info(`手气最佳被人截胡了`);
                    res.message = `手气最佳被人截胡了😥\n手气最佳: ${lucky.sns_username}\n红包金额：${lucky.amount} 元`;
                    res.myCode = 1;
                    return res;
                }

                //========================判断用户有没有领过这个红包=====================
                let records_item = data.promotion_records.find((r) => {
                    return r.sns_username === nickname || checkMobile(mobile, r.sns_username);
                });

                if (records_item) {
                    logger.info(`你已经领过这个红包了`);
                    res.message = `你已经领过这个红包了\n领取账号：${records_item.sns_username}\n红包金额：${records_item.amount} 元`;
                    res.myCode = 1;
                    return res;
                }

                //========================计算剩余第几个为最佳红包=====================
                let num = luckyNumber - data.promotion_records.length;
                logger.info(`还要领 ${num} 个红包才是手气最佳`);
                if(num === 1){
                    if(record !== ''){
                        await cookieGet.updateRecord(record.id, 6);
                    }
                    res.message = `还剩一个是大红包，请点击领取`;
                    res.money = "未知";
                    res.myCode = 0;
                    return res;
                }
            }

        } else {
            if(record !== ''){
                await cookieGet.updateRecord(record.id, 1);
            }

            logger.error(`该红包链接已失效`);
            res.message = `该红包链接已失效`;
            res.myCode = 1;
            return res;
        }
    } else {
        if(record !== ''){
            await cookieGet.updateRecord(record.id, 5);
        }

        logger.error(`链接不正确`);
        res.message = `链接不正确`;
        res.myCode = 1;
        return res;
    }
}

function response(options) {
    return new Promise(async (resolve, reject)=> {
        try {
            //首先去本地领取
			
            let res = {};
			res = await request(options);
            res.status = 200;
            resolve(res);
        } catch (e) {
            logger.error(`${e.message}`);
            //resolve({ err_code: 1, message: e.message, status: (e.response || {}).status, myCode:1 });
            reject({message: e.message, myCode:1});
        }
    })
}

module.exports = async (options) => {
    //获取服务代号
    return await response(options);
};