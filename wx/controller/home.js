

module.exports = {

    /*home start*/
    index: async function (ctx, next){
        await ctx.render("home/index", {title:"帮点儿忙"});
    },

    //教程
    course: async function (ctx, next){
        await ctx.render("home/course/index", {title:"帮点儿忙"});
    },

    courseGet: async function (ctx, next){
        await ctx.render("home/course/get", {title:"帮点儿忙", course:"领红包教程"});
    },

    courseChai: async function (ctx, next){
        await ctx.render("home/course/chai", {title:"帮点儿忙", course:"拆红包教程"});
    },

    courseQQXML: async function (ctx, next){
        await ctx.render("home/course/QQXML", {title:"帮点儿忙", course:"QQ红包卡片教程"});
    },

    //关于我们
    aboutNotice: async function (ctx, next){
        await ctx.render("home/about/notice", {title:"帮点儿忙", name:"通知公告"});
    },

    aboutKefu: async function (ctx, next){
        await ctx.render("home/about/kefu", {title:"帮点儿忙", name:"添加微信", content:"如您遇到问题，请添加以下客服。"});
    },

    aboutCooperation:async function (ctx, next){
        await ctx.render("home/about/kefu", {title:"帮点儿忙", name:"添加微信", content:"我们期待与您合作，请添加我们！"});
    },

    aboutAppreciate: async function (ctx, next){
        await ctx.render("home/about/appreciate", {title:"帮点儿忙", name:"谢谢支持"});
    },

    aboutStatement: async function (ctx, next){
        await ctx.render("home/about/statement", {title:"帮点儿忙"});
    }
    /*home end*/
};