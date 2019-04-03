const logger  = require("../publicHelper/logger").getLogger('eleme');

const getCookie = require("./helper/cookie");
const mysql = require("./mysql");

const fs = require("fs");



// 以下逻辑可以套在循环里，实现自动接码
(async () => {
    //获取无用的cookie
    let invalidCookie = await mysql.getCookieOpenid('');
    let nextNum = 0;

    while(true){
        let data = {};
        data.data = "";
        data.openid = "";
        data.sign = "";
        data.sid = "";
        data.userid = "";
        data.trackid = "";
        data.phone = "";

        /**获取data**/
        let cookie_num = parseInt(fs.readFileSync(`./plugs/eleme/data/cookie_num.txt`, 'utf-8'));
        let cookie = getCookie(cookie_num);
        if(cookie === false){
            logger.info(`cookie存储完毕`);
            return;
        }

        /*cookie相关数据*/
        data.data = cookie;
        cookie = JSON.parse(decodeURIComponent(cookie.split(/;\s+/).find(item => /^snsInfo/.test(item)).split('=').pop()));
        data.openid = cookie.openid;
        data.sign = cookie.eleme_key;

        /*把坏掉的数据剔除*/
        try{
            if(invalidCookie.length > nextNum){
                await mysql.updateStorageCookie(invalidCookie[nextNum].id, data);
                nextNum++;
                cookie_num++;
                fs.writeFileSync('./plugs/eleme/data/cookie_num.txt', cookie_num);
                logger.info(`更新成功-${invalidCookie[nextNum].id}`);
                continue;
            }
        }catch (e) {
            logger.error(e.message);
            return;
        }

        /*存储数据*/
        try{
            let {insertId} = await mysql.storageCookie(data);
            cookie_num++;
            fs.writeFileSync('./plugs/eleme/data/cookie_num.txt', cookie_num);
            logger.info(`添加成功-${insertId}`);
        }catch (e) {
            logger.error(e.message);
            return;
        }
    }

})();
