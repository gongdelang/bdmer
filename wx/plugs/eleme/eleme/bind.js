const ipPool = require('../../publicHelper/ipPool');
const logger = require('../../publicHelper/logger').getLogger('eleme');

const { Request } = require("../request/index");
const mysql = require('../mysql');
const redis = require('../redis/redis13');

const schedule1 = require('node-schedule');
const fs = require("fs");
const path = require('path');

/*管理员绑定使用*/
const timeout = require("../helper/timeout");
const { xunma } = require("../request/xunma");

var bindNum = 0;

async function autoBindPhone() {
    return new Promise(async (resolve, reject)=>{
        if(bindNum <= 10){
            bindNum++;
        }else{
            logger.info(`${bindNum}-有${bindNum}个分开正在抓取。`);
            resolve(`${bindNum}-有${bindNum}个分开正在抓取。`);
        }

        let bindNumT = bindNum;

        logger.info(`${bindNumT}-开始抓取10个号码`);

        const xunamGet = new xunma({
            uName: "feibao007",
            pWord: "feibao007..",
            Developer: "vZe9zNo87tjA8nq5WNHmzQ%3d%3d",
        });

        //讯码登陆
        await xunamGet.Login();
        logger.info(`${bindNumT}-讯码登陆`);

        for(let z=0; z<10; z++){

            //获取失效的cookie
            let cookies = await mysql.getCookieInvalidGet(1);

            if(cookies.length === 0){
                logger.info(`${bindNumT}-没有失效的cookie`);
                resolve(`${bindNumT}-没有失效的cookie`);
            }

            let getMobileCount = 0;
            let getNextNum = 0;
            let mobile = "";

            //保存get
            let j;
            for ( j = 0; getNextNum < cookies.length; j++) {

                if(/^\d{11}$/.test(mobile)){
                    let phoneList =  mobile + "-3361;";
                    let data = await xunamGet.releasePhone(phoneList);
                    console.log(data);
                    // logger.info(`释放号码${mobile}`);
                }

                //读取cookie;
                let data = {};
                data.sid = "";
                data.userid = "";
                data.trackid = "";
                data.phone = "";
                data.fromUid = 0;

                let request = new Request({
                    data: cookies[getNextNum].data,
                    openid: cookies[getNextNum].openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
                    sign: cookies[getNextNum].sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
                    sid: '' ,// 接码时传空
                    userid:'',
                    trackid: ''
                });

                //获取号码
                try {
                    if(cookies[getNextNum].phone !== '' && j<1 && getMobileCount < 1){
                        getMobileCount++;
                        mobile = await xunamGet.getPhoneP(cookies[getNextNum].phone);
                        if(mobile === ''){
                            getMobileCount++;
                            mobile = await xunamGet.getPhone();
                        }
                    }else{
                        mobile = await xunamGet.getPhone();
                    }

                    logger.info(`${bindNumT}-获取号码${mobile}`);
                    let res = await mysql.getCookiePhone(mobile);

                    if(mobile !== cookies[getNextNum].phone){
                        if(res.length !== 0){
                            //绑定后要1天后才能绑定
                            if((new Date().getTime() - res[0].bindStamp) <= (24*60*60*1000)){
                                logger.error(`${bindNumT}-号码重复，1天后才能绑定`);
                                continue;
                            }

                            if(res[0].getCode === 0){
                                logger.error(`${bindNumT}-号码重复，没失效`);
                                continue;
                            }
                        }
                    }else{
                        if(res.length > 1){
                            //绑定后要1天后才能绑定
                            if((new Date().getTime() - res[1].bindStamp) <= (24*60*60*1000)){
                                logger.error(`${bindNumT}-多于号码重复，1天后才能绑定`);
                                continue;
                            }

                            if(res[1].getCode === 0){
                                logger.error(`${bindNumT}-多于号码重复，没失效`);
                                continue;
                            }
                        }
                    }

                }catch (e) {
                    logger.error(`${bindNumT}-${e.message}`);
                    continue;
                }

                if(!(/^\d{11}$/.test(mobile))){
                    logger.error(`${bindNumT}-获取号码失败-没钱`);
                    xunamGet.Exit();
                    logger.info(`${bindNumT}-讯码退出`);
                    reject(`${bindNumT}-获取号码失败-没钱`);
                }

                await mysql.updateBindPhoneFailCount(cookies[getNextNum].id, mobile);
                //发送验证码
                let validateToken = await request.sendMobileCode(mobile);

                //需要图形验证码
                if(!validateToken){
                    let captchasInfo = await request.captchas(mobile);
                    let base64Data = captchasInfo.captcha_image.replace(/^data:image\/jpeg;base64,/, "");
                    let codeData = await xunamGet.dealPictrueCode(base64Data);
                    let captcha_value = codeData.Result;
                    logger.info(`${bindNumT}-验证码是${captcha_value}`);
                    let captcha_hash = captchasInfo.captcha_hash;
                    validateToken = await request.sendMobileCode(mobile, captcha_value, captcha_hash );
                }


                if (validateToken) {
                    //接收验证码
                    let code = "";
                    for (let i = 0; i < 3; i++) {
                        await timeout(6000);

                        try {
                            code = await xunamGet.getMessage(mobile);
                            if(/^\d{6}$/.test(code)){
                                break;
                            }
                        }catch (e) {
                            logger.error(`${bindNumT}-${e.message}`);
                        }

                    }

                    if(!(/^\d{6}$/.test(code))){
                        logger.error(`${bindNumT}-绑定号码失败-code错误`);
                        continue;
                    }

                    let userInfo = await request.loginByMobile(code);
                    if (userInfo.SID !== "") {
                        if (await request.changeMobile() == "") {
                            // 成功后将 getCookie() 内容写入文件里，以便以后用于领取
                            data.sid = userInfo.SID;
                            data.userid = userInfo.USERID;
                            data.trackid = userInfo.trackid;
                            data.phone = mobile;

                            await mysql.updateBind(cookies[getNextNum].id, data);
                            logger.info(`${bindNumT}-${cookies[getNextNum].id}-${mobile}绑定号码成功`);
                            getNextNum++;

                        } else {
                            logger.error(`${bindNumT}-一般不会失败，除非网络或其它原因`);
                        }
                    } else {
                        logger.error(`${bindNumT}-短信验证码不正确或其它错误，可以跳过，接下一个手机号`);
                    }
                } else {
                    logger.error(`${bindNumT}-需要图形验证码，可以跳过，接下一个手机号`);
                }
            }

            if(/^\d{11}$/.test(mobile)){
                let phoneList =  mobile + "-3361;";
                let data = await xunamGet.releasePhone(phoneList);
                console.log(data);
                // logger.info(`释放号码${mobile}`);
            }

            console.log(`${bindNumT}-请求次数${j}/成功次数${getNextNum}`);
        }
        xunamGet.Exit();
        logger.info(`${bindNumT}-讯码退出`);
        logger.info(`${bindNumT}-结束抓取号码`);
        bindNum--;
        resolve(`${bindNumT}-讯码退出`);
    });
}

