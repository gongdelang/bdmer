const QQXMLService = require('../plugs/QQXML');


module.exports = {

    /*QQ start*/
    ZFB: async function (ctx, next){
        await ctx.render("home/QQXML/ZFB", {title:"红包"});
    },

    TB: async function (ctx, next){
        await ctx.render("home/QQXML/TB", {title:"淘宝"});
    },

    createGet: async function (ctx, next){
        await ctx.render("home/QQXML/create",{title:"帮点忙儿"});
    },

    createPost: async function (ctx, next){
        let infoXML = ctx.request.body;
        let typeXML = parseInt(infoXML.typeXML);
        let url = infoXML.url;
        let outUrl = "";
        
        switch (typeXML) {
            case 0:outUrl = await QQXMLService.pingHongBaoXML(url);break;
            case 1:outUrl = await QQXMLService.newPingHongBaoXML(url);break;
            case 2:outUrl = await QQXMLService.groupHongBaoXML(url);break;
            case 3:outUrl = await QQXMLService.bigHongBaoXML(url);break;
            case 9:outUrl = await QQXMLService.taoBaoXML(url);break;
            default:
                outUrl = "没有该类型的XML卡片";
        }
        let result = {};
        if(typeof(outUrl) === "string"){
            outUrl = `转卡片${outUrl}`;
            result = {myCode:200,outUrl:outUrl};
            console.log(outUrl);
        }else {
            outUrl = "error";
            result = {myCode:600,outUrl:outUrl};
            console.log(outUrl);
        }

        ctx.body = result;
    },
    /*QQ end*/
};