const logger = require('../../publicHelper/logger').getLogger('eleme');

const configInfo = require('./config');

const schedule = require('node-schedule');
const mysql = require('mysql');

/*连接池的方法*/
let pool = mysql.createPool(configInfo);

/*基本查询的封装*/
let query = ( sql, values) => {
    return new Promise(( resolve, reject ) => {
        pool.getConnection(function(err, connection) {
            if (err) {
                logger.error(`${sql}-getConnection`);
                reject( err );
            } else {
                connection.query(sql, values, ( err, res) => {
                        if ( err ) {
                            logger.error(`${sql}-error`);
                            reject( err );
                        } else {
                            logger.info(`${sql}-ok`);
                            //console.log(res);
                            resolve( res );
                        }
                    connection.release();
                    //logger.info(`${sql}-release`);
                })
            }
        })
    });
};

// 注册用户
let insertUser = function( userInfo ) {
    let _sql = `INSERT INTO user (id, name, telephone, validCounts, usedCounts, province, city, sex, time, stamp, recharge, breakCode, breakStr, bot) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, '无违规', ?)`;

    let counts = 100;
    let myDate = new Date();
    let time = myDate.format("yyyy-MM-dd hh:mm:ss");
    let stamp = myDate.getTime();
    let values = [userInfo.nickname, userInfo.mobile, counts, 0, userInfo.province, userInfo.city, userInfo.sex, time, stamp, userInfo.from];

    return query( _sql, values );
};

// 删除用户
let deleteUser = function( mobile) {
    let _sql = `DELETE FROM user where telephone=?`;
    let values = [mobile];
    return query( _sql, values);
};

// 查找用户
let findUser = function( mobile ) {
    let _sql = `SELECT * FROM user WHERE telephone=?`;
    let values = [mobile];
    return query( _sql, values );
};

//更新领取次数
let updateCount = function ( mobile ) {
    let _sql = `UPDATE user SET validCounts=validCounts-1,usedCounts=usedCounts+1 where telephone=?`;
    let values = [mobile];
    return query( _sql, values );
};

//添加领取记录
let addRecord = function( information ){
    let _sql = `INSERT INTO record (id, getTelephone, getName, getMoney, getUrl, getTime, getStamp, bot, isGet) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let myDate = new Date();
    let time = myDate.format("yyyy-MM-dd hh:mm:ss");
    let stamp = myDate.getTime();
    let values = [information.mobile, information.nickname, information.money, information.url, time, stamp, information.from, 0];
    return query( _sql, values );
};

//获取一条记录(用于一键领取)
let getRecord = function() {
    let _sql = `SELECT * FROM record WHERE isGet=0 AND getStamp<=? AND getStamp>=? order by rand() LIMIT 1`;
    let start = new Date().getTime() - 30*24*60*60*1000;
    let end = new Date().getTime() - 45*24*60*60*1000;
    let values = [start,end];
    return query( _sql, values );
};

//更新一条记录(用于一键领取)
let updateRecord = function( id, isGet) {
    let _sql = `UPDATE hongbao_get SET isGet=? where id=?`;
    let values = [isGet, id];
    return query( _sql, values );
};

//充值
let reCharge = function ( mobile, counts ) {
    let _sql = `UPDATE user SET validCounts=validCounts+? where telephone=?`;
    let values = [counts, mobile];
    return query( _sql, values );
};


/**cookie管理**/
//存储cookie
let storageCookie = function (data) {
    let _sql = `INSERT INTO cookie (id, data, openid, sign, sid, userid, trackid, phone, fromUid, getCode, chaiCode, getCount, chaiCount, failCount, bindCount, bindStamp, createStamp) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let timeStamp = new Date().getTime();
    let values = [data.data, data.openid, data.sign, data.sid, data.userid, data.trackid, data.phone, 0, 2, 2, 0, 0, 0, 0, timeStamp, timeStamp];
    return query( _sql, values );
};

