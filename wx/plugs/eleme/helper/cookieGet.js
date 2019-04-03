const mysql = require('../mysql');

module.exports = {
    getCheck:async (count) => {
        let res = await mysql.getCookieCheckGet(count);
        if(res && res.length !== 0){
            return  res;
        }else{
            return "";
        }
    },

    getBind:async (id, phone) => {
        return mysql.updateBindPhone(id, phone);
    },

    get:async () => {
        let res = await mysql.getCookieGet();
        if(res && res.length !== 0){
            return  res;
        }else{
            return "";
        }
    },

    enValidIsGet:async (id, code) => {
        return mysql.updateGetCode(id,code);
    },

    clearGetCount:async (id) => {
        return mysql.setGetCount(id, 0);
    },

    updateGetCount:async (id) => {
        return mysql.updateGetCount(id);
    },

    getHongBaoSn:async (id) => {
        let record = await mysql.getRecord();
        if(record && record.length === 0){
            return undefined;
        }
        return record[0];
    },

    updateRecord:async (id, isGet) => {
        return mysql.updateRecord(id, isGet);
    },
};

//console.log(`get:${get.length}`);