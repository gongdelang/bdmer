const logger  = require("../../publicHelper/logger").getLogger('eleme');

const { Disman } = require("../request/disman");
const cookieChai = require('../helper/cookieChai');

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


    let url_param = url.slice(url.indexOf("?")+1);
    const query = querystring.parse(url_param);

    const packetId = query.id || '15418396218921967';
    const backId = query.back_id || "1001";

    if(!(/^\d{17}$/.test(packetId))){
        res.message = `链接有误`;
        res.myCode = 1;
        return res;
    }

    let cookieData = await cookieChai.getCheck(nickname);
    if(cookieData === ""){
        logger.error(`没有问题cookieChai`);
        res.message = `没有问题cookieChai`;
        res.myCode = 0;
        return res;
    }

    if (packetId) {

        let riskCookie = '';
        let noUserCookie = '';
        let otherCookie = '';
        let successCookie = '';

        /*循坏检测cookieChai*/
        for(let i = 0; i < cookieData.length; i++){
            let userInfo = cookieData[i];

            let disman = new Disman({
                data:userInfo.data,
                SID: userInfo.sid,
                USERID: userInfo.userid,
                trackid: userInfo.trackid,
                packetId: packetId,
                backId:backId
            }, url);

            let url_cookie = JSON.parse(decodeURIComponent(userInfo.data.split(/;\s+/).find(item => /^snsInfo/.test(item)).split('=').pop()));
            let avatar = url_cookie.avatar;
            let name = url_cookie.name;

            //获取userid
            let userid = await disman.chaiExternal();
            let data = await disman.chaiHongbao(name, avatar);

            //=========================处理返回数据============================
            if(data.code === "200"){
                logger.info(`cookieChai成功-${userInfo.id}`);
                successCookie += `${userInfo.id}\n`;
                await cookieChai.getBind(userInfo.id);
            }
            else if(data.code === "1002"){
                logger.info(`cookieChai成功-${userInfo.id}`);
                successCookie += `${userInfo.id}\n`;
                await cookieChai.getBind(userInfo.id);
            }
            else if(data.code === "1004"){
                logger.error(`风控用户：${userInfo.id}`);
                riskCookie += `${userInfo.id}\n`;
            }
            else if(data.message === "未登录"){
                logger.error(`未登录：${userInfo.id}`);
                noUserCookie += `${userInfo.id}\n`;
            }
        }

        logger.error(`问题cookieChai检测完毕`);
        res.message = `问题cookieChai检测完毕\n`;
        res.message += `风控用户：\n${riskCookie}\n`;
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