//定时任务
//======================把每天绑定失效的cookie还原（让别人可以绑定）========================//
//每晚晚上00：30：00
const  scheduleCronstyleClearCookie = ()=>{
    //每晚凌晨触发执行一次:
    schedule1.scheduleJob('00 00 03 * * *',async ()=>{
        console.log('清除绑定开始');
        let keys = await redis.getKeys();
        for (let i = 0; i < keys.length; i++) {
            console.log(`redis-reset-hmset-${keys[i]}`);
            let cookie = redis.getUserCookie(keys[i]);
            await mysql.updateFailCount(cookie.id);
            await redis.deleteUserCookie(keys[i]);
        }
        console.log('清除绑定结束');
    });
};

scheduleCronstyleClearCookie();
console.log('每晚03：00：00清除未绑定手机号码启动');


let isCanBind = (cookieInfo, uid) => {
    if(cookieInfo.fromUid !== 0){
        //绑定后要1天后才能绑定
        if((new Date().getTime() - cookieInfo.bindStamp) <= (4*60*60*1000)){
            return false;
        }

        if(cookieInfo.fromUid === uid){
            //没有失效，不能重新绑定
            if((cookieInfo.getCode === 0) && (cookieInfo.failCount !== 6)){
                return false;
            }
        }else{
            if((cookieInfo.getCode === 0)){
                return false;
            }
        }
    }

    return true;
};

