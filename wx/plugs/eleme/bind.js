const logger  = require("../publicHelper/logger").getLogger('eleme');

const { Request } = require("./request/index");
const { xunma } = require("./request/xunma");
const timeout = require("./helper/timeout");
const mysql = require("./mysql");
const { Disman } = require("./request/disman");

const fs = require("fs");

// 以下逻辑可以套在循环里，实现自动接码
(async () => {

    //获取失效的cookie
    let cookies = await mysql.getCookieInvalidGet(50);
    //let cookies = await mysql.getCookieInvalidChai(100);

    if(cookies.length === 0){
        logger.info(`没有失效的cookie`);
        return;
    }

    let getMobileCount = 0;
    let getNextNum = 0;
    let mobile = "";

    const xunamGet = new xunma({
        uName: "feibao007",
        pWord: "feibao007..",
        Developer: "vZe9zNo87tjA8nq5WNHmzQ%3d%3d",
    });

    //讯码登陆
    await xunamGet.Login();
    logger.info(`讯码登陆`);

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
            if(cookies[getNextNum].phone !== '' && getMobileCount<1){
                mobile = await xunamGet.getPhoneP(cookies[getNextNum].phone);
                if(mobile === ''){
                    getMobileCount++;
                    mobile = await xunamGet.getPhone();
                }
            }else{
                mobile = await xunamGet.getPhone();
            }

            logger.info(`获取号码${mobile}`);
            let res = await mysql.getCookiePhone(mobile);

            if(mobile !== cookies[getNextNum].phone){
                if(res.length !== 0){
                    logger.error(`号码重复`);
                    continue;
                }
            }else{
                if(res.length > 1){
                    logger.error(`号码重复`);
                    continue;
                }
            }

        }catch (e) {
            logger.error(e.message);
            continue;
        }

        if(!(/^\d{11}$/.test(mobile))){
            logger.error(`获取号码失败-没钱`);
            xunamGet.Exit();
            logger.info(`讯码退出`);
            return;
        }
        //发送验证码
        let validateToken = await request.sendMobileCode(mobile);

        //需要图形验证码
        if(!validateToken){
            let captchasInfo = await request.captchas(mobile);
            let base64Data = captchasInfo.captcha_image.replace(/^data:image\/jpeg;base64,/, "");
            fs.writeFileSync("./code.jpeg", base64Data, 'base64');
            let captcha_value = fs.readFileSync('./code.txt', 'utf-8');
            logger.info(`验证码是${captcha_value}`);
            let captcha_hash = captchasInfo.captcha_hash;
            validateToken = await request.sendMobileCode(mobile, captcha_value, captcha_hash );
        }


        if (validateToken) {

            //接收验证码
            let code = "";
            for (let i = 0; i < 3; i++) {
                /*if(i == 0){
                    await timeout(10000);
                }else{
                    await timeout(5000);
                }*/

                await timeout(10000);

                try {
                    code = await xunamGet.getMessage(mobile);
                    if(/^\d{6}$/.test(code)){
                        break;
                    }
                }catch (e) {
                    logger.error(e.message);
                }

            }

            if(!(/^\d{6}$/.test(code))){
                logger.error(`绑定号码失败-code错误`);
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
                    logger.info(`${cookies[getNextNum].id}-${mobile}绑定号码成功`);
                    getNextNum++;


                    //饿了么领取红包
                   /* let avatar = "http://thirdqq.qlogo.cn/qqapp/101204453/EBF7F0BF90A3F997D9B25C71C942C75A/40";
                    let name = '微信fb2111';

                    let dataHongBao = await request.getHongbao('1d2a658f62b258da', avatar, name);
                    let external = await request.getExternal('1d2a658f62b258da', avatar, name, mobile);

                    //饿了么拆红包
                    let disman = new Disman({
                        data: cookies[getNextNum].data,
                        openid: cookies[getNextNum].openid, // QQ或者WX授权登录饿了么之后，从cookie中可得openid
                        sign: cookies[getNextNum].sign, // QQ或者WX授权登录饿了么之后，从cookie中可得eleme_key就是sign
                        trackid: userInfo.trackid,
                        packetId: '15436382981048361',
                        backId:'1001'
                    }, 'https://h5.ele.me/grouping/1212/activity/?id=15436382981048361&type=weixin&from=singlemessage&isappinstalled=0');

                    let checkChai = await disman.checkByPhone(mobile);
                    let dataChai = await disman.chaiHongbao(name, avatar);
                    console.log("ok");*/

                } else {
                    logger.error(`一般不会失败，除非网络或其它原因`);
                }
            } else {
                logger.error(`短信验证码不正确或其它错误，可以跳过，接下一个手机号`);
            }
        } else {
            logger.error(`需要图形验证码，可以跳过，接下一个手机号`);
        }
    }

    if(/^\d{11}$/.test(mobile)){
        let phoneList =  mobile + "-3361;";
        let data = await xunamGet.releasePhone(phoneList);
        console.log(data);
        // logger.info(`释放号码${mobile}`);
    }

    console.log(`请求次数${j}/成功次数${getNextNum}`);
    xunamGet.Exit();
    logger.info(`讯码退出`);

})();
