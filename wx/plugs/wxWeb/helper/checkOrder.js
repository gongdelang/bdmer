const md5 = require('md5');

//用于去重复
let payjs_order_id = '';

module.exports = function (orderInfo, mchidKey) {
    return new Promise(( resolve, reject ) => {
        if(orderInfo.return_code === '1'){
            //1.验签收逻辑
            let sign = '';
            const keys = Object.keys(orderInfo);
            keys.sort();
            keys.forEach(key => {
                if (orderInfo[key] && key !== 'sign') {
                    sign = sign + key + '=' + orderInfo[key] + '&'
                }
            });
            sign = sign + 'key=' + mchidKey;
            sign = md5(sign).toUpperCase();
            if(sign !== orderInfo.sign){
                reject({myCode:0, payId:orderInfo.openid, message:'验签收失败'});
            }


            // 2.验重逻辑
            if(orderInfo.payjs_order_id === payjs_order_id){
                reject({myCode:0, openid:orderInfo.attach, message:'验签收失败'});
            }

            payjs_order_id = orderInfo.payjs_order_id;

            //需要返回信息
            let data = {};
            data.money = orderInfo.total_fee;
            data.payId = orderInfo.openid;
            data.openid = orderInfo.attach;
            data.payjs_order_id = orderInfo.payjs_order_id;
            resolve(data);

        }else{
            if(orderInfo.openid){
                if(orderInfo.attach){
                    reject({myCode:1, payId:orderInfo.openid, openid:orderInfo.attach, message:'支付失败'});
                }
                reject({myCode:1, payId:orderInfo.openid, openid:'没有openid，你说奇怪不奇怪', message:'支付失败'});
            }else{
                reject({myCode:1, payId:'没有payId，你说奇怪不奇怪', openid:'没有openid，去你妈', message:'支付失败'});
            }

        }
    });
};