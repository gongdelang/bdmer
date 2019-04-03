const router = require("koa-router")();
const multer = require("koa-multer");

/*相关业务接口*/
const homeController = require("./controller/home");
/*QQXML相关业务接口*/
const QQXMLController = require("./controller/QQXML");
/*eleme相关业务接口*/
const elemeController = require("./controller/eleme");
/*wx相关接口*/
const wxWebController = require("./controller/wxWeb");
//上传图片配置
var storage = multer.diskStorage({
    //文件保存路径
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        var fileFormat = (file.originalname).split(".");
        cb(null, Date.now() + "." + fileFormat[fileFormat.length - 1]);
    }
});
var upload = multer({storage: storage});

//路由配置
module.exports = (app) => {

    /*******************home-start*******************/
    //主页
    router.get('/', homeController.index);

    //新手教程
    router.get('/course', homeController.course);
    router.get('/course/get', homeController.courseGet);
    router.get('/course/chai', homeController.courseChai);
    router.get('/course/QQXML', homeController.courseQQXML);

    //关于我们
    router.get('/about/notice', homeController.aboutNotice);
    router.get('/about/kefu', homeController.aboutKefu);
    router.get('/about/cooperation', homeController.aboutCooperation);
    router.get('/about/appreciate', homeController.aboutAppreciate);
    router.get('/about/statement', homeController.aboutStatement);

    /*******************QQXML*******************/
    //QQ卡片
    router.get('/QQXML/ZFB', QQXMLController.ZFB);
    router.get('/QQXML/TB', QQXMLController.TB);
    router.get('/QQXML/create', QQXMLController.createGet);
    router.post('/QQXML/create', QQXMLController.createPost);

    /*******************eleme*******************/
    //eleme
    router.get('/eleme/wxLogin', elemeController.loginGet);
    router.get('/eleme/getHTML', elemeController.getHTML);
    router.post('/eleme/wxLogin', elemeController.loginPost);
    router.post('/eleme/get', elemeController.get);
    router.post('/eleme/chai', elemeController.chai);
    router.post('/eleme/checkGet', elemeController.checkGet);
    router.post('/eleme/checkChai', elemeController.checkChai);
    router.get('/eleme/bind', elemeController.getAdminBind);
    router.post('/eleme/bind', elemeController.postAdminBind);
    router.post('/eleme/getSn', elemeController.getSn);

    /*******************home-end*******************/


    /*******************wxWeb-start*******************/
    //微信地址验证
    router.get('/wxWeb/verify', wxWebController.verify);

    //公众号服务----
    router.get('/wxWeb', wxWebController.getToDo);
    router.post('/wxWeb', wxWebController.postToDo);

    //公众号网页----
    //home
    router.get('/wxWeb/opreation', wxWebController.getOpreation);
    router.post('/wxWeb/opreation', wxWebController.postOpreation);

    //bdmer
    router.get('/wxWeb/jsJDKConfig', wxWebController.getJsJDKConfig);
    router.get('/wxWeb/userCallBack', wxWebController.userCallBack);
    router.get('/bdmer/mine', wxWebController.bdmerMine);
    router.get('/bdmer/bind', wxWebController.bdmerBind);
    router.get('/bdmer/home/active', wxWebController.homeActive);
    router.post('/bdmer/home/active', wxWebController.postHomeActive);
    router.post('/bdmer/bindPhone', wxWebController.bdmerBindPhone);
    router.post('/bdmer/bindPictrueCode', wxWebController.bdmerBindPictrueCode);
    router.post('/bdmer/bindCode', wxWebController.bdmerBindbindCode);
    router.get('/bdmer/recharge/', wxWebController.rechargeGet);
    router.post('/bdmer/recharge', wxWebController.rechargePost);
    router.get('/bdmer/payJsOpenidCallBack', wxWebController.payJsOpenidCallBack);
    router.post('/bdmer/payJsOkCallBack', wxWebController.payJsOkCallBack);
    /*******************wxWeb-end*******************/

    app
        .use(router.routes())
        .use(router.allowedMethods());
};