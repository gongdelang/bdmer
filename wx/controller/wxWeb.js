const wxWebService = require('../plugs/wxWeb');
var crypto = require('crypto');

//--public--//
let getWebOpenid=async (ctx, next) => {
    //获取openid
    let getInfo = ctx.request.query;
    let openid = getInfo.openid;

    if(!openid || openid === ''){
        //获取cookie
        openid = ctx.cookies.get('openid');

        if(!openid || openid === ''){
            //重新授权
            let url = ctx.url;
            url = await wxWebService.login(url);
            ctx.redirect(url);
            ctx.body = '微信授权';
            return undefined;
        }
    }else{
        //300天存储时间
        let maxAge = 300*24*60*60*1000;
        let expires = new Date().getTime() + maxAge;
        ctx.cookies.set(
            'openid',openid,{
                domain:'bdmer.cn', // 写cookie所在的域名
                path:'/',       // 写cookie所在的路径
                maxAge: maxAge,   // cookie有效时长
                expires:new Date(expires), // cookie失效时间
                httpOnly:false,  // 是否只用于http请求中获取
                overwrite:false  // 是否允许重写
            }
        );
    }

    return openid;
};

let checkVerify = function check(timestamp,nonce,signature,token){
    var currSign,tmp;
    tmp = [token,timestamp,nonce].sort().join("");
    currSign = crypto.createHash("sha1").update(tmp).digest("hex");
    return (currSign === signature);
};

