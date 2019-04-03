const logger = require('../../publicHelper/logger').getLogger('wxWeb');

const configInfo = require('./config');
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

//==公众号用户基本信息模块==//
// 注册用户
let insertUser = function( userInfo ) {
    let _sql = `INSERT INTO userWxWeb (id, openid, unionid, subscribe, nickname, sex, city, province, country, headimgurl, subscribe_time, subscribe_scene, qr_scene, qr_scene_str, join_time) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let myDate = new Date();
    let join_time = myDate.format("yyyy-MM-dd hh:mm:ss");
    let values = [userInfo.openid, userInfo.unionid, userInfo.subscribe, userInfo.nickname, userInfo.sex, userInfo.city, userInfo.province, userInfo.country, userInfo.headimgurl, userInfo.subscribe_time, userInfo.subscribe_scene, userInfo.qr_scene , userInfo.qr_scene_str, join_time];

    return query( _sql, values );
};

// 查找用户
let findUser = function( openid ) {
    let _sql = `SELECT * FROM userWxWeb WHERE openid=?`;
    let values = [openid];
    return query( _sql, values );
};

// 更新用户订阅
let updateSubscribe = function( code, openid) {
    let _sql = `UPDATE userWxWeb SET subscribe=? WHERE openid=?`;
    let values = [code, openid];
    return query( _sql, values);
};

//==帮点儿忙用户基本信息模块==//
// 注册用户
let bdmerInsertUser = function( userInfo, fromUid ) {
    let _sql = `INSERT INTO userBdmer (uid, unionid, openidWxWeb, openidWxApp, point, usedPoint, rechargePoint, invitationCount, tempInvitationSuccess, tempInvitationFail, fromUid, subscribe, isVip, createTime, createStamp) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    let myDate = new Date();
    let time = myDate.format("yyyy-MM-dd hh:mm:ss");
    let values = [userInfo.unionid, userInfo.openid, '', userInfo.point, 0, 0, 0, 0, 0, fromUid, userInfo.subscribe, 0, time, myDate.getTime()];

    return query( _sql, values );
};

// 查找用户(openid)
let bdmerFindUser = function( openid ) {
    let _sql = `SELECT * FROM userBdmer WHERE openidWxWeb=?`;
    let values = [openid];
    return query( _sql, values );
};

let bdmerFindUserUid = function( uid ) {
    let _sql = `SELECT * FROM userBdmer WHERE uid=?`;
    let values = [uid];
    return query( _sql, values );
};

// 更新用户订阅
let bdmerUpdateSubscribe = function( code, uid) {
    let _sql = `UPDATE userBdmer SET subscribe=? WHERE uid=?`;
    let values = [code, uid];
    return query( _sql, values);
};

//更新用户次数
let bdmerUpdatePoint = function( point, usedPoint, uid) {
    let _sql = `UPDATE userBdmer SET point=point+?, usedPoint=usedPoint+? WHERE uid=?`;
    let values = [point, usedPoint, uid];
    return query( _sql, values);
};

//充值点数
let bdmerRechargePoint = function( point, uid) {
    let _sql = `UPDATE userBdmer SET point=point+?, rechargePoint=rechargePoint+? WHERE uid=?`;
    let values = [point, point, uid];
    return query( _sql, values);
};


//更新邀请次数
let bdmerUpdateInvitationCount = function( count, uid) {
    let tempFailCount = count;
    if(count > 0){
        tempFailCount = 0;
    }

    let _sql = `UPDATE userBdmer SET invitationCount=invitationCount+?,tempInvitationSuccess=tempInvitationSuccess+?, tempInvitationFail=tempInvitationFail-? WHERE uid=?`;

    let values = [count, count, tempFailCount, uid];
    return query( _sql, values);
};

//更新用户绑定手机
let bdmerUpdateFromUid = function( fromUid, uid) {
    let _sql = `UPDATE userBdmer SET fromUid=? WHERE uid=?`;
    let values = [fromUid, uid];
    return query( _sql, values);
};


//添加用户行为记录
let recordInsert = function( recordInfo) {
    let _sql = `INSERT INTO record (id, uid, eventDetail, event, getPoint, createTime, createStamp) VALUES (NULL, ?, ?, ?, ?, ?, ?)`;

    let myDate = new Date();
    let time = myDate.format("yyyy-MM-dd hh:mm:ss");

    let values = [recordInfo.uid, recordInfo.eventDetail, recordInfo.event, recordInfo.getPoint, time, myDate.getTime()];
    return query( _sql, values);
};

//添加邀请图片
let qrcodeInsert = function( qrcodeInfo ) {
    let _sql = `INSERT INTO qrcode (id, uid, openid, ticket, url, ticketMsec, ticketStamp, mediaId, mediaStamp) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`;

    let myDate = new Date();
    let time = myDate.format("yyyy-MM-dd hh:mm:ss");

    let values = [qrcodeInfo.uid, qrcodeInfo.openid, qrcodeInfo.ticket, qrcodeInfo.url, qrcodeInfo.ticketMsec, qrcodeInfo.ticketStamp, qrcodeInfo.mediaId, qrcodeInfo.mediaSatmp];
    return query( _sql, values);
};

//查找邀请图片
let qrcodeFindOpenid = function( openid ) {
    let _sql = `SELECT * FROM qrcode WHERE openid=?`;
    let values = [openid];
    return query( _sql, values );
};

//更新邀请图片素材
let qrcodeUpDateMedia = function( mediaInfo, uid ) {
    let _sql = `UPDATE qrcode SET mediaId=?, mediaStamp=? WHERE uid=?`;
    let values = [mediaInfo.mediaId, mediaInfo.mediaStamp, uid];
    return query( _sql, values);
};

//更新邀请图片ticket
let qrcodeUpDateTicket = function( ticketInfo, uid ) {
    let _sql = `UPDATE qrcode SET ticket=?, url=?, ticketMsec=?, ticketStamp=?, mediaId=?, mediaStamp=? WHERE uid=?`;
    let values = [ticketInfo.ticket, ticketInfo.url, ticketInfo.ticketMsec, ticketInfo.ticketStamp, ticketInfo.mediaId, ticketInfo.mediaStamp, uid];
    return query( _sql, values);
};

//自定义查询
let customQuery = function( sql, values ) {
    return query( sql, values);
};

module.exports = {
    //公众号用户
    insertUser,
    findUser,
    updateSubscribe,

    //帮点儿忙用户
    bdmerInsertUser,
    bdmerFindUser,
    bdmerFindUserUid,
    bdmerUpdateSubscribe,
    bdmerUpdatePoint,
    bdmerRechargePoint,
    bdmerUpdateInvitationCount,
    bdmerUpdateFromUid,

    //添加用户行为记录
    recordInsert,

    //添加用户推广图片
    qrcodeInsert,
    qrcodeFindOpenid,
    qrcodeUpDateMedia,
    qrcodeUpDateTicket,

    //自定义查询
    customQuery
};
