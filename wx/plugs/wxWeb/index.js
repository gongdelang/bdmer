const logger = require('../publicHelper/logger').getLogger('wxWeb');

const format = require('../publicHelper/format');
const config = require("./config");
const helper = require('./helper');

const schedule = require('node-schedule');
const sha1 = require('sha1');
//======================获取最新的access_token========================//
//每1小时55分
const  scheduleCronstyleAccessToken = ()=>{
    //每小时的1分30秒触发
    schedule.scheduleJob('0 0 * * * *',async ()=>{
        await helper.renovateAccessToken();
    });
};

(async ()=> {
    scheduleCronstyleAccessToken();
    await helper.renovateAccessToken();
    console.log('每小时00秒,更新access_token开启成功');
})();

//======================wxWebAPI========================//
module.exports = {
    //--管理员网页部分start--//
    //公众号服务器验证
    verify:async (verifyInfo) => {
        let token = config.token;
        let signature = verifyInfo.signature;
        let nonce = verifyInfo.nonce;
        let timestamp = verifyInfo.timestamp;
        let str = [token, timestamp, nonce].sort().join('');

        let sha = sha1(str);

        if (sha === signature) {
            logger.info(`验证成功`);
            return true;
        }

        return false;
    },

    //更新access_token
    updateAccessToken:async ()=>{
        return await helper.renovateAccessToken();
    },

    //创建菜单
    createMenu:async (menuConfig)=>{
        let wxRequestAPI = await helper.getWxRequestAPI();

        /**自定义菜单**/
        try{
            let menu = {};
            if(menuConfig === ""){
                menu = JSON.parse(config.menu);
            }else{
                menu = JSON.parse(menuConfig);
            }

            let data = await wxRequestAPI.createMenu(menu);
            if(data.errcode === 0){
                logger.info(`更新菜单成功-${data.errcode}-${data.errmsg}`);
            }else{
                logger.info(`更新菜单失败-${data.errcode}-${data.errmsg}`);
            }

            return data;
        }catch(e){
            logger.error(`更新菜单失败-${e.message}`);
        }
    },

    //获取菜单
    getMenu:async ()=>{
        let wxRequestAPI = await helper.getWxRequestAPI();

        try{
            let data = await wxRequestAPI.getMenu();
            if(!data.errcode){
                logger.info(`获取菜单成功`);
            }else{
                logger.info(`获取菜单失败-${data.errcode}-${data.errmsg}`);
            }

            return data;
        }catch(e){
            logger.error(`获取菜单失败-${e.message}`);
        }
    },
    //--管理员网页部分end--//



    //--公众号部分start--//
    //处理text消息
    toDoText:async (wxJSON)=>{
        try{
            /*消息排重*/
            if(!helper.isRepeat(wxJSON)){
                logger.info(`消息重复`);
                return '';
            }

            /*预定义回复变量*/
            let reMsg = '';

            /*处理红包*/
            let contentType = helper.getContentType(wxJSON.Content);
            if(contentType > 0){
                let contentInfo = helper.getInfo(wxJSON.Content, contentType);
                //领取红包
                if(contentType === 1 || contentType === 2 || contentType === 3){
                    reMsg = await helper.elemeGet(wxJSON,contentInfo );
                    reMsg = reMsg;
                }
                //拆红包
                else if(contentType === 4){
                    reMsg = await helper.elemeChai(wxJSON, contentInfo);
                    reMsg = reMsg;
                }
                //绑定手机-phone
                else if(contentType === 5){
                    let bindPhoneData = await helper.elemeBindPhone(wxJSON, contentInfo);
                    if(bindPhoneData.myCode === 2){
                        return helper.replayMsg(wxJSON.FromUserName, bindPhoneData.message, 'image');
                    }else{
                        reMsg = bindPhoneData.message;
                    }
                }
                //绑定手机-code
                else if(contentType === 6){
                    reMsg = await helper.elemeBindCode(wxJSON, contentInfo);
                }
                //绑定手机-pictrueCode
                else if(contentType === 7){
                    reMsg = await helper.elemeBindPictrueCode(wxJSON, contentInfo);
                }
            }else if(wxJSON.Content ==='拆'){
                reMsg = '点击下面链接获取拆红包\nhttps://h5.ele.me/grouping/?from=share';
            }

            return helper.replayMsg(wxJSON.FromUserName, reMsg, 'text');
        }catch(e){
            return helper.replayMsg(wxJSON.FromUserName, e.message, 'text');
        }
    },

    //处理Link消息
    toDoLink:async (wxJSON)=>{
        try{
            /*消息排重*/
            if(!helper.isRepeat(wxJSON)){
                logger.info(`消息重复`);
                return '';
            }

            /*预定义回复变量*/
            let reMsg = '';

            /*处理红包*/
            let contentType = helper.getContentType(wxJSON.Url);
            if(contentType > 0){
                let contentInfo = helper.getInfo(wxJSON.Url, contentType);
                //领取红包
                if(contentType === 1 || contentType === 2){
                    reMsg = await helper.elemeGet(wxJSON,contentInfo );
                    reMsg = reMsg;
                }
                //拆红包
                else if(contentType === 4){
                    reMsg = await helper.elemeChai(wxJSON, contentInfo);
                    reMsg = reMsg;
                }

                else{
                    reMsg = ``;
                }
            }

            return helper.replayMsg(wxJSON.FromUserName, reMsg, 'text');
        }catch(e){
            return helper.replayMsg(wxJSON.FromUserName, e.message, 'text');
        }
    },

    //处理event消息
    toDoEvent:async (wxJSON)=>{
        try{
            /*消息排重*/
            if(!helper.isRepeat(wxJSON)){
                logger.info(`消息重复`);
                return '';
            }

            let reMsg = '';
            switch (wxJSON.Event) {
                case 'subscribe':reMsg = await helper.doSubscribe(wxJSON);break;
                case 'unsubscribe':reMsg = await  helper.doUnSubscribe(wxJSON);break;
                case 'CLICK':
                    switch (wxJSON.EventKey) {
                        case 'invitation':reMsg = await helper.doInvitation(wxJSON);break;
                        case 'getHongBao':reMsg = await helper.doGetHongBao(wxJSON);break;
                        case 'chaiUrl':reMsg = '点击下面链接获取拆红包\nhttps://h5.ele.me/grouping/?from=share';
                        default:break;
                    };
                    break;
                default:break;
            }

            if(wxJSON.EventKey === 'invitation'){
                /*回复图片消息*/
                if(reMsg !== ''){
                    return helper.replayMsg(wxJSON.FromUserName, reMsg, 'image');
                }else{
                    reMsg = '服务错误';
                }
            }

            /*回复文本消息*/
            return helper.replayMsg(wxJSON.FromUserName, reMsg, 'text');


        }catch(e){
            logger.error(`处理event消息失败-${e.message}`);
            return '';
        }
    },
    //--公众号部分end--//



    //--用户网页部分start--//
    getJsJDKConfig:async (url)=>{
        return await helper.getJsJDKConfig(url);
    },

    //用户授权（重定向）
    login:async (url)=>{
        try{
            return await helper.login(url);
        }catch (e) {
            logger.error(`获取用户信息失败-${e.message}`);
            return '/';
        }
    },

    //用户授权（获取用户openid）
    getWebUserOpenid:async (code)=>{
        try{
            return await helper.getWebUserOpenid(code);
        }catch (e) {
            logger.error(`获取用户openid失败-${e.message}`);
            return undefined;
        }
    },

    //用户授权（获取用户openid）
    getWebUserInfo:async (openid)=>{
        try{
            return await helper.getWebUserInfo(openid);
        }catch (e) {
            logger.error(`获取用户信息失败-${e.message}`);
            return undefined;
        }
    },

    //获取payId
    getPayId:async (openid)=>{
        try{
            return await helper.getPayId(openid);
        }catch (e) {
            logger.error(`${openid}-获取支付id失败-${e.message}`);
            return undefined;
        }
    },

    //设置payId
    setPayId:async (openid, payId)=>{
        try{
            return await helper.setPayId(openid, payId);
        }catch (e) {
            logger.error(`${openid}-设置支付id失败-${e.message}`);
            return false;
        }
    },

    //创建订单信息
    createOrderInfo:async (openid, money)=>{
        try{
            return await helper.createOrderInfo(openid, money);
        }catch (e) {
            logger.error(`${openid}-获取支付信息失败-${e.message}`);
            return {return_code:0, return_msg:e.message};
        }
    },

    //充值
    recharge:async (orderInfo)=>{
        try{
            return await helper.recharge(orderInfo);
        }catch (e) {
            logger.error(`${orderInfo}-充值失败-${e.message}`);
            return false;
        }
    },

    //关闭订单
    closeOrder:async (orderId)=>{
        try{
            return await helper.closeOrder(orderId);
        }catch (e) {
            logger.error(`${orderId}-手动关闭订单失败-${e.message}`);
            return {myCode:1, message:`手动关闭订单失败-${e.message}`};
        }
    },

    //绑定手机-号码
    webBindPhone:async (openid, postInfo)=>{
        try{
            //为了满足以前的接口参数
            postInfo.FromUserName = openid;
            return await helper.elemeBindPhone(postInfo, postInfo.phone, true);
        }catch (e) {
            logger.error(`${openid}-绑定手机号码失败-${e.message}`);
            return {myCode:1, message:`绑定手机号码失败-${e.message}`};
        }
    },

    webBindPictrueCode:async (openid, postInfo)=>{
        try{
            let res = {};
            //为了满足以前的接口参数
            postInfo.FromUserName = openid;
            res.message = await helper.elemeBindPictrueCode(postInfo, postInfo.pictrueCode);
            if(/^请发送饿了么短信验证码/.test(res.message)){
                res.myCode = 0;
            }else{
                res.myCode = 1;
            }

            return res;
        }catch (e) {
            logger.error(`${openid}-绑定手机号码失败-${e.message}`);
            return {myCode:1, message:`绑定手机号码失败-${e.message}`};
        }
    },

    webBindCode:async (openid, postInfo)=>{
        try{
            let res = {};
            //为了满足以前的接口参数
            postInfo.FromUserName = openid;

            res.message = await helper.elemeBindCode(postInfo, postInfo.code);
            if(/^绑定成功/.test(res.message)){
                res.myCode = 0;
            }else{
                res.myCode = 1;
            }
            return res;
        }catch (e) {
            logger.error(`${openid}-绑定手机号码失败-${e.message}`);
            return {myCode:1, message:`绑定手机号码失败-${e.message}`};
        }
    },

    activeInfo:async ()=>{
        try{
            let res = {};
            res.data = await helper.activeInfo();
            return res;
        }catch (e) {
            logger.error(`获取活动信息失败-${e.message}`);
            return {data:[]};
        }
    },
    //--用户网页部分end--//


};