const logger  = require("../../publicHelper/logger").getLogger('eleme');

const randomName = require('../helper/randomName');
const randomImage = require('../helper/randomImage');
const { Disman } = require("../request/disman");
const cookieChai = require('../helper/cookieChai');

const querystring = require("querystring");

const axios = require('axios');

async function request({ mobile, url, nickname, from}) {
    let res = {};

    //==================================================================================//
    /**暂时停止服务**/
    /*logger.error(`拆红包维护`);
    res.message = `目前拆红包正在维护，请使用领红包`;
    res.myCode = 1;
    return res;*/
    //==================================================================================//

    let chai_count = 0;
    let chai_ok = 0;
    let url_param = url.slice(url.indexOf("?")+1);
    const query = querystring.parse(url_param);

    const packetId = query.id || '15418396218921967';
    const backId = query.back_id || "1001";

    if(!(/^\d{17}$/.test(packetId))){
        res.message = `链接有误`;
        res.myCode = 1;
        return res;
    }


    let cookieData = await cookieChai.get();
    if(cookieData === ""){
        logger.error(`系统cookie用光`);
        res.message = `今日拆红包小号已用光，请明日1点后再来`;
        res.myCode = 1;
        return res;
    }

    if (packetId) {
        /*循坏拆红包*/
        while(true){
            if(chai_count >= cookieData.length){
                logger.error(`系统cookie不足`);
                res.message = `系统内置小号不足，请明日1点后再来`;
                res.myCode = 1;
                return res;
            }

            let userInfo = cookieData[chai_count];
            chai_count++;

            let disman = new Disman({
                data:userInfo.data,
                SID: userInfo.sid,
                USERID: userInfo.userid,
                trackid: userInfo.trackid,
                packetId: packetId,
                backId:backId
            }, url);

            //let avatar = randomImage();
            //let name = randomName();
            //let avatar = "http://thirdqq.qlogo.cn/qqapp/101204453/EBF7F0BF90A3F997D9B25C71C942C75A/40";
            //let name = from;
            let url_cookie = JSON.parse(decodeURIComponent(userInfo.data.split(/;\s+/).find(item => /^snsInfo/.test(item)).split('=').pop()));
            let avatar = url_cookie.avatar;
            let name = url_cookie.name;

            //获取userid

           // let checkPhone = await disman.checkByPhone(userInfo.phone);
            let userid = await disman.chaiExternal();

            let data = await disman.chaiHongbao(name, avatar);
            //=========================处理返回数据============================
            if(data.code === "200"){
                chai_ok++;
                if(chai_ok >= 4){
                    logger.error(`链接失效，或已经拆完毕`);
                    res.message = `链接失效，或已经拆完毕`;
                    res.myCode = 1;
                    return res;
                }

                if(data.data.opening_amount === null || data.data.opening_amount === 0){
                    logger.info(`该红包已拆过`);
                    res.message = `该红包已拆过\n总金额：${data.data.total_amount}元`;
                    res.myCode = 1;
                    return res;
                }

                await cookieChai.updateChaiCount(userInfo.id);

                let money = data.data.opened_amount - data.data.total_amount;
                if(money >= 0.0){
                    logger.info(`拆取完毕-总金额：${data.data.total_amount}`);
                    res.message = `拆取完毕\n总金额：${data.data.total_amount}元`;
                    res.myCode = 0;
                    res.money = data.data.total_amount;
                    return res;
                }
            }
            else if(data.code === "1002"){
                await cookieChai.clearChaiCount(userInfo.id);
                logger.error(`userInfo-2次上限-${userInfo.id}`);
            }else if(data.code === "1004"){
                await cookieChai.enValidIsChai(userInfo.id, 1);
                logger.error(`风控用户：${userInfo.id}`);
            }else if(data.message === "未登录"){
                await cookieChai.enValidIsChai(userInfo.id, 2);
                logger.error(`未登录：${userInfo.id}`);
            }
        }

    } else {
        logger.error(`该红包链接已失效`);
        res.message = `该红包链接已失效`;
        res.myCode = 1;
        return res;
    }
}

function response(options) {
    return new Promise(async (resolve, reject)=> {
        try {
            //首先去本地领取
            let res = {};
            try {
                let resData = await axios.post('http://localhost:端口/chai',options);
                res = resData.data;
            }catch (e) {
                //res = await request(options);
                res.myCode = 1;
                res.message = '拆红包服务已关闭，等明天程序员睡醒再开';
            }
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
    let res = await response(options);
    return res;
};