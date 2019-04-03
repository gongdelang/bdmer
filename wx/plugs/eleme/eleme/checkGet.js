const logger  = require("../../publicHelper/logger").getLogger('eleme');

const timeout = require("../helper/timeout");
const { Request } = require("../request");
const cookieGet = require('../helper/cookieGet');

const querystring = require("querystring");


async function request({ mobile, url, nickname, from}) {
    let res = {};

    //==================================================================================//
    /**暂时停止服务**/
    /* logger.error(`领红包维护`);
     res.message = `目前领红包正在维护，请等待通知`;
     res.myCode = 1;
     return res;*/
    //==================================================================================//

    //次数
    nickname = parseInt(nickname);

    if(!nickname){
        nickname = 50;
    }

    /*获取sn*/
    let sn = "";
    let theme_id = "0";
    if(/^http/.test(url)){
        let query = querystring.parse(url);
        sn = query.sn;
        theme_id = query.theme_id;
    }else{
        sn = url;
    }

    if (sn) {
        let cookieData = await cookieGet.getCheck(nickname);
        if(cookieData === ""){
            logger.error(`没有问题cookieGet`);
            res.message = `没有问题cookieGet`;
            res.myCode = 0;
            return res;
        }

        let cookie_sid = cookieData[0];

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

            let noPhoneCookie = '';
            let noUserCookie = '';
            let otherCookie = '';
            let successCookie = '';
            /*循环检测*/
            for(let i = 0; i < cookieData.length; i++){
                cookie_sid = cookieData[i];
                request = new Request({
                    data:cookie_sid.data,
                    openid: cookie_sid.openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
                    sign: cookie_sid.sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
                    sid: cookie_sid.sid, // 接码后可得
                    userid:cookie_sid.userid,
                    trackid:cookie_sid.trackid
                });

                let avatar = "http://thirdqq.qlogo.cn/qqapp/101204453/EBF7F0BF90A3F997D9B25C71C942C75A/40";
                let name = from;

                let data = await request.getHongbao(sn, avatar, name);

                if(!data){
                    logger.error(`该红包已经被取消,换个链接检测`);
                    console.log(data);
                    res.message = `该红包已经被取消,换个链接检测`;
                    res.myCode = 1;
                    return res;
                }

                //=========================返回数据是空============================
                if(data.promotion_records === undefined){
                    if(data.name === "PHONE_IS_EMPTY"){
                        logger.error(`绑定手机号码失效的cookie-${cookie_sid.id}`);
                        noPhoneCookie += `${cookie_sid.id}\n`;
                    }else if(data.name === "TOO_BUSY"){
                        logger.error(`请求繁忙，等待3秒`);
                        timeout(3000);
                    }else if(data.name === "UNAUTHORIZED"){
                        logger.error(`没有登陆cookie-${cookie_sid.id}`);
                        noUserCookie += `${cookie_sid.id}\n`;
                    } else{
                        logger.error(`${data.name}`);
                        console.log(data);
                        otherCookie += `${cookie_sid.id}\n`;
                    }
                    //继续检测
                    continue;
                }

                //领取后补充/以免被风控
                let external = await request.getExternal(sn, avatar, name, data.account);

                logger.info(`cookieGet成功-${cookie_sid.id}`);
                successCookie += `${cookie_sid.id}\n`;
                await cookieGet.getBind(cookie_sid.id, data.account);
            }

            logger.info(`问题cookieGet检测完毕`);
            res.message = `问题cookieGet检测完毕\n`;
            res.message += `没有手机号码：\n${noPhoneCookie}\n`;
            res.message += `未登录：\n${noUserCookie}\n`;
            res.message += `其他：\n${otherCookie}\n`;
            res.message += `成功：\n${successCookie}\n`;
            res.myCode = 0;
            return res;

        } else {
            logger.error(`该红包链接已失效`);
            res.message = `该红包链接已失效，换个链接检测`;
            res.myCode = 1;
            return res;
        }
    } else {
        logger.error(`链接不正确`);
        res.message = `链接不正确，换个链接检测`;
        res.myCode = 1;
        return res;
    }

}

function response(options) {
    return new Promise(async (resolve, reject)=> {
        try {
            let res = await request(options);
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