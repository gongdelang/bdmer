"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_https_proxy_fix_1 = require("axios-https-proxy-fix");
const querystring = require("querystring");
const hex2dec = require("hex2dec");
class Request {
    /**
     * 每一个小号需要实例化一次
     * @param {string} cookie 授权登录饿了么的QQ或者WX号Cookie
     * @param {AxiosProxyConfig} proxy 代理配置
     */
    constructor(cookie, proxy) {
        this.cookie = cookie;
        this.axios = axios_https_proxy_fix_1.default.create({
            proxy,
            baseURL: "https://h5.ele.me",
            method: "POST",
            headers: {
                Referer: "https://h5.ele.me/hongbao/",
                Origin: "https://h5.ele.me",
                'X-Share':this.createXShared(),
                'content-type': `application/json; charset=utf-8`,
                'Connection': 'keep-alive',
                "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; PRO 6 Build/MRA58K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043221 Safari/537.36 V1_AND_SQ_7.0.0_676_YYB_D QQ/7.0.0.3135 NetType/WIFI WebP/0.3.0 Pixel/1080",
                'Accept-Encoding': `gzip, deflate, br`,
                'Accept-Language': `zh-CN,zh;q=0.9`,
                Cookie: `${this.cookie.data}`
            }
        });
    }
    /**
     * 底层请求，可以做一些统一的请求前后处理
     * @param {string} method 请求方式
     * @param {string} url 请求地址
     * @param {*} data 请求数据
     * @param {AxiosRequestConfig} config 其它配置
     * @returns {Promise<AxiosResponse>}
     * @private
     */
    request(isJSON, method, url, data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (isJSON) {
                    return yield this.axios[method](url, JSON.stringify(data), config);
                }
                return yield this.axios[method](url, querystring.stringify(data), config);
            }
            catch (e) {
                return e.response;
            }
        });
    }
    //X-Share生成
    createXShared(sn) {
        function GetRandomNum(Min, Max) {
            let Range = Max - Min;
            let Rand = Math.random();
            return (Min + Math.round(Rand * Range));
        }
        ;
        //this.lat = parseFloat((GetRandomNum(22, 23) + Math.random()).toString().slice(0, 10));
        //this.long = parseFloat((GetRandomNum(113, 114) + Math.random()).toString().slice(0, 11));

        this.lat = 23.132191;
        this.long = 113.266531;

        if (sn) {
            return `eosid=${hex2dec.hexToDec(sn)};loc=${this.long},${this.lat}`;
        }
        else {
            return `loc=${this.long},${this.lat}`;
        }
    }
    /**
     * 获取绑定好的cookie数据
     * @returns {Cookie}
     */
    getCookie() {
        return Object.assign({}, this.cookie);
    }
    /**
     * 领取红包
     * @param {string} sn 红包链接标识
     * @param {string} headimgurl 领取的头像URL
     * @param {string} nickname 领取的昵称
     * @returns {Promise<object>}
     */
    getHongbao(sn, headimgurl = "", nickname = "") {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request(true, "post", `/restapi/marketing/promotion/weixin/${this.cookie.openid}`, {
                method: "phone",
                group_sn: sn,
                sign: this.cookie.sign,
                phone: "",
                device_id: "",
                hardware_id: "",
                platform: 4,
                track_id: 'undefined',
                unionid: "fuck",
                weixin_avatar: headimgurl,
                weixin_username: nickname,
                latitude: this.lat,
                longitude: this.long
            }, {
                headers: {
                    'X-Shard': this.createXShared(sn),
                    'Content-Type': `text/plain;charset=UTF-8`,
                    Accept: `*/*`,
                    Cookie: `${this.cookie.data}; track_id=${this.cookie.trackid}; USERID=${this.cookie.userid}; SID=${this.cookie.sid}`
                }
            });
            return data;
        });
    }
    /**
     * 红包后附加
     * @param {string} sn 红包链接标识
     * @param {string} headimgurl 领取的头像URL
     * @param {string} nickname 领取的昵称
     * @returns {Promise<object>}
     */
    getExternal(sn, headimgurl = "", nickname = "", mobile = "") {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request(true, "post", `/restapi/marketing/v4/hongbao/weixin/${this.cookie.openid}/external`, {
                method: "phone",
                group_sn: sn,
                sign: this.cookie.sign,
                phone: mobile,
                device_id: "",
                hardware_id: "",
                platform: 4,
                track_id: 'undefined',
                unionid: "fuck",
                weixin_avatar: headimgurl,
                weixin_username: nickname,
                latitude: this.lat,
                longitude: this.long
            }, {
                headers: {
                    "X-Shard": this.createXShared(sn),
                    'Content-Type': `text/plain;charset=UTF-8`,
                    Accept: `*/*`,
                    Cookie: `${this.cookie.data}; track_id=${this.cookie.trackid}; USERID=${this.cookie.userid}; SID=${this.cookie.sid}`
                }
            });
            yield this.request(false, "get", `/restapi/marketing/v1/users/${this.cookie.userid}/redirect_to_alipay?come_from=share_hongbao`, {}, {
                headers: {
                    Cookie: `${this.cookie.data}; track_id=${this.cookie.trackid}; USERID=${this.cookie.userid}; SID=${this.cookie.sid}`
                }
            });
            return data;
        });
    }
    /**
     * 根据 sn 获取拼手气大包是第几个
     * @param {string} sn 红包链接标识
     * @returns {Promise<number>}
     */
    getLuckyNumber(sn, theme_id = "0") {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: { lucky_number } } = yield this.request(false, "get", `/restapi/marketing/themes/${theme_id}/group_sns/${sn}`, {}, {
                headers: {
                    Cookie: `${this.cookie.data}; track_id=${this.cookie.trackid}; USERID=${this.cookie.userid}; SID=${this.cookie.sid}`
                }
            });
            return lucky_number;
        });
    }
    /**
     * 绑定 sendMobileCode 传入的手机号码，需要先调用 loginByMobile
     * @returns {Promise<object>}
     */
    changeMobile() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request(true, "post", `/restapi/marketing/hongbao/weixin/${this.cookie.openid}/change`, {
                sign: this.cookie.sign,
                phone: this.mobile,
            }, {
                headers: {
                    'Content-Type': `text/plain;charset=UTF-8`,
                    Cookie: `${this.cookie.data}; track_id=${this.cookie.trackid}; USERID=${this.cookie.userid}; SID=${this.cookie.sid}`
                }
            });
            return data;
        });
    }
    /**
     * 使用短信验证码登录，需要先调用 sendMobileCode
     * @param {string} validateCode 短信验证码
     * @returns {Promise<string>}
     */
    loginByMobile(validateCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: { user_id }, headers } = yield this.request(true, "post", "/restapi/eus/login/login_by_mobile", {
                mobile: this.mobile,
                validate_code: validateCode,
                validate_token: this.validateToken
            }, {
                headers: {
                    'content-type': `application/json; charset=utf-8`
                }
            });
            const sid = headers["set-cookie"].find((c) => c.split("; ")[0].indexOf("SID") === 0);
            const userid = headers["set-cookie"].find((c) => c.split("; ")[0].indexOf("USERID") === 0);
            const trackid = headers["set-cookie"].find((c) => c.split("; ")[0].indexOf("track_id") === 0);
            let userInfo = { "SID": "", "USERID": "", "trackid": "" };
            if (sid) {
                this.cookie.sid = sid.split("; ")[0].split("=")[1];
                this.cookie.userid = userid.split("; ")[0].split("=")[1];
                this.cookie.trackid = trackid.split("; ")[0].split("=")[1];
                userInfo.SID = sid.split("; ")[0].split("=")[1];
                userInfo.USERID = userid.split("; ")[0].split("=")[1];
                userInfo.trackid = trackid.split("; ")[0].split("=")[1];
            }
            return userInfo;
        });
    }
    /**
     * 发送短信验证码
     * @param {string} mobile 手机号码
     * @param {string} captcha_hash 图形验证码标识
     * @param {string} captcha_value 图形验证码内容
     * @returns {Promise<string>}
     */
    sendMobileCode(mobile, captcha_value = "", captcha_hash = "") {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: { validate_token } } = yield this.request(true, "post", "/restapi/eus/login/mobile_send_code", {
                mobile: mobile,
                captcha_value: captcha_value,
                captcha_hash: captcha_hash
            }, {
                headers: {
                    'content-type': `application/json; charset=utf-8`
                }
            });
            this.mobile = mobile;
            this.validateToken = validate_token;
            return validate_token;
        });
    }
    /**
     * 获取验证码
     * @param {string} captcha_str 手机号码
     * @returns {Promise<string>}
     */
    captchas(captcha_str) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request(true, "post", "/restapi/eus/v3/captchas", {
                captcha_str: captcha_str
            }, {
                headers: {
                    'content-type': `application/json; charset=utf-8`
                }
            });
            return data;
        });
    }
}
exports.Request = Request;
