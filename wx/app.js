const Koa = require("koa");
const cors = require("koa2-cors");
const path = require("path");
const fs = require("fs");
const xmlParser = require('koa-xml-body');


/*中间件*/
const middleware = require("./middleware");

/*路由接口*/
const router = require("./router");

const app = new Koa();
/*传输文件最大为5mb*/
const koaBody = require('koa-body')({
    "formLimit":"5mb",
    "jsonLimit":"5mb",
    "textLimit":"5mb"
});

//XML解析
app.use(xmlParser({
    encoding: 'utf8', // lib will detect it from `content-type`
    xmlOptions: {
        explicitArray: false
    },
    key: 'XML', // lib will check ctx.request.xmlBody & set parsed data to it.
    onerror: (err, ctx) => {
        ctx.throw(err.status, err.message);
    }
}));

//json/from解析
app.use(koaBody);

app.use(cors());

middleware(app);
router(app);

app.listen(5005, () => {
    console.log('server is running at 5005');
});

