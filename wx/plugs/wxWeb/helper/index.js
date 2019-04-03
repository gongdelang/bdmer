const logger = require('../../publicHelper/logger').getLogger('wxWeb');
const eleme = require('../../eleme');

const config = require("../config");
const wxMysql = require('../mysql');
const wxRedis = require('../redis/redis12');
const orderRedis = require('../redis/redis14');
const {wxRequest} = require('../request');

let reMsgConfig = require('./reMsgConfig');
let doImage = require('./doImage');
let sign = require('./sign');
let checkOrder = require('./checkOrder');

const uuid = require('uuid');
const md5 = require('md5');
const schedule = require('node-schedule');
const path = require('path');


//======================取消订单========================//
const  scheduleCronstyleCloseOrder = ()=>{
    //每天晚上02：00：00执行一次:
    schedule.scheduleJob('00 00 02 * * *',async ()=>{
        console.log('清除订单开始');
        let keys = await orderRedis.getAllOrderKeys();
        let wxRequestAPI = await getWxRequestAPI(config);

        for (let i = 0; i < keys.length; i++) {
            let orderInfo = await orderRedis.getOrder(keys[i]);
            //超过一天的全部去掉
            if((new Date().getTime() - orderInfo.createStamp) >= 60*60*1000){
                let closeInfo = {};
                closeInfo.payjs_order_id = orderInfo.payjs_order_id;

                let sign = `payjs_order_id=${closeInfo.payjs_order_id}&key=${config.mchidKey}`;
                closeInfo.sign = md5(sign).toUpperCase();
                await wxRequestAPI.closeOrder(closeInfo);

                await orderRedis.deleteOrder(keys[i]);
                console.log()
            }
        }
        console.log('清除订单结束');
    });
};

(async ()=>{
    scheduleCronstyleCloseOrder();
    console.log('每天晚上02：00：00,取消订单开启');
})();



let getWxRequestAPI = async () => {
    let wxRequestAPI = new wxRequest({
        appid:config.appId,
        secret:config.appSecret
    });

    /**更新access_token**/
    let res = await wxRedis.getAccessToken('bdmer');
    if(res){
        wxRequestAPI.setAccessToken(res.access_token);
    }

    return wxRequestAPI;
};

