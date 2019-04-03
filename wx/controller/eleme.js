const ElemeService = require('../plugs/eleme');

let wxbot = ["bot0","bot1","bot2"];


module.exports = {

    /*eleme start*/
    loginGet: async function (ctx, next){
        try{
            await ctx.render("home/eleme/wxLogin", {title:"帮点儿忙",items:wxbot});
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    /**微信机器人时使用**/
    loginPost: async function (ctx, next){
        try{
            let {login_url} = ctx.request.body;
            if(login_url){
                console.log(`更新微信登陆链接${login_url}`);
                wxbot.push(login_url);
            }
            ctx.body = {message:"updateOk", myCode:0};
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    get: async function (ctx, next){
        try{
            let info = ctx.request.body;
            /**检查信息是否正确**/
            info = await ElemeService.checkoutInfo(info, "get");
            /**领取红包**/
            ctx.body = await ElemeService.get(info);
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    chai: async function (ctx, next){
        try{
            let info = ctx.request.body;
            /**检查信息是否正确**/
            info = await ElemeService.checkoutInfo(info, "chai");
            /**拆红包**/
            ctx.body = await ElemeService.chai(info);
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    checkGet: async function (ctx, next){
        try{
            let info = ctx.request.body;
            /**检查信息是否正确**/
            info = await ElemeService.checkoutInfo(info, "get");
            /**检测cookieGet**/
            ctx.body = await ElemeService.checkGet(info);
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    checkChai: async function (ctx, next){
        try{
            let info = ctx.request.body;
            /**检查信息是否正确**/
            info = await ElemeService.checkoutInfo(info, "chai");
            /**检测cookieChai**/
            ctx.body = await ElemeService.checkChai(info);
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    getHTML: async function (ctx, next){
        try{
            await ctx.render("home/eleme/get", {title:"帮点儿忙"});
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    getAdminBind: async function (ctx, next){
        try{
            await ctx.render("home/eleme/bind", {title:"帮点儿忙"});
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    postAdminBind: async function (ctx, next){
        try{
            let postInfo = ctx.request.body;
            switch (postInfo.method1) {
                case 'autoBind': ctx.body = await  ElemeService.bindAuto(postInfo.name);break;
                case 'noAutoBind':  ctx.body = await ElemeService.adminBind(postInfo);break;
                default: ctx.body = await ElemeService.adminBind(postInfo);break;
            }

        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },

    getSn: async function (ctx, next){
        try{
            ctx.body = await ElemeService.getSnRedis();
        }catch (e) {
            console.log(`${e.message}`);
            ctx.body = {message:e.message, myCode:1};
        }
    },
    /*eleme end*/
};