module.exports = {
    isBind:async (uid) => {
        //判断cookie是否失效
        let cookieInfo = await mysql.getCookieFromUid(uid);
        if((cookieInfo.length !==0) && (!isCanBind(cookieInfo[0], uid))){
            return {phone:cookieInfo[0].phone,isBind:'未失效'};
        }

        if(cookieInfo.length ===0){
            return {phone:'空',isBind:`未绑定，绑定后可获得5点数。`};
        }else {
            return {phone:cookieInfo[0].phone,isBind:`已失效，重新绑定再拿5点。`};
        }
    },

    bindPhone:async (uid, phone) => {
        //先清除上一次数据
        let preCookie = await redis.getUserCookie(uid);
        if(preCookie){
            await redis.deleteUserCookie(uid);
            await mysql.updateFailCount(preCookie.id);
        }


        //判断手机号码是否重复
        let cookieInfoPhone = await mysql.getCookiePhone(phone);
        if(cookieInfoPhone && cookieInfoPhone.length !== 0){
            for(let i=0; i<cookieInfoPhone.length; i++){
                if(cookieInfoPhone[i].fromUid !== uid){
                    if(!(isCanBind(cookieInfoPhone[i], cookieInfoPhone[i].fromUid)) || (cookieInfoPhone[i].getCode === 0) || ((cookieInfoPhone[i].getCode === 1) && (cookieInfoPhone[i].failCount<5)) ){
                        return {myCode:1, message:`手机号：${phone}\n无法绑定，手机号已被别人绑定`};
                    }
                }
            }
        }

        //获取失效的cookie
        let cookieInfo = await mysql.getCookieFromUid(uid);
        if(cookieInfo.length === 0){
            cookieInfo = await mysql.getCookieInvalidGet(1);
            if(cookieInfo.length === 0){
                return {myCode:1, message:`系统cookie不足，目前不能绑定`};
            }
        }
        cookieInfo = cookieInfo[0];

        //判断是否可以绑定
        if(!isCanBind(cookieInfo, cookieInfo.fromUid)){
            return {myCode:1, message:`已绑定的${cookieInfo.phone}未失效，不能重重新绑定`};
        }

        //绑定次数不得超过20(20天内超过20次绑定)
        if(cookieInfo.bindCount >= 100 && (new Date().getTime() - cookieInfo.createStamp > 20*24*60*60*1000)){
            return {myCode:1, message:`该cookie无效，暂时无法绑定，请联系客服修改`};

        }

        cookieInfo.phone = phone;

        //获取验证码
        let request = new Request({
            data: cookieInfo.data,
            openid: cookieInfo.openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
            sign: cookieInfo.sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
            sid: '' ,// 接码时传空
            userid:'',
            trackid: ''
        });

        //发送验证码
        console.log(`开始绑定手机：${phone}`);

        cookieInfo.validateToken = await request.sendMobileCode(cookieInfo.phone);
        await mysql.updateBindPhoneFailCount(cookieInfo.id, phone);

        if(cookieInfo.validateToken){//防止其他人使用
            //存入redis
            await redis.updateUserCookie(uid, cookieInfo);
            return {myCode:0, message:`请发送饿了么短信验证码`};
        }else{
            //需要图形验证码
            console.log(`${uid}需要图形验证码`);
            let captchasInfo = await request.captchas(cookieInfo.phone);
            let base64Data = captchasInfo.captcha_image.replace(/^data:image\/jpeg;base64,/, "");
            fs.writeFileSync(path.join(__dirname, '../../../', `public/image/pictrueCode/${uid}.jpeg`), base64Data, 'base64');

            //写入redis
            cookieInfo.validateToken = '';
            cookieInfo.captcha_hash = captchasInfo.captcha_hash;
            //cookieInfo.captcha_value = ''
            await redis.updateUserCookie(uid, cookieInfo);
            return {myCode:2, message:captchasInfo.captcha_image};
        }
    },

    bindPictrueCode:async (uid, pictrueCode) => {
        let cookieInfo = await redis.getUserCookie(uid);

        if(!cookieInfo){
            return `请先发送：“绑定：手机号码”，再发送验证码绑定`;
        }
        let phone = cookieInfo.phone;

        //获取验证码
        let request = new Request({
            data: cookieInfo.data,
            openid: cookieInfo.openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
            sign: cookieInfo.sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
            sid: '' ,// 接码时传空
            userid:'',
            trackid: ''
        });

        let captcha_value = pictrueCode;
        let captcha_hash = cookieInfo.captcha_hash;
        cookieInfo.validateToken = await request.sendMobileCode(phone, captcha_value, captcha_hash);
        if(cookieInfo.validateToken){
            //存入redis
            await redis.updateUserCookie(uid, cookieInfo);
            return `请发送饿了么短信验证码`;
        }else{
            //从redis删除phone
            await redis.deleteUserCookie(uid);
            //释放cookie （mysql）
            await mysql.updateFailCount(cookieInfo.id);
            return `图形验证码错误，请刷新验证码，重新绑定`;
        }

    },

    bindCode:async (uid, code) => {
        let cookieInfo = await redis.getUserCookie(uid);

        if(!cookieInfo){
            return `请先“提交：手机号码”，再发送验证码绑定`;
        }
        let phone = cookieInfo.phone;

        //获取验证码
        let request = new Request({
            data: cookieInfo.data,
            openid: cookieInfo.openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
            sign: cookieInfo.sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
            sid: '' ,// 接码时传空
            userid:'',
            trackid: ''
        });

        request.mobile = cookieInfo.phone;
        request.validateToken = cookieInfo.validateToken;

        let userInfo = await request.loginByMobile(code);

        //从redis删除cookie
        await redis.deleteUserCookie(uid);

        if (userInfo.SID !== "") {
            if (await request.changeMobile() == "") {
                // 成功后将 getCookie() 内容写入文件里，以便以后用于领取
                cookieInfo.sid = userInfo.SID;
                cookieInfo.userid = userInfo.USERID;
                cookieInfo.trackid = userInfo.trackid;
                cookieInfo.fromUid = uid;

                await mysql.updateBind(cookieInfo.id, cookieInfo);
                return `绑定成功：${phone}`;
            } else {
                //释放cookie （mysql）
                await mysql.updateFailCount(cookieInfo.id);
                return `cookie出错\n请联系管理员`;
            }
        } else {
            //释放cookie （mysql）
            await mysql.updateFailCount(cookieInfo.id);
            return `验证码错误\n请重新绑定`;
        }

    },

    /*管理于员绑定*/
    adminBindPhone:async (name) => {
        //先清除上一次数据
        let preCookie = await redis.getUserCookie(name);
        if(preCookie){
            await redis.deleteUserCookie(name);
            await mysql.updateFailCount(preCookie.id);
        }

        //获取失效的cookie
        let cookieInfo = await mysql.getCookieInvalidGet(1);
        if(cookieInfo && cookieInfo.length !== 0){
            cookieInfo = cookieInfo[0];
        }else{
            return {myCode:1, message:`没有失效的cookie`};
        }


        //-------讯码获取号码，抓号码------//
        let mobile = "";
        let getMobileCount = 0;

        const xunamGet = new xunma({
            uName: "feibao007",
            pWord: "feibao007..",
            Developer: "vZe9zNo87tjA8nq5WNHmzQ%3d%3d",
        });

        //讯码登陆
        await xunamGet.Login();
        console.log(`讯码登陆`);

        //抓号码(15次)
        for ( let j = 0; j < 15; j++) {

            if(/^\d{11}$/.test(mobile)){
                let phoneList =  mobile + "-3361;";
                let data = await xunamGet.releasePhone(phoneList);
                console.log(data);
            }

            //获取号码
            try {
                if(cookieInfo.phone !== '' && getMobileCount<1){
                    getMobileCount++;
                    mobile = await xunamGet.getPhoneP(cookieInfo.phone);
                    if(mobile === ''){
                        console.log(`获取自身号码失败`);
                        console.log(`获取其他`);
                        mobile = await xunamGet.getPhone();
                    }
                }else{
                    console.log(`获取其他`);
                    mobile = await xunamGet.getPhone();
                }

                console.log(`获取号码${mobile}`);
                let res = await mysql.getCookiePhone(mobile);

                if(mobile !== cookieInfo.phone){
                    if(res.length !== 0){
                        console.log(`其他号码重复`);
                        mobile = '';
                        continue;
                    }
                }else{
                    if(res.length > 1){
                        console.log(`自身号码重复`);
                        mobile = '';
                        continue;
                    }
                }
            }catch (e) {
                console.log(e.message);
                continue;
            }

            if(!(/^\d{11}$/.test(mobile))){
                xunamGet.Exit();
                return {myCode:1, message:`重复号码超过15个，要不就是-没钱，再试试,`};
            }else{
                break;
            }
        }

        cookieInfo.phone = mobile;

        //抓sid
        let request = new Request({
            data: cookieInfo.data,
            openid: cookieInfo.openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
            sign: cookieInfo.sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
            sid: '' ,// 接码时传空
            userid:'',
            trackid: ''
        });

        //绑定开始
        cookieInfo.validateToken = await request.sendMobileCode(cookieInfo.phone);
        await mysql.updateBindPhoneFailCount(cookieInfo.id, mobile);

        if(cookieInfo.validateToken){
            //接收验证码
            let code = "";
            for (let i = 0; i < 3; i++) {
                await timeout(5000);

                try {
                    code = await xunamGet.getMessage(mobile);
                    if(/^\d{6}$/.test(code)){
                        break;
                    }
                }catch (e) {
                    console.log(e.message);
                }
            }

            //释放手机号码
            if(/^\d{11}$/.test(mobile)){
                let phoneList =  mobile + "-3361;";
                let data = await xunamGet.releasePhone(phoneList);
                console.log(data);
            }
            xunamGet.Exit();
            console.log(`获取code完毕讯码退出`);

            if(!(/^\d{6}$/.test(code))){
                console.log(`${name}绑定号码失败-code错误`);
                return {myCode:1, message:`绑定号码失败-code错误-重来`};
            }

            //抓取
            let userInfo = await request.loginByMobile(code);
            if (userInfo.SID !== "") {
                if (await request.changeMobile() == "") {
                    // 成功后将 getCookie() 内容写入文件里，以便以后用于领取
                    cookieInfo.sid = userInfo.SID;
                    cookieInfo.userid = userInfo.USERID;
                    cookieInfo.trackid = userInfo.trackid;
                    cookieInfo.fromUid = 0;

                    await mysql.updateBind(cookieInfo.id, cookieInfo);
                    return {myCode:0, message:`绑定成功：${cookieInfo.id}-${mobile}`};

                } else {
                    //释放cookie （mysql）
                    await mysql.updateFailCount(cookieInfo.id);
                    return {myCode:1, message:`cookie出错${cookieInfo.id}`};
                }
            } else {
                //释放cookie （mysql）
                await mysql.updateFailCount(cookieInfo.id);
                return `验证码错误\n请重新绑定`;
                return {myCode:1, message:`验证码错误,再来${cookieInfo.id}-${code}`};
            }
        }else{


            //释放手机号码
            if(/^\d{11}$/.test(mobile)){
                let phoneList =  mobile + "-3361;";
                let data = await xunamGet.releasePhone(phoneList);
                console.log(data);
            }
            xunamGet.Exit();
            console.log(`获取code完毕讯码退出`);

            //需要图形验证码
            console.log(`${name}需要图形验证码`);
            let captchasInfo = await request.captchas(cookieInfo.phone);

            //写入redis
            cookieInfo.validateToken = '';
            cookieInfo.captcha_hash = captchasInfo.captcha_hash;
            //cookieInfo.captcha_value = '';
            await redis.updateUserCookie(name, cookieInfo);
            return {myCode:2, message:captchasInfo.captcha_image};
        }
    },

    adminBindPictrueCode:async (name, pictrueCode) => {
        let cookieInfo = await redis.getUserCookie(name);

        if(!cookieInfo){
            return {myCode:1, message:`请别搞我！`};
        }

        //从redis删除phone
        await redis.deleteUserCookie(name);

        const xunamGet = new xunma({
            uName: "feibao007",
            pWord: "feibao007..",
            Developer: "vZe9zNo87tjA8nq5WNHmzQ%3d%3d",
        });

        //讯码登陆
        await xunamGet.Login();
        console.log(`讯码登陆`);

        //获取指定手机号码
        let mobile = await xunamGet.getPhoneP(cookieInfo.phone);
        console.log(`获取号码${mobile}`);
        if(mobile === ''){
            xunamGet.Exit();
            console.log(`获取code完毕讯码退出`);
            return {myCode:1, message:`讯码获取指定手机号码失败，再来！`};
        }


        //获取验证码
        let request = new Request({
            data: cookieInfo.data,
            openid: cookieInfo.openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
            sign: cookieInfo.sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
            sid: '' ,// 接码时传空
            userid:'',
            trackid: ''
        });

        let captcha_value = pictrueCode;
        let captcha_hash = cookieInfo.captcha_hash;
        cookieInfo.validateToken = await request.sendMobileCode(mobile, captcha_value, captcha_hash);
        if(cookieInfo.validateToken){
            //接收验证码
            let code = "";
            for (let i = 0; i < 3; i++) {
                await timeout(6000);

                try {
                    code = await xunamGet.getMessage(mobile);
                    if(/^\d{6}$/.test(code)){
                        break;
                    }
                }catch (e) {
                    console.log(e.message);
                }
            }

            //释放手机号码
            if(/^\d{11}$/.test(mobile)){
                let phoneList =  mobile + "-3361;";
                let data = await xunamGet.releasePhone(phoneList);
                console.log(data);
            }
            xunamGet.Exit();
            console.log(`获取code完毕讯码退出`);

            if(!(/^\d{6}$/.test(code))){
                console.log(`${name}绑定号码失败-code错误`);
                await mysql.updateFailCount(cookieInfo.id);
                return {myCode:1, message:`绑定号码失败-code错误-重来`};
            }

            //抓取
            let userInfo = await request.loginByMobile(code);
            if (userInfo.SID !== "") {
                if (await request.changeMobile() == "") {
                    // 成功后将 getCookie() 内容写入文件里，以便以后用于领取
                    cookieInfo.sid = userInfo.SID;
                    cookieInfo.userid = userInfo.USERID;
                    cookieInfo.trackid = userInfo.trackid;
                    cookieInfo.fromUid = 0;

                    await mysql.updateBind(cookieInfo.id, cookieInfo);

                    return {myCode:0, message:`绑定成功：${cookieInfo.id}-${mobile}`};

                } else {
                    //释放cookie （mysql）
                    await mysql.updateFailCount(cookieInfo.id);
                    return {myCode:1, message:`cookie出错${cookieInfo.id}`};
                }
            } else {
                //释放cookie （mysql）
                await mysql.updateFailCount(cookieInfo.id);
                return `验证码错误\n请重新绑定`;
                return {myCode:1, message:`验证码错误,再来${cookieInfo.id}-${code}`};
            }
        }else{
            //释放手机号码
            if(/^\d{11}$/.test(mobile)){
                let phoneList =  mobile + "-3361;";
                let data = await xunamGet.releasePhone(phoneList);
                console.log(data);
            }
            xunamGet.Exit();
            console.log(`验证码错误-讯码退出`);

            //释放cookie （mysql）
            console.log(`${name}-图形验证码都会输入错误，你个大傻逼!`);
            await mysql.updateFailCount(cookieInfo.id);
            return {myCode:1, message:`${name}-图形验证码都会输入错误，你个大傻逼!`};
        }

    },

    bindAuto:async (Num) => {
        if(Num === 'start'){
            autoBindPhone();
            return {myCode:0, message:`暂时补充号码开始,当前多开数为：${bindNum}`};
        }else{
            let num = parseInt(Num);
            if(typeof(num) === "number"){
                bindNum = num;
                return {myCode:0, message:`自动抓取${num}设置成功，当前多开数为：${bindNum}`}
            }else {
                bindNum = 11;
                return {myCode:1, message:`自动抓取号码关闭-当前多开数为：${bindNum}`}
            }
        }
    },

    bindAutoFun:async ()=>{
        logger.info('公众号开始抓取号码');
        autoBindPhone();
    }

};