const get = require('./get');
const chai = require('./chai');
const checkGet = require('./checkGet');
const checkChai = require('./checkChai');
const bind = require('./bind');


module.exports = {
    /**领取红包接口**/
    getHongBao: async function(userInfo){
        let mobile = userInfo.mobile;
        let url = userInfo.url;
        let nickname = userInfo.nickname;
        let from = userInfo.from;
        return get({ mobile, url, nickname, from});
    },

    /**拆红包接口**/
    chaiHongBao: async function(userInfo){
        let mobile = userInfo.mobile;
        let url = userInfo.url;
        let nickname = userInfo.nickname;
        let from = userInfo.from;
        return chai({ mobile, url, nickname, from});
    },

    /**检测cookieGet接口**/
    checkCookieGet: async function(userInfo){
        let mobile = userInfo.mobile;
        let url = userInfo.url;
        let nickname = userInfo.nickname;
        let from = userInfo.from;
        return checkGet({ mobile, url, nickname, from});
    },

    /**检测cookieChai接口**/
    checkCookieChai: async function(userInfo){
        let mobile = userInfo.mobile;
        let url = userInfo.url;
        let nickname = userInfo.nickname;
        let from = userInfo.from;
        return checkChai({ mobile, url, nickname, from});
    },

    /**绑定手机-phone**/
    bindPhone: async function(uid, phone){
        return bind.bindPhone(uid, phone);
    },

    /**绑定手机-pictrue**/
    bindPictrueCode: async function(uid, pictrueCode){
        return bind.bindPictrueCode(uid, pictrueCode);
    },

    /**绑定手机-code**/
    bindCode: async function(uid, code){
        return bind.bindCode(uid, code);
    },

    isBind: async function(uid){
        return bind.isBind(uid);
    },

    /**管理员绑定手机-phone**/
    adminBindPhone: async function(name){
        return bind.adminBindPhone(name);
    },

    /**管理员绑定手机-pictrueCode**/
    adminBindPictrueCode: async function(name, pictrueCode){
        return bind.adminBindPictrueCode(name, pictrueCode);
    },

    bindAuto: async function(isBind){
        return bind.bindAuto(isBind);
    },

    bindAutoFun: async function(){
        return bind.bindAutoFun();
    },
};