//获取cookie(根据openid='')
let getCookieOpenid = function (openid) {
    let _sql = `SELECT * FROM cookie WHERE openid=?`;
    let values = [openid];
    return query( _sql, values );
};

//更新存储cookie
let updateStorageCookie = function (id, data) {
    let _sql = `UPDATE cookie SET data=?, openid=?, sign=?, getCode=2, chaiCode=2, getCount=0, chaiCount=0, failCount=0, bindCount=0, bindStamp=0, createStamp=? WHERE id=?`;
    let timeStamp = new Date().getTime();
    let values = [data.data, data.openid, data.sign, timeStamp, id];
    return query( _sql, values );
};


//获取无效cookie(根据get)
let getCookieInvalidGet = function (count) {
    //目前主要是领红包
    let _sql = `SELECT * FROM cookie WHERE (getCode=2 OR (getCode=1 AND failCount>=1)) AND (bindStamp<?) ORDER BY RAND()  LIMIT ?`;

    //超过1天无效的号
    let timeStamp = (new Date().getTime() - (24*60*60*1000));
    let values = [timeStamp, count];
    return query( _sql, values );
};

let getCookieCheckGet = function (count) {
    //目前主要是领红包
    let _sql = `SELECT * FROM cookie WHERE getCode!=? AND bindStamp>? LIMIT ?`;

    //1内无效的号
    let timeStamp = (new Date().getTime() - (24*60*60*1000));
    let values = [0, timeStamp, count];
    return query( _sql, values );
};


//获取无效cookie(根据chai)
let getCookieInvalidChai = function (count) {
    let _sql = `SELECT * FROM cookie WHERE chaiCode!=0 LIMIT ?`;
    let values = [count];
    return query( _sql, values );
};

//获取cookie(根据phone)
let getCookiePhone = function (phone) {
    let _sql = `SELECT * FROM cookie WHERE phone=?`;
    let values = [phone];
    return query( _sql, values );
};

//获取cookie(根据fromUid)
let getCookieFromUid = function (fromUid) {
    let _sql = `SELECT * FROM cookie WHERE fromUid=?`;
    let values = [fromUid];
    return query( _sql, values );
};

let getCookieGet = function () {
   /* let _sql = `SELECT *  FROM cookie WHERE (getCode!=? AND failCount<2) AND ((fromUid=0 AND getCount>0) OR (fromUid!=0 AND getCount>3)) order by rand() LIMIT 100`;*/
    let _sql = `SELECT *  FROM cookie WHERE (getCode=? AND failCount<2) AND ((fromUid=0 AND getCount>0) OR (fromUid!=0 AND getCount>2)) order by rand() LIMIT 100`;

    let values = [0];
    return query( _sql, values );
};

let getCookieChai = function () {
    let _sql = `SELECT *  FROM cookie WHERE chaiCode=? AND chaiCount>0 LIMIT 20`;

    let values = [0];
    return query( _sql, values );
};

//删除cookie
let deleteCookieId = function (id) {
    let _sql = `DELETE FROM cookie WHERE id=?`;
    let values = [id];
    return query( _sql, values);
};

//更新绑定
let updateBind = function (id, data) {
    let _sql = `UPDATE cookie SET sid=?, userid=?, trackid=?, phone=?, fromUid=?, getCode=0, chaiCode=?, getCount=5, chaiCount=2, failCount=0, bindCount=bindCount+1, bindStamp=? WHERE id=?`;

    let chaiCode = 0;
    if(data.fromUid === 0){
        chaiCode = 1;
    }

    let timeStamp = new Date().getTime();
    let values = [data.sid, data.userid, data.trackid, data.phone, data.fromUid, chaiCode, timeStamp, id];
    return query( _sql, values );
};

//更新绑定手机号码(只有phone)
let updateBindPhone = function (id, phone) {
    let _sql = `UPDATE cookie SET getCode=?, phone=?, failCount=0 WHERE id=?`;
    let values = [0, phone, id];
    return query( _sql, values );
};

