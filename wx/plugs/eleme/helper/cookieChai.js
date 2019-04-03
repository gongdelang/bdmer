const mysql = require('../mysql');

module.exports = {
    getCheck:async (count) => {
        let res = await mysql.getCookieInvalidChai(count);
        if(res && res.length !== 0){
            return  res;
        }else{
            return "";
        }
    },

    getBind:async (id) => {
        return  mysql.updateChaiCode(id, 0);
    },

    get:async () => {
        let res = await mysql.getCookieChai();
        if(res && res.length !== 0){
            return  res;
        }else{
            return "";
        }
    },

    enValidIsChai:async (id, code) => {
        return  mysql.updateChaiCode(id, code);
    },

    clearChaiCount:async (id) => {
        return  mysql.setChaiCount(id, 0);
    },

    updateChaiCount:async (id) => {
        return  mysql.updateChaiCount(id);
    },
};