module.exports = {
    /*微信后台验证*/
    verify:async function(ctx, next){
        var query = ctx.request.query;
        var signature = query.signature;
        var timestamp = query.timestamp;
        var nonce = query.nonce;
        var echostr = query.echostr;
        if(checkVerify(timestamp,nonce,signature,"bdmers")){
            ctx.body = echostr;
        }else{
            return;
        }
    },

    /**网页start**/
    //home
    getOpreation: async function (ctx, next){
        await ctx.render("home/wxWeb/opreation", {title:"帮点儿忙",course:"微信公众号操作"});
    },
    postOpreation:async function (ctx, next){
        try{
            let postInfo = ctx.request.body;
            switch (postInfo.method) {
                case 'updateAccessToken': ctx.body = await wxWebService.updateAccessToken();break;
                case 'createMenu':  ctx.body = await wxWebService.createMenu(postInfo.postData);break;
                case 'getMenu': ctx.body = await wxWebService.getMenu();break;
                case 'closeOrder': ctx.body = await wxWebService.closeOrder(postInfo.postData);break;
                default:ctx.body = '';
            }

        } catch (e) {
            ctx.body = e;
        }
    },

    //bdmer
    //获取jsJDK配置信息
    getJsJDKConfig:async function (ctx, next){
        let url = ctx.request.query.url;

        ctx.body = await wxWebService.getJsJDKConfig(url);
    },

    //微信用户授权回调
    userCallBack:async function (ctx, next){
        //获取code，url
        let getInfo = ctx.request.query;
        let code = getInfo.code;
        let url = getInfo.url;

        let openid = await wxWebService.getWebUserOpenid(code);
        if(openid){
            url = `${url}?openid=${openid}`;
            ctx.redirect(url);
            ctx.body = '跳转';
        }else {
            ctx.body = '微信授权失败';
        }

    },

    //获取payJsopenid回调
    payJsOpenidCallBack:async function (ctx, next){
        //获取openid
        let openid =  ctx.cookies.get('openid');
        if(!openid){
            //openid 不存在就直接返回
            return;
        }

        //获取payId
        let getInfo = ctx.request.query;
        let payId = getInfo.openid;

        if(payId){
            if(await wxWebService.setPayId(openid, payId)){
                ctx.redirect('https://bdmer.cn/bdmer/recharge/');
                return;
            }
        }
        ctx.body = '授权失败,请刷新重试';
    },

    //payJs支付成功回调
    payJsOkCallBack:async function (ctx, next){
        let postInfo = ctx.request.body;
        if(postInfo && await wxWebService.recharge(postInfo)){
            ctx.body = 'success';
            console.log('success');
            return;
        }
    },

    //个人中心
    bdmerMine: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            //openid 不存在就直接返回
            return;
        }

        //获取用户信息
        let userInfo = await wxWebService.getWebUserInfo(openid);
        if(/未失效/.test(userInfo.isBind)){
            userInfo.canBind = 0;
        }else {
            userInfo.canBind = 1;
        }
        await ctx.render("bdmer/mine/index", {title:"个人中心", userInfo:userInfo});
    },

    //绑定手机-界面
    bdmerBind: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            //openid 不存在就直接返回
            return;
        }

        //获取用户信息
        let userInfo = await wxWebService.getWebUserInfo(openid);
        if(/未失效/.test(userInfo.isBind)){
            userInfo.canBind = 0;
        }else {
            userInfo.canBind = 1;
        }
        await ctx.render("bdmer/mine/bind", {title:"绑定手机", userInfo:userInfo});
    },

    //绑定手机-号码
    bdmerBindPhone: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            //openid 不存在就直接返回
            ctx.body = {myCode:1, message:'请刷新页面重试'};
            return;
        }

        let postInfo = ctx.request.body;
        //号码
        ctx.body = await wxWebService.webBindPhone(openid, postInfo);
    },

    //绑定手机-图形验证码
    bdmerBindPictrueCode: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            //openid 不存在就直接返回
            ctx.body = {myCode:1, message:'请刷新页面重试'};
            return;
        }

        let postInfo = ctx.request.body;
        //号码
        ctx.body = await wxWebService.webBindPictrueCode(openid, postInfo);
    },

    //绑定手机-号码
    bdmerBindbindCode: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            ctx.body = {myCode:1, message:'请刷新页面重试'};
            //openid 不存在就直接返回
            return;
        }

        let postInfo = ctx.request.body;
        //号码
        ctx.body = await wxWebService.webBindCode(openid, postInfo);
    },


    //充值页面
    rechargeGet: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            //openid 不存在就直接返回
            return;
        }
        let userInfo = await wxWebService.getWebUserInfo(openid);
        if(!userInfo){
            ctx.body = '未登录';
            return;
        }

        let payId = await wxWebService.getPayId(openid);
        if(!payId){
            //获取payid
            let url = `https://payjs.cn/api/openid?callback_url=https://bdmer.cn/bdmer/payJsOpenidCallBack`;
            ctx.redirect(url);
            ctx.body = '信息授权';
            return;

        }else{
            await ctx.render("bdmer/recharge/index", {title:"充值"});
        }
    },

    //充值获取订单
    rechargePost: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            //openid 不存在就直接返回
            return;
        }

        let postInfo = ctx.request.body;
        postInfo.money = parseInt(postInfo.money);
        if(!postInfo || typeof(postInfo.money) !== "number"){
            ctx.body = {return_code:0, return_msg:'money值错误',};
            return;
        }

        //获取payJs openid
        ctx.body = await wxWebService.createOrderInfo(openid, postInfo.money);
        return;

    },
    
    //活动-排行榜
    homeActive: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            //openid 不存在就直接返回
            return;
        }

        //获取用户信息
        let userInfo = await wxWebService.getWebUserInfo(openid);

        await ctx.render("bdmer/home/active", {activeInfo:'11'});
        return;
    },

    //活动-提交数据
    postHomeActive: async function (ctx, next){
        //获取openid
        let openid = await getWebOpenid(ctx, next);
        if(!openid){
            //openid 不存在就直接返回
            return;
        }


        let postInfo = ctx.request.body;
        switch (postInfo.getCode) {
            case 'chart': ctx.body = await wxWebService.activeInfo();
        }
        return;
    },
    /**网页end**/


    /**TODOSTART**/
    getToDo: async function (ctx, next){
        /***公众号服务验证*/
        let verifyInfo = ctx.request.query;
        if(verifyInfo && verifyInfo !== {} && verifyInfo.signature){
            let echostr = verifyInfo.echostr;
            if(wxWebService.verify(verifyInfo)){
                ctx.body = echostr;
            }else {
                ctx.body = "error";
            }
        }else{
            ctx.body = "error";
        }
    },

    postToDo:async function (ctx, next){
        /**公众号消息回调**/
        let wxJSON = ctx.request.XML.xml;
        ctx.type = 'application/xml';

        switch (wxJSON.MsgType) {
            case 'event': ctx.body = await wxWebService.toDoEvent(wxJSON);break;
            case 'text': ctx.body = await wxWebService.toDoText(wxJSON);break;
            case 'link': ctx.body = await wxWebService.toDoLink(wxJSON);break;
            default:ctx.body = '';
        }
    },
    /**TODOEND**/
};