//更新绑定手机号码(只有phone，和failCount)(公众号绑定手机号码)
let updateBindPhoneFailCount = function (id, phone) {
    let _sql = `UPDATE cookie SET getCode=?, phone=?, failCount=6 WHERE id=?`;
    let values = [0, phone, id];
    return query( _sql, values );
};

//更新绑定手机号码(failCount)(公众号'失败次数')
let updateFailCount = function (id) {
    let _sql = `UPDATE cookie SET getCode=?, phone=?, failCount=7 WHERE id=?`;
    let values = [2, '', id];
    return query( _sql, values );
};


//更新getCode
let updateGetCode = function (id, code) {
    let _sql = `UPDATE cookie SET getCode=?, failCount=failCount+1 WHERE id=?`; //目前主要是领红包
    let values = [code, id];
    return query( _sql, values );
};

//更新chaiCode
let updateChaiCode = function (id, code) {
    let _sql = `UPDATE cookie SET chaiCode=? WHERE id=?`;
    let values = [code, id];
    return query( _sql, values );
};

//更新getCount
let updateGetCount = function (id) {
    let _sql = `UPDATE cookie SET getCount=getCount-1 WHERE id=?`;
    let values = [id];
    return query( _sql, values );
};

//更新chaiCount
let updateChaiCount = function (id) {
    let _sql = `UPDATE cookie SET chaiCount=chaiCount-1 WHERE id=?`;
    let values = [id];
    return query( _sql, values );
};

//设置getCount
let setGetCount = function (id, count) {
    let _sql = `UPDATE cookie SET getCount=? WHERE id=?`;
    let values = [count, id];
    return query( _sql, values );
};

//设置chaiCount
let setChaiCount = function (id, count) {
    let _sql = `UPDATE cookie SET chaiCount=? WHERE id=?`;
    let values = [count, id];
    return query( _sql, values );
};

//重置getCount
let resetGetCount = function () {
    let _sql = `UPDATE cookie SET getCount=? WHERE getCode!=2 AND failCount<5 AND getCount<5`;
    let values = [5];
    return query( _sql, values );
};

//重置chaiCount
let resetChaiCount = function () {
    let _sql = `UPDATE cookie SET chaiCount=? WHERE chaiCode=0 AND chaiCount<2`;
    let values = [2];
    return query( _sql, values );
};

/*test*/
/*(async ()=>{
   /!* let info = {};
    info.mobile = "18758896369";
    info.nickname = "测试";
    info.money = "未知";
    info.url = "https://xiaping.xin";
    let res = addRecord(info);
    console.log("ok");
    let res1 = addRecord(info);
    console.log("ok");*!/

  let res = await getCookieChai();
  console.log("ok");
})();*/

//每晚晚上00：00：00
const  scheduleCronstyleResetCokie = ()=>{
    //每天晚上00：00：00执行一次:
    schedule.scheduleJob('00 00 00 * * *',async ()=>{
        await resetGetCount();
        await resetChaiCount();
    });
};

scheduleCronstyleResetCokie();
console.log('每晚00：00：00重置cookie开启成功');

module.exports = {
    /*用户管理*/
    insertUser,
    deleteUser,
    findUser,
    updateCount,
    addRecord,
    getRecord,
    updateRecord,
    reCharge,

    /*cookie管理*/
    //存储
    storageCookie,
    getCookieOpenid,
    updateStorageCookie,

    //获取
    getCookieInvalidGet,
    getCookieCheckGet,
    getCookieInvalidChai,
    getCookiePhone,
    getCookieFromUid,
    getCookieGet,
    getCookieChai,

    //删除
    deleteCookieId,

    //更新
    updateBind,
    updateBindPhone,
    updateGetCode,
    updateChaiCode,
    updateGetCount,
    updateChaiCount,
    setGetCount,
    setChaiCount,

    //公众号绑定手机(使用)
    updateBindPhoneFailCount,
    updateFailCount
};