module.exports = {
    //--公用接口A--//
    getWxRequestAPI,



    //--公用接口B--//
    renovateAccessToken:async () => {
        try{
            let myDate = new Date();
            let accessToken = await wxRedis.getAccessToken('bdmer');
            //超过半小时才更新
            if(!accessToken || (myDate.getTime() - accessToken.updateStamp >= (30*60*1000))){
                let wxRequestAPI = new wxRequest({
                    appid:config.appId,
                    secret:config.appSecret
                });

                let data = await wxRequestAPI.renovateAccessToken();
                data.jsApiTicket = await wxRequestAPI.getJsApiTicket();
                if(data.errcode){
                    logger.error(`更新access_token失败-${data.errmsg}`);
                }else{
                    data.updateStamp = myDate.getTime();
                    await wxRedis.updateAccessToken('bdmer', data);
                    logger.info(`更新access_token成功-${data.access_token}-${data.expires_in}`);
                }
                return data;
            }else{
                logger.info(`access_token还在有效期内，拒绝更新`);
                return {message:"access_token还在有效期内，拒绝更新", myCode:0};
            }


        }catch (e) {
            logger.error(`更新access_token失败-${e.message}`);
            return {myCode:1, message:e.message};
        }

    },

    isRepeat:(wxJSON) => {
        if(wxJSON.MsgType !== 'event'){
            if(reMsgConfig.preMsgId === wxJSON.MsgId){
                return false;
            }else {
                reMsgConfig.preMsgId = wxJSON.MsgId;
                return true;
            }
        } else if(wxJSON.MsgType === 'event'){
            if(reMsgConfig.preFromUserName === wxJSON.FromUserName && reMsgConfig.preCreateTime === wxJSON.CreateTime){
                return false;
            }else {
                reMsgConfig.preFromUserName = wxJSON.FromUserName;
                reMsgConfig.preCreateTime = wxJSON.CreateTime;
                return true;
            }
        }
    },

    replayMsg:(fromUserName ,reContent, reType) => {
        /*某些情况需要发送空消息*/
        if(reContent === ''){
            return '';
        }

        /*把要回复的消息格式化为XML*/
        let myDate = new Date();

        let reMsg = {};
        reMsg.CreateTime = myDate.getTime();
        reMsg.ToUserName = fromUserName;
        reMsg.Content = reContent;

        if(reType === 'text'){
            return reMsgConfig.textXML.format(reMsg.ToUserName, reMsg.CreateTime, reMsg.Content);
        }

        else if(reType === 'image'){
            return reMsgConfig.imgXML.format(reMsg.ToUserName, reMsg.CreateTime, reMsg.Content);
        }
    },



    //--text-link--//
    //eleme-getContent
    getContentType: (content) => {
        if (/https:\/\/h5.ele.me\/hongbao/i.test(content)){
            return 1;
        }
        if (/url.cn/i.test(content)) {
            return 2;
        }
        if (/^\d{19}$/.test(content)) {
            return 3;
        }
        if (/https:\/\/h5.ele.me\/grouping\//i.test(content)) {
            return 4;
        }
        if (/^绑定[1][3,4,5,7,8,9][0-9]{9}$/i.test(content)) {
            return 5;
        }
        if (/^\d{6}$/i.test(content)) {
            return 6;
        }if (/^[a-zA-Z0-9]{4}$/i.test(content)) {
            return 7;
        }

        return 0;
    },

    getInfo: (content, contentType) => {
        if (contentType === 1) {
            //饿了么链接
            const first = content.search('https://h5.ele.me/hongbao');
            const last = content.search('device_id=') + 10;
            return content.slice(first, last);
        }
        else if(contentType === 2) {
            //短链接http
            if (/http:\/\/url.cn/i.test(content)) {
                const first = content.search('http://url.cn');
                const last = first + 21;
                return content.slice(first, last);
            }
            //短链接https
            if (/https:\/\/url.cn/i.test(content)) {
                const first = content.search('https://url.cn');
                const last = first + 22;
                return content.slice(first, last);
            }
        }
        else if(contentType === 3){
            //拆红包链接
            const first = content.search(/^\d{19}$/i);
            const last = first + 19;
            return content.slice(first, last);
        }
        else if(contentType === 4){
            //拆红包链接
            const first = content.search('https://h5.ele.me/grouping/');
            const last = content.search('id=') + 20;
            return content.slice(first, last);
        }
        else if(contentType === 5){
            //绑定手机号phone
            const first = content.search(/\d{11}$/i);
            const last = first + 11;
            return content.slice(first, last);
        }
        else if(contentType === 6){
            //绑定手机号code
            const first = content.search(/\d{6}$/i);
            const last = first + 6;
            return content.slice(first, last);
        }else if(contentType === 7){
            //绑定手机号pictrueCode
            const first = content.search(/^[a-zA-Z0-9]{4}$/i);
            const last = first + 4;
            return content.slice(first, last);
        }
        else {
            return ``;
        }

    },

    //eleme-do
    elemeGet:async (wxJSON, contentInfo) => {
       let userInfo = await wxMysql.bdmerFindUser(wxJSON.FromUserName);
        if(userInfo && userInfo.length !== 0){
            userInfo = userInfo[0];

            //是否绑定手机号码
            //判断手机号码是否绑定
            let isBindData = await eleme.isBind(userInfo.uid);

            if(isBindData.isBind !== '未失效'){
                if(/已失效/.test(isBindData.isBind)){
                    return `手机号码已经失效，请重新绑定\n菜单：一键优惠->获取点数`;
                }
                return `请先绑定手机号码\n菜单：一键优惠->获取点数`;
            }

            if(userInfo.point >= config.points.get){
                //领取红包 {url, mobile, nickname, province, city, sex, from}
                let getInfo = {};
                getInfo.url = contentInfo;
                getInfo.mobile = '18758896369';
                getInfo.nickname = `uid${userInfo.uid}`;
                getInfo.province = '神界';
                getInfo.city = '姜澜界';
                getInfo.sex = '太监';
                getInfo.from = '帮点儿忙';
                getInfo = await eleme.checkoutInfo(getInfo, "get");

                eleme.get(getInfo).then(
                    async function(data) {
                       //发送给用户模板信息
                        let wxRequestAPI = await getWxRequestAPI(config);
                        let dataMsg = {};
                        dataMsg.first = '';
                        dataMsg.key1 = '';
                        dataMsg.key2 = '';
                        dataMsg.key3 = '';
                        dataMsg.key4 = '';
                        dataMsg.remark = '';
                        dataMsg.url = '';

                        if(data.myCode === 0){
                            //预定义消耗的点数(领红包消耗8点数)
                            let point = -config.points.get;

                            if(userInfo.isVip === 0){
                                //不是VIP，点数减8
                                await wxMysql.bdmerUpdatePoint(point, config.points.get, userInfo.uid);
                                dataMsg.key1 = `消耗${config.points.get}点数\n结果：剩余${userInfo.point - config.points.get}点数`;
                            }else{
                                point=0;
                                dataMsg.key1 = `VIP领红包不消耗点数\n结果：剩余${userInfo.point}点数`;
                            }


                            //领取行为记录
                            let recordInfo = {};
                            recordInfo.uid = userInfo.uid;
                            recordInfo.eventDetail = userInfo.uid;
                            recordInfo.event = "GET";
                            recordInfo.getPoint = point;
                            await wxMysql.recordInsert(recordInfo);

                            logger.info(`领取红包成功-${userInfo.uid}`);
                            dataMsg.first = '领取红包成功，点击领取最大红包';
                            dataMsg.key2 = new Date().format("yyyy-MM-dd hh:mm:ss");
                            dataMsg.remark = `点击领取最大红包`;
                            dataMsg.url = reMsgConfig.elemeUrl.format(data.sn);
                            await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.success, dataMsg);

                            let redisInfo = await wxRedis.getUserBdmer(userInfo.openidWxWeb);
                            if(redisInfo){
                                redisInfo.point = redisInfo.point - config.points.get;
                                await wxRedis.updateUserBdmer(userInfo.openidWxWeb, redisInfo);
                            }

                        }else{
                            logger.error(`领取红包失败-${data.message}`);
                            dataMsg.first = '领取红包失败,先送你一个拆红包,点击领取';
                            dataMsg.key1 = `饿了么红包${data.sn}`;
                            dataMsg.key2 = data.message;
                            dataMsg.remark = `操作时间：${new Date().format("yyyy-MM-dd hh:mm:ss")}`;
                            //dataMsg.url = reMsgConfig.elemeUrl.format(data.sn);
                            dataMsg.url = reMsgConfig.chaiUrl;
                            await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.fail, dataMsg);
                        }
                    },
                    async function(err) {
                        logger.error(`领取红包失败-${err.message}`);
                        //发送给用户模板信息
                        let wxRequestAPI = await getWxRequestAPI(config);
                        let dataMsg = {};
                        dataMsg.first = '领取红包失败,先送你一个拆红包,点击领取';
                        dataMsg.key1 =  `饿了么领红包`;
                        dataMsg.key2 = err.message;
                        dataMsg.key3 = '';
                        dataMsg.key4 = '';
                        dataMsg.remark = '点击领取拆红包';
                        //dataMsg.url = 'https://bdmer.cn/wxWeb/course/get';
                        dataMsg.url = reMsgConfig.chaiUrl;
                        await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.fail, dataMsg);
                    }
                );

                return `正在为您领取💪...请稍等\n注意：建议在领取成功半小时之后点开红包链接，金额比较大`;
            }else{
                return `剩余点数:${userInfo.point}\n点数不足，请充值`;
            }
        }else {
            logger.error(`用户不存在${wxJSON.FromUserName}`);
            return `请先取消关注，再重新关注`;
        }
    },

    elemeChai:async (wxJSON, contentInfo) => {
        let userInfo = await wxMysql.bdmerFindUser(wxJSON.FromUserName);
        if(userInfo && userInfo.length !== 0){
            userInfo = userInfo[0];

            //是否绑定手机号码
            //判断手机号码是否绑定
            let isBindData = await eleme.isBind(userInfo.uid);


            if(isBindData.isBind !== '未失效'){
                if(/已失效/.test(isBindData.isBind)){
                    return `手机号码已经失效，请重新绑定\n菜单：一键优惠->获取点数`;
                }
                return `请先绑定手机号码\n菜单：一键优惠->获取点数`;
            }

            if(userInfo.point >= config.points.chai){
                //领取红包 {url, mobile, nickname, province, city, sex, from}
                let getInfo = {};
                getInfo.url = contentInfo;
                getInfo.mobile = '18758896369';
                getInfo.nickname = `uid${userInfo.uid}`;
                getInfo.province = '神界';
                getInfo.city = '姜澜界';
                getInfo.sex = '太监';
                getInfo.from = '帮点儿忙';
                getInfo = await eleme.checkoutInfo(getInfo, "chai");

                eleme.chai(getInfo).then(
                    async function(data) {
                        //发送给用户模板信息
                        let wxRequestAPI = await getWxRequestAPI(config);
                        let dataMsg = {};
                        dataMsg.first = '';
                        dataMsg.key1 = '';
                        dataMsg.key2 = '';
                        dataMsg.key3 = '';
                        dataMsg.key4 = '';
                        dataMsg.remark = '';
                        dataMsg.url = '';

                        if(data.myCode === 0){
                            //点数减10
                            await wxMysql.bdmerUpdatePoint(-config.points.chai, config.points.chai, userInfo.uid);

                            //领取行为记录
                            let recordInfo = {};
                            recordInfo.uid = userInfo.uid;
                            recordInfo.eventDetail = userInfo.uid;
                            recordInfo.event = "CHAI";
                            recordInfo.getPoint = -config.points.chai;
                            await wxMysql.recordInsert(recordInfo);

                            logger.info(`拆取红包成功-${userInfo.uid}`);
                            dataMsg.first = '拆取红包成功，点击查看';
                            dataMsg.key1 = `消耗${config.points.chai}点数\n结果：剩余${userInfo.point - config.points.chai}点数`;
                            dataMsg.key2 = new Date().format("yyyy-MM-dd hh:mm:ss");
                            dataMsg.remark = `点击查看`;
                            dataMsg.url = contentInfo;
                            await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.success, dataMsg);
                            let redisInfo = await wxRedis.getUserBdmer(userInfo.openidWxWeb);
                            if(redisInfo){
                                redisInfo.point = redisInfo.point - 10;
                                await wxRedis.updateUserBdmer(userInfo.openidWxWeb, redisInfo);
                            }

                        }else{
                            logger.error(`拆取红包失败-${data.message}`);
                            dataMsg.first = '拆取红包失败';
                            dataMsg.key1 = `饿了么拆红包`;
                            dataMsg.key2 = data.message;
                            dataMsg.remark = `操作时间：${new Date().format("yyyy-MM-dd hh:mm:ss")}`;
                            dataMsg.url = contentInfo;
                            await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.fail, dataMsg);
                        }
                    },
                    async function(err) {
                        logger.error(`拆取红包失败-${err.message}`);
                        //发送给用户模板信息
                        let wxRequestAPI = await getWxRequestAPI(config);
                        let dataMsg = {};
                        dataMsg.first = '拆取红包失败';
                        dataMsg.key1 =  `饿了么拆红包`;
                        dataMsg.key2 = err.message;
                        dataMsg.key3 = '';
                        dataMsg.key4 = '';
                        dataMsg.remark = '点击查看帮助文档';
                        dataMsg.url = 'https://bdmer.cn/wxWeb/course/chai';
                        await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.fail, dataMsg);
                    }
                );

                return `正在为您领取💪...请稍等`;
            }else{
                return `剩余点数:${userInfo.point}\n点数不足，请充值`;
            }
        }else {
            logger.error(`用户不存在${wxJSON.FromUserName}`);
            return `请先取消关注，再重新关注`;
        }
    },

    elemeBindPhone:async (wxJSON, contentInfo, isWeb=false) => {
        let userInfo = await wxMysql.bdmerFindUser(wxJSON.FromUserName);
        if(userInfo && userInfo.length !== 0){
            userInfo = userInfo[0];

            let info = {};
            info.uid = userInfo.uid;
            info.phone = contentInfo;
            info.type = 'bindPhone';

            //图片验证码
            let data = await eleme.bind(info);
            if(data.myCode === 2){
                if(!isWeb){
                    //上传推广图片
                    let wxRequestAPI = await getWxRequestAPI(config);
                    //提交素材
                    let media = await wxRequestAPI.uploadPictrueCode(userInfo.uid);
                    if(media && media.errcode){
                        logger.error(`上传素材错误-${media.errcode}-${media.errmsg}`);
                        return ``
                    }
                    data.message = media.media_id;
                    //发送图形验证码
                }
            }

            return data;
        }else {
            logger.error(`用户不存在${wxJSON.FromUserName}`);
            return {myCode:1, message:`请先取消关注，再重新关注`};
        }
    },

    //绑定pictrueCode
    elemeBindPictrueCode:async (wxJSON, contentInfo) => {
        let userInfo = await wxMysql.bdmerFindUser(wxJSON.FromUserName);
        if(userInfo && userInfo.length !== 0){
            userInfo = userInfo[0];

            let info = {};
            info.uid = userInfo.uid;
            info.pictrueCode = contentInfo;
            info.type = 'bindPictrueCode';

            //发送图片验证码
            let reMsg = await eleme.bind(info);

            return reMsg;
        }else {
            logger.error(`用户不存在${wxJSON.FromUserName}`);
            return `请先取消关注，再重新关注`;
        }
    },

    //绑定code
    elemeBindCode:async (wxJSON, contentInfo) => {
        let userInfo = await wxMysql.bdmerFindUser(wxJSON.FromUserName);
        if(userInfo && userInfo.length !== 0){
            userInfo = userInfo[0];

            let info = {};
            info.uid = userInfo.uid;
            info.code = contentInfo;
            info.type = 'bindCode';
            let resMsg = await eleme.bind(info);

            //成功后加次数
            if(/^绑定成功/.test(resMsg)){

                resMsg = `${resMsg}\n内容：增加${config.points.bind}点数\n结果：剩余${userInfo.point+config.points.bind}点数`;

                //成功后加次数(3点)
                await wxMysql.bdmerUpdatePoint(config.points.bind ,0, userInfo.uid);

                //推荐行为记录
                let recordInfo = {};
                recordInfo.uid = userInfo.uid;
                recordInfo.eventDetail = userInfo.uid;
                recordInfo.event = "BIND";
                recordInfo.getPoint = config.points.bind;
                await wxMysql.recordInsert(recordInfo);

                let redisInfo = await wxRedis.getUserBdmer(userInfo.openidWxWeb);
                if(redisInfo){
                    let strStart = resMsg.search(/\d{11}/);
                    let strEnd = strStart+11;
                    redisInfo.phone = resMsg.slice(strStart, strEnd);
                    redisInfo.point = redisInfo.point + config.points.bind;
                    redisInfo.isBind = '未失效';
                    await wxRedis.updateUserBdmer(userInfo.openidWxWeb, redisInfo);
                }

            }


            return resMsg;
        }else {
            logger.error(`用户不存在${wxJSON.FromUserName}`);
            return `请先取消关注，再重新关注`;
        }
    },

    //--event--//
    doSubscribe:async (wxJSON) => {
        /*处理订阅事件*/
        wxMysql.bdmerFindUser(wxJSON.FromUserName).then(
            async function(data) {
                if(data && data.length !== 0){
                    //取消订阅后又重新订阅
                    if(data[0].subscribe === 0){
                        await wxMysql.bdmerUpdateSubscribe(1, data[0].uid);
                        logger.info(`取消订阅后又重新订阅成功-${data[0].uid}`);
                    }else{
                        logger.info(`原本订阅成功-${data[0].uid}`);
                    }
                }else {
                    let wxRequestAPI = await getWxRequestAPI(config);
                    wxRequestAPI.getUserInfoOpenID(wxJSON.FromUserName).then(
                        async function(data) {
                            if(!data.errcode){
                                //插入wxWeb
                                await wxMysql.insertUser(data);

                                //插入bdmer
                                let fromUid = 0; //默认没有人推荐就是0
                                if(wxJSON.EventKey){
                                    fromUid = parseInt((wxJSON.EventKey).slice("qrscene_".length));
                                }
                                data.point = config.points.subscribe;
                                let {insertId} = await wxMysql.bdmerInsertUser(data , fromUid);

                                //推荐后操作
                                if(fromUid > 0){
                                    //推荐后加次数
                                    await wxMysql.bdmerUpdatePoint(config.points.invitation, 0, fromUid);
                                    //推荐后加邀请数
                                    await wxMysql.bdmerUpdateInvitationCount(1, fromUid);

                                    //推荐行为记录
                                    let recordInfo = {};
                                    recordInfo.uid = fromUid;
                                    recordInfo.eventDetail = insertId;
                                    recordInfo.event = "INVITATION";
                                    recordInfo.getPoint = config.points.invitation;
                                    await wxMysql.recordInsert(recordInfo);

                                    //查找from用户
                                    let fromUser =await wxMysql.bdmerFindUserUid(fromUid);
                                    if(fromUser && fromUser.length !== 0){
                                        fromUser = fromUser[0];
                                    }else{
                                        return;
                                    }

                                    let redisInfo = await wxRedis.getUserBdmer(fromUser.openidWxWeb);
                                    if(redisInfo){
                                        redisInfo.point = redisInfo.point + config.points.invitation;
                                        await wxRedis.updateUserBdmer(fromUser.openidWxWeb, redisInfo);
                                    }
                                }

                                logger.info(`订阅成功-${insertId}-${data.nickname}`);
                            }else{
                                logger.info(`获取用户信息失败-${data.errcode}-${data.errmsg}`);
                            }
                        },
                        async function(err) {
                            logger.info(`获取用户信息失败-${err.message}`);
                        }
                    );
                }
            },
            async function(err) {
                logger.info(`数据库查询用户失败-${err.message}`);
            }
        );


        return `欢迎关注！现拆红包服务免费使用，领红包服务发送订单号即可领取\n点击【帮助】->【新手教程】查看具体操作步骤。`;
    },

    doUnSubscribe:async (wxJSON) => {
        /*处理取消订阅事件*/
        wxMysql.bdmerFindUser(wxJSON.FromUserName).then(
            async function(data) {
                if(data && data.length !== 0){
                    //取消订阅
                    if(data[0].subscribe === 1){
                        //更新订阅
                        await wxMysql.bdmerUpdateSubscribe(0, data[0].uid);

                        //1天内取消关注
                        if((new Date().getTime() - data[0].createStamp) < (1*24*60*60*1000)){
                            //减少邀请数
                            if((data[0].point>config.points.invitation) && (data[0].fromUid > 0)){

                                //取消后fromUid变为原来的负数
                                await wxMysql.bdmerUpdateFromUid(-data[0].fromUid, data[0].uid);
                                //取消后减邀请数
                                await wxMysql.bdmerUpdateInvitationCount(-1, data[0].fromUid);

                                //取消后减点数
                                await wxMysql.bdmerUpdatePoint(-config.points.invitation , 0, data[0].fromUid);

                                //取消行为记录
                                let recordInfo = {};
                                recordInfo.uid = data[0].fromUid;
                                recordInfo.eventDetail = data[0].uid;
                                recordInfo.event = "CANCEL";
                                recordInfo.getPoint = -config.points.invitation;
                                await wxMysql.recordInsert(recordInfo);


                                //查找from用户
                                let fromUser = await wxMysql.bdmerFindUserUid(data[0].fromUid);
                                if(fromUser && fromUser.length !== 0){
                                    fromUser = fromUser[0];
                                }else{
                                    return;
                                }

                                let redisInfo = await wxRedis.getUserBdmer(fromUser.openidWxWeb);
                                if(redisInfo){
                                    redisInfo.point = redisInfo.point - config.points.invitation;
                                    await wxRedis.updateUserBdmer(fromUser.openidWxWeb, redisInfo);
                                }
                            }
                        }

                        logger.info(`订阅取消-${data[0].uid}`);
                    }else{
                        logger.info(`原本订阅取消-${data[0].uid}`);
                    }
                }else{
                    logger.info(`用户不存在-${wxJSON.FromUserName}`);
                }
            },
            async function(err) {
                logger.info(`数据库查询用户失败-${err.message}`);
            }
        );

        /*消息回复*/
        return ``;
    },

    doInvitation:async (wxJSON) => {
        let myDate = new Date();
        let qrcode = await wxMysql.qrcodeFindOpenid(wxJSON.FromUserName);
        //用户已有qrcode
        if(qrcode && qrcode.length !== 0){
            //判断二维码是否过期
            if(qrcode[0].ticketMsec !== 0){
                let data = myDate.getTime();
                if((myDate.getTime() - qrcode[0].ticketStamp) >= qrcode[0].ticketMsec){
                    let wxRequestAPI = await getWxRequestAPI(config);
                    //获取带参数二维码(30天有效期)
                    let ticket = await wxRequestAPI.getQrcodeTicket(qrcode[0].uid, config.qrcode.temporary, (30*24*60*60));
                    if(ticket && ticket.errcode){
                        logger.error(`上传素材错误-${media.errcode}-${media.errmsg}`);
                        return ``;
                    }

                    //生成推广图片
                    await doImage.createQr(ticket.url, qrcode[0].uid);
                    await doImage.addWater(path.join(__dirname, '../../../', `public/image/qrcode/water.png`), path.join(__dirname, '../../../', `public/image/qrcode/${qrcode[0].uid}.png`));

                    //上传推广图片
                    let media = await wxRequestAPI.uploadMediaImg(qrcode[0].uid);
                    if(media && media.errcode){
                        logger.error(`上传素材错误-${media.errcode}-${media.errmsg}`);
                        media.media_id = ``;
                    }

                    //更新素材
                    let ticketInfo = {};
                    ticketInfo.ticket =  ticket.ticket;
                    ticketInfo.url = ticket.url;
                    if(ticket.expire_seconds){
                        ticketInfo.ticketMsec = ticket.expire_seconds * 1000;
                    } else{
                        ticketInfo.ticketMsec = 0;
                    }
                    ticketInfo.ticketMsec = ticket.expire_seconds * 1000;
                    ticketInfo.ticketStamp = myDate.getTime();
                    ticketInfo.mediaId = media.media_id;
                    ticketInfo.mediaStamp = ticketInfo.ticketStamp;
                    await wxMysql.qrcodeUpDateTicket(ticketInfo, qrcode[0].uid);

                    return media.media_id;
                }
            }

            //判断素材是否过期(3天)
            if((myDate.getTime() - qrcode[0].mediaStamp) >= (3*24*60*60*1000)){
                let wxRequestAPI = await getWxRequestAPI(config);
                //重新提交素材
                let media = await wxRequestAPI.uploadMediaImg(qrcode[0].uid);
                if(media && media.errcode){
                    logger.error(`上传素材错误-${media.errcode}-${media.errmsg}`);
                    return ``
                }

                //更新素材
                let mediaInfo = {};
                mediaInfo.mediaId = media.media_id;
                mediaInfo.mediaStamp = myDate.getTime();
                await wxMysql.qrcodeUpDateMedia(mediaInfo, qrcode[0].uid);

                return media.media_id;
            }

            return qrcode[0].mediaId;

        }else{
            let wxRequestAPI = await getWxRequestAPI(config);

            //查找用户
            let userInfo = await wxMysql.bdmerFindUser(wxJSON.FromUserName);
            if(userInfo && userInfo.length === 0){
                logger.error(`用户不存在-${wxJSON.FromUserName}`);
                return ``;
            }

            //获取带参数二维码(30天)
            let ticket = await wxRequestAPI.getQrcodeTicket(userInfo[0].uid, config.qrcode.temporary, (30*24*60*60));
            if(ticket && ticket.errcode){
                logger.error(`上传素材错误-${media.errcode}-${media.errmsg}`);
                return ``;
            }

            //生成推广图片
            await doImage.createQr(ticket.url, userInfo[0].uid);
            await doImage.addWater(path.join(__dirname, '../../../', `public/image/qrcode/water.png`), path.join(__dirname, '../../../', `public/image/qrcode/${userInfo[0].uid}.png`));

            //上传推广图片
            let media = await wxRequestAPI.uploadMediaImg(userInfo[0].uid);
            if(media && media.errcode){
                logger.error(`上传素材错误-${media.errcode}-${media.errmsg}`);
                media.media_id = ``;
            }

            //插入推广图片
            qrcode = {};
            qrcode.uid = userInfo[0].uid;
            qrcode.openid = userInfo[0].openidWxWeb;
            qrcode.ticket = ticket.ticket;
            qrcode.url = ticket.url;
            if(ticket.expire_seconds){
                qrcode.ticketMsec = ticket.expire_seconds * 1000;
            } else{
                qrcode.ticketMsec = 0;
            }
            qrcode.ticketStamp = myDate.getTime();
            qrcode.mediaId = media.media_id;
            qrcode.mediaSatmp = qrcode.ticketStamp;
            await wxMysql.qrcodeInsert(qrcode);

            return media.media_id;
        }

       //消息回复
        return ``;
    },

    doGetHongBao:async (wxJSON) => {
        let userInfo = await wxMysql.bdmerFindUser(wxJSON.FromUserName);
        if(userInfo && userInfo.length !== 0){
            userInfo = userInfo[0];

            //是否绑定手机号码
            //判断手机号码是否绑定
            let isBindData = await eleme.isBind(userInfo.uid);

            if(isBindData.isBind !== '未失效'){
                if(/已失效/.test(isBindData.isBind)){
                    return `手机号码已经失效，请重新绑定\n菜单：一键优惠->获取点数`;
                }
                return `请先绑定手机号码\n菜单：一键优惠->获取点数`;
            }

            if(userInfo.point >= config.points.getBig){
                //领取红包 {url, mobile, nickname, province, city, sex, from}
                let getInfo = {};
                getInfo.url = '一键最佳';
                getInfo.mobile = '18758896369';
                getInfo.nickname = `uid${userInfo.uid}`;
                getInfo.province = '神界';
                getInfo.city = '姜澜界';
                getInfo.sex = '太监';
                getInfo.from = '帮点儿忙';
                getInfo = await eleme.checkoutInfo(getInfo, "get");

                eleme.get(getInfo).then(
                    async function(data) {
                        //发送给用户模板信息
                        let wxRequestAPI = await getWxRequestAPI(config);
                        let dataMsg = {};
                        dataMsg.first = '';
                        dataMsg.key1 = '';
                        dataMsg.key2 = '';
                        dataMsg.key3 = '';
                        dataMsg.key4 = '';
                        dataMsg.remark = '';
                        dataMsg.url = '';

                        if(data.myCode === 0){
                            //预定义消耗的点数(领红包消耗13点数)
                            let point = -config.points.getBig;

                            if(userInfo.isVip === 0){
                                //不是VIP，点数减13
                                await wxMysql.bdmerUpdatePoint(point, config.points.getBig, userInfo.uid);
                                dataMsg.key1 = `消耗${config.points.getBig}点数\n结果：剩余${userInfo.point - config.points.getBig}点数`;
                            }else{
                                point=0;
                                dataMsg.key1 = `VIP领红包不消耗点数\n结果：剩余${userInfo.point}点数`;
                            }


                            //领取行为记录
                            let recordInfo = {};
                            recordInfo.uid = userInfo.uid;
                            recordInfo.eventDetail = userInfo.uid;
                            recordInfo.event = "GET";
                            recordInfo.getPoint = point;
                            await wxMysql.recordInsert(recordInfo);

                            logger.info(`领取红包成功-${userInfo.uid}`);
                            dataMsg.first = '领取红包成功，点击领取最大红包';
                            dataMsg.key2 = new Date().format("yyyy-MM-dd hh:mm:ss");
                            dataMsg.remark = `点击领取最大红包`;
                            dataMsg.url = reMsgConfig.elemeUrl.format(data.sn);
                            await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.success, dataMsg);
                            let redisInfo = await wxRedis.getUserBdmer(userInfo.openidWxWeb);
                            if(redisInfo){
                                redisInfo.point = redisInfo.point - config.points.getBig;
                                await wxRedis.updateUserBdmer(userInfo.openidWxWeb, redisInfo);
                            }

                        }else{

                            if(!(/正在补充/.test(data.message))){
                                //领取4次，知道成功为止
                                for(let i=0; i<3; i++){
                                    data = await eleme.get(getInfo);
                                    if(data.myCode === 0 || /正在补充/.test(data.message)){
                                        break;
                                    }
                                }

                            }

                            if(data.myCode === 0){
                                //预定义消耗的点数(领红包消耗5点数)
                                let point = -config.points.getBig;

                                if(userInfo.isVip === 0){
                                    //不是VIP，点数减10
                                    await wxMysql.bdmerUpdatePoint(point, 10, userInfo.uid);
                                    dataMsg.key1 = `消耗${config.points.getBig}点数\n结果：剩余${userInfo.point - config.points.getBig }点数`;
                                }else{
                                    point=0;
                                    dataMsg.key1 = `VIP领红包不消耗点数\n结果：剩余${userInfo.point}点数`;
                                }

                                //领取行为记录
                                let recordInfo = {};
                                recordInfo.uid = userInfo.uid;
                                recordInfo.eventDetail = userInfo.uid;
                                recordInfo.event = "GET";
                                recordInfo.getPoint = point;
                                await wxMysql.recordInsert(recordInfo);

                                logger.info(`领取红包成功-${userInfo.uid}`);
                                dataMsg.first = '领取红包成功，点击领取最大红包';
                                dataMsg.key2 = new Date().format("yyyy-MM-dd hh:mm:ss");
                                dataMsg.remark = `点击领取最大红包`;
                                dataMsg.url = reMsgConfig.elemeUrl.format(data.sn);
                                await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.success, dataMsg);

                                let redisInfo = await wxRedis.getUserBdmer(userInfo.openidWxWeb);
                                if(redisInfo){
                                    redisInfo.point = redisInfo.point - config.points.getBig;
                                    await wxRedis.updateUserBdmer(userInfo.openidWxWeb, redisInfo);
                                }

                            }else{
                                logger.error(`领取红包失败-${data.message}`);
                                dataMsg.first = '领取红包失败,先送你一个拆红包,点击领取';
                                dataMsg.key1 = data.message;
                                dataMsg.key2 = '红包链接了不足';
                                dataMsg.remark = `操作时间：${new Date().format("yyyy-MM-dd hh:mm:ss")}`;
                                dataMsg.url = reMsgConfig.chaiUrl;
                                await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.fail, dataMsg);
                            }

                        }
                    },
                    async function(err) {
                        logger.error(`领取红包失败-${err.message}`);
                        //发送给用户模板信息
                        let wxRequestAPI = await getWxRequestAPI(config);
                        let dataMsg = {};
                        dataMsg.first = '领取红包失败,先送你一个拆红包,点击领取';
                        dataMsg.key1 =  `饿了么领红包`;
                        dataMsg.key2 = err.message;
                        dataMsg.key3 = '';
                        dataMsg.key4 = '';
                        dataMsg.remark = '点击领取拆红包';
                        //dataMsg.url = 'https://bdmer.cn/wxWeb/course/get';
                        dataMsg.url = reMsgConfig.chaiUrl;
                        await wxRequestAPI.sendTemplateMsg(userInfo.openidWxWeb, config.templateId.fail, dataMsg);
                    }
                );

                return `正在为您领取💪...请稍等\n注意：建议在领取成功半小时之后点开红包链接，金额比较大`;
            }else{
                return `剩余点数:${userInfo.point}\n点数不足，请充值`;
            }
        }else {
            logger.error(`用户不存在${wxJSON.FromUserName}`);
            return `请先取消关注，再重新关注`;
        }
    },

    //--bdmer--//
    getJsJDKConfig:async (url) => {
        try{
            let bdmer = await wxRedis.getAccessToken('bdmer');
            let jsJDKConfig = sign(bdmer.jsApiTicket, url);
            jsJDKConfig.appid = config.appId;
            jsJDKConfig.debug = false;
            jsJDKConfig.jsApiList = ['hideOptionMenu','hideAllNonBaseMenuItem','getLocation','openLocation','closeWindow'];
            return jsJDKConfig;
        }catch (e) {
            logger.error(`获取JsJDKConfig失败-${e.message}`);
            return {myCode:1, message:e.message};
        }
    },

    //用户授权（重定向）
    login:async (url) => {
        url = encodeURIComponent(`https://bdmer.cn/wxWeb/userCallBack?url=${url}`);
        return config.login.format(config.appId, url);
    },

    //用户授权（获取用户openid）
    getWebUserOpenid:async (code) => {
        let wxRequestAPI = await getWxRequestAPI(config);
        let userAccessToken = await wxRequestAPI.getUserAccessToken(code);

        return userAccessToken.openid;
    },


    //用户授权（获取用户信息（头像，名字））
    getWebUserInfo:async (openid) => {
        //先去redis查询
        let userInfo = await wxRedis.getUserBdmer(openid);
        if(!userInfo){
            //预定义redisInfo
            let redisInfo = {};
            redisInfo.updateStamp = new Date().getTime();

            //获取用户信息（微信）
            let wxRequestAPI = await getWxRequestAPI(config);
            let wxUserInfo = await wxRequestAPI.getUserInfoOpenID(openid);
            if(!wxUserInfo.errcode){
                redisInfo.unionid = wxUserInfo.unionid;
                redisInfo.nickname = wxUserInfo.nickname;
                redisInfo.sex = wxUserInfo.sex;
                redisInfo.headimgurl = wxUserInfo.headimgurl;

                //获取用户信息（帮点儿忙）
                let bdmerUserInfo = await wxMysql.bdmerFindUser(openid);
                if(bdmerUserInfo && bdmerUserInfo.length === 0){
                    //插入wxWeb
                    await wxMysql.insertUser(wxUserInfo);
                    //插入bdmer
                    let {insertId} = await wxMysql.bdmerInsertUser(wxUserInfo, 0);
                    redisInfo.uid = insertId;
                    redisInfo.point = 15;
                    redisInfo.invitationCount = 0;

                    logger.info(`网页“订阅”成功-${redisInfo.uid}-${redisInfo.nickname}`);
                }else{
                    bdmerUserInfo = bdmerUserInfo[0];
                    redisInfo.uid = bdmerUserInfo.uid;
                    redisInfo.point = bdmerUserInfo.point;
                    redisInfo.invitationCount = bdmerUserInfo.invitationCount;
                }

                //判断手机号码是否绑定
                let isBindData = await eleme.isBind(redisInfo.uid);
                redisInfo.phone = isBindData.phone;
                redisInfo.isBind = isBindData.isBind;

                //判断等级
                if(redisInfo.invitationCount >= 50){
                    redisInfo.grade = '爷爷';
                }else if(redisInfo.invitationCount < 50 && redisInfo.invitationCount >= 40){
                    redisInfo.grade = '钻石';
                } else if(redisInfo.invitationCount < 40 && redisInfo.invitationCount >= 30){
                    redisInfo.grade = '铂金';
                }else if(redisInfo.invitationCount < 30 && redisInfo.invitationCount >= 20){
                    redisInfo.grade = '黄金';
                }else if(redisInfo.invitationCount < 20 && redisInfo.invitationCount >= 10){
                    redisInfo.grade = '白银';
                }else if(redisInfo.invitationCount < 10 && redisInfo.invitationCount >= 0){
                    redisInfo.grade = '青铜';
                }

                //存储到redis
                await wxRedis.updateUserBdmer(openid, redisInfo);
                userInfo = redisInfo;

            }else{
                throw new Error (`获取用户信息失败-${wxUserInfo.errcode}-${wxUserInfo.errmsg}`);
            }
        }else{
            //直到2分钟才更新
            if((new Date().getTime() - userInfo.updateStamp) >= (2*30*1000)){
                let bdmerUserInfo = await wxMysql.bdmerFindUser(openid);
                if(bdmerUserInfo && bdmerUserInfo.length === 0){
                    logger.info(`用户不存在${openid}`);
                    return undefined;
                }else{
                    bdmerUserInfo = bdmerUserInfo[0];

                    userInfo.updateStamp = new Date().getTime();
                    userInfo.point = bdmerUserInfo.point;
                    userInfo.invitationCount = bdmerUserInfo.invitationCount;


                    //判断手机号码是否绑定
                    let isBindData = await eleme.isBind(userInfo.uid);
                    userInfo.phone = isBindData.phone;
                    userInfo.isBind = isBindData.isBind;

                    //判断等级
                    if(userInfo.invitationCount >= 50){
                        userInfo.grade = '爷爷';
                    }else if(userInfo.invitationCount < 50 && userInfo.invitationCount >= 40){
                        userInfo.grade = '钻石';
                    } else if(userInfo.invitationCount < 40 && userInfo.invitationCount >= 30){
                        userInfo.grade = '铂金';
                    }else if(userInfo.invitationCount < 30 && userInfo.invitationCount >= 20){
                        userInfo.grade = '黄金';
                    }else if(userInfo.invitationCount < 20 && userInfo.invitationCount >= 10){
                        userInfo.grade = '白银';
                    }else if(userInfo.invitationCount < 10 && userInfo.invitationCount >= 0){
                        userInfo.grade = '青铜';
                    }
                    //存储到redis
                    await wxRedis.updateUserBdmer(openid, userInfo);
                }
            }
        }

        return userInfo;
    },

    //获取payid
    getPayId:async (openid) => {
        let userInfo = await wxRedis.getUserBdmer(openid);
        if(!userInfo || !userInfo.payId){
            return undefined;
        }else{
            return userInfo.payId;
        }
    },

    //设置payid
    setPayId:async (openid, payId) => {
        let userInfo = await wxRedis.getUserBdmer(openid);

        if(userInfo){
            userInfo.payId = payId;
            await wxRedis.updateUserBdmer(openid, userInfo);
            return true;
        }
       return false;
    },

    //获取订单信息
    createOrderInfo:async (openid, money) => {
        let userInfo = await wxRedis.getUserBdmer(openid);
        if (!userInfo || !userInfo.payId) {
            return {return_code: 0, return_msg: '用户未登录'};
        }

        let wxRequestAPI = await getWxRequestAPI(config);

        //取消以前的订单
        let orderInfo = await orderRedis.getOrder(userInfo.payId);
        if(orderInfo){
            let closeInfo = {};
            closeInfo.payjs_order_id = orderInfo.payjs_order_id;

            let sign = `payjs_order_id=${closeInfo.payjs_order_id}&key=${config.mchidKey}`;
            closeInfo.sign = md5(sign).toUpperCase();
            await wxRequestAPI.closeOrder(closeInfo);
            logger.info(`取消订单${userInfo.payId}-${closeInfo.payjs_order_id}`);
        }

        //构建订单信息
        let createInfo = {};
        createInfo.attach = openid;
        createInfo.body = `充值点数`;
        createInfo.mchid = config.mchid;
        createInfo.notify_url = config.notify_url;
        createInfo.openid = userInfo.payId;
        createInfo.out_trade_no = uuid.v4().replace(/-/g, '');
        createInfo.total_fee = money;

        //签名算法
        let sign = '';
        const keys = Object.keys(createInfo);
        keys.sort();
        keys.forEach(key => {
            if (createInfo[key] && key !== 'sign') {
                sign = sign + key + '=' + createInfo[key] + '&';
            }
        });
        sign = sign + 'key=' + config.mchidKey;
        createInfo.sign = md5(sign).toUpperCase();

        //获取用户信息（微信）
        let data = await wxRequestAPI.createOrder(createInfo);
        if(data.data && data.data.payjs_order_id){
            let redisInfo = {};
            redisInfo.uid = userInfo.uid;
            redisInfo.createStamp = new Date().getTime();
            redisInfo.payjs_order_id = data.data.payjs_order_id;
            await orderRedis.updateOrder(userInfo.payId, redisInfo);
            data.data.payjs_order_id = '';
            logger.info(`创建订单成功${userInfo.payId}-${redisInfo.payjs_order_id}`)
        }else{
            return {return_code: 0, return_msg: '创建订单失败'};
        }

        return data.data;
    },

    //充值
    recharge:async (orderInfo) => {
        checkOrder(orderInfo, config.mchidKey).then(
            async function(data){
                //支付成功
                let userInfo = await wxRedis.getUserBdmer(data.openid);
                let orderInfo = await orderRedis.getOrder(data.payId);
                if(userInfo && orderInfo){
                    let point = data.money/10;

                    //money和点数对应规则
                    switch (point) {
                        case 10: point=10;break;
                        case 50: point=60;break;
                        case 100: point=150;break;
                        default:break;
                    }

                    //充值后加次数
                    await wxMysql.bdmerRechargePoint(point, userInfo.uid);

                    //充值行为记录
                    let recordInfo = {};
                    recordInfo.uid = userInfo.uid;
                    recordInfo.eventDetail = data.payjs_order_id;
                    recordInfo.event = "RECHARGE";
                    recordInfo.getPoint = point;
                    await wxMysql.recordInsert(recordInfo);

                    //发送充值通知
                    let dataMsg = {};
                    dataMsg.first = '充值成功';
                    dataMsg.key1 = `充值${point}点数\n结果：剩余${userInfo.point + point}点数`;
                    dataMsg.key2 = new Date().format("yyyy-MM-dd hh:mm:ss");
                    dataMsg.key3 = '';
                    dataMsg.key4 = '';
                    dataMsg.remark = `感谢您的支持！！！`;
                    dataMsg.url = 'https://bdmer.cn/bdmer/mine';
                    let wxRequestAPI = await getWxRequestAPI(config);
                    await wxRequestAPI.sendTemplateMsg(data.openid, config.templateId.success, dataMsg);

                    userInfo.point = userInfo.point + point;
                    await wxRedis.updateUserBdmer(data.openid, userInfo);
                    //删除已经支付的订单
                    await orderRedis.deleteOrder(data.payId);
                    logger.info(`充值成功-${userInfo.uid}-${data.money}`);
                }else{
                    logger.error(`支付失败-用户不存在-订单不存在-${data.openid}`);
                }
            },
            async function(err){
                //支付失败
                logger.error(`支付失败-${err.message}`);
                console.log(err);
                if(err.myCode !== 1 || err.payId){
                    await orderRedis.deleteOrder(err.payId)
                }
            }
        );

        return true;
    },

    //关闭订单
    closeOrder:async (orderId) => {
        let wxRequestAPI = await getWxRequestAPI(config);

        let closeInfo = {};
        closeInfo.payjs_order_id = orderId;
        let sign = `payjs_order_id=${closeInfo.payjs_order_id}&key=${config.mchidKey}`;
        closeInfo.sign = md5(sign).toUpperCase();
        logger.info(`手动取消订单-${orderId}`);

        let data = await wxRequestAPI.closeOrder(closeInfo);

        return data.data;
    },

    //获取活动信息
    activeInfo:async () => {
        let _sql = `SELECT uid,tempInvitationSuccess,tempInvitationFail FROM userBdmer WHERE tempInvitationSuccess!=?  ORDER BY tempInvitationSuccess DESC LIMIT ?`;
        let values = [0, 50];
        let data = await wxMysql.customQuery(_sql, values);

        return data;
    }
};