const path = require("path");
const ip = require("ip");
//const bodyParser = require("koa-bodyparser");
const nunjucks = require("koa-nunjucks-2");
const staticFiles = require("koa-static");

// 引入请求错误中间件
const miHttpError = require('./mi-http-error');


//引入日志中间件
//const miLog = require('./mi-log');

//发送josn中间件
const miSend = require('./mi-send');

//中间件配置
module.exports = (app) => {
    // 应用请求错误中间件
    app.use(miHttpError({
        errorPageFolder: path.resolve(__dirname, '../errorPage')
    }));

    //注册日志中间件
    /*app.use(miLog({
        env:app.env,
        projectName: 'wx',
        appLogLevel: 'debug',
        dir: 'logs',
        serverIP: ip.address()
    }));*/

    //静态资源js，css
    app.use(staticFiles(path.resolve(__dirname, "../public")));

    //后台使用koa-nunjucks模板
    app.use(nunjucks({
        ext: 'html',
        path: path.join(__dirname, '../views'),
        nunjucksConfig: {
            trimBlocks: true,
            noCache: true
        }
    }));

    //解析表单
    //app.use(bodyParser());
    app.use(miSend());

    // 增加错误的监听处理
    app.on("error", (err, ctx) => {
        if (ctx && !ctx.headerSent && ctx.status < 500) {
            ctx.status = 500;
        }
        /*if (ctx && ctx.log && ctx.log.error) {
            if (!ctx.state.logged) {
                ctx.log.error(err.stack);
            }
        }*/
        if (ctx) {
            console.log(err.stack);
        }
    });
};