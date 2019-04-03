const log4js = require("log4js");
const access = require("./access.js");

const methods = [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
    "mark"
];

const baseInfo = {
    appLogLevel: 'debug',
    dir: 'logs',
    env: 'dev'
};

const {env, appLogLevel, dir, serverIp, projectName} = baseInfo;

module.exports = (options) => {
    const contextLogger = {};
    const defaultInfo = {
        appLogLevel: 'info',
        dir: 'logs',
        env: 'dev'
    };

    // 继承自 baseInfo 默认参数
    const opts = Object.assign({}, defaultInfo, options || {});

    const {env, dir, appLogLevel} = opts;
    const appenders = {
        console: {
            type: 'console'
        },
        access: {
            type: 'dateFile',
            filename: `${dir}/wx`,
            pattern: '-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
        wx: {
            type: 'dateFile',
            filename: `${dir}/wx`,
            pattern: '-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        }
    };

    const config = {
        appenders: appenders,
        categories: {
            default: {
                appenders: ["console"],
                level: appLogLevel
            },
            access:{
                appenders: ["console","access"],
                level: appLogLevel
            },
            wx:{
                appenders: ["console","wx"],
                level: appLogLevel
            }
        },
        replaceConsole: true,
        pm2: true
    };

    return async(ctx, next) => {
        const start = Date.now();

        log4js.configure(config);
        const logger = log4js.getLogger('access');

        methods.forEach((method, i) => {
            contextLogger[method] = (message) => {
                logger[method](access(ctx, message, {}));
            }
        });
        ctx.log = contextLogger;
        ctx.logger = log4js.getLogger('wx');

        await next();
        const end = Date.now();
        const responseTime = end - start;
        logger.info(`响应时间为${responseTime / 1000}s`);
    }
};