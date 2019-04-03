const Path = require("path");
const nunjucks = require("nunjucks");

module.exports = (opts = {}) => {
    const env = opts.env || process.env.NODE_ENV || 'development';

    const folder = opts.errorPageFolder;
    const templatePath = Path.resolve(__dirname, './error.html');

    let fileName = 'other';

    return async (ctx, next) => {
        try {
            await next();

            if(ctx.response.status === 404 && !ctx.response.body){
                ctx.throw(404);
            }
            if(ctx.response.status === 600 && !ctx.response.body){
                ctx.throw(600);
            }
        }catch (e) {
            let status = parseInt(e.status);
            const message = e.message;

            if(status >= 400){
                switch (status){
                    case 400:
                    case 404:
                    case 500:
                        fileName = status;
                        break;
                    case 600:
                        fileName = status;
                        break;
                    default:
                        fileName = 'other';
                }
            }else {
                status = 500;
                fileName = status;
            }

            const filePath = folder? Path.join(folder, `${fileName}.html`):templatePath;

            try {
                nunjucks.configure(folder ? folder:__dirname);
                const data = await nunjucks.render(filePath, {
                    env: env, // 指定当前环境参数
                    status: e.status || e.message,
                    error: e.message, // 错误信息
                    stack: e.stack // 错误的堆栈信息
                });

                ctx.status = status;
                ctx.body = data;

            }catch (e) {
                ctx.throw(500, `错误页渲染失败:${e.message}`);
            }
        }
    };
};