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
const axios_1 = require("axios");
const querystring = require("querystring");
class xunma {
    /**
     * 每一个用户需要实例化一次
     * @param {string} userInfo 讯码的用户信息
     * @param {AxiosProxyConfig} proxy 代理配置
     */
    constructor(userInfo, token, proxy) {
        this.userInfo = userInfo;
        this.token = token;
        this.itemId = "3361";
        this.axios = axios_1.default.create({
            proxy,
            baseURL: "http://xapi.xunma.net",
            method: "GET",
            headers: {
                origin: "http://xapi.xunma.net",
                "user-agent": "Mozilla/5.0 (Linux; Android 7.0; MIX Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/6.2 TBS/044004 Mobile Safari/537.36 V1_AND_SQ_7.5.0_794_YYB_D QQ/7.5.0.3430 NetType/WIFI WebP/0.3.0 Pixel/1080"
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
    request(method, url, data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.axios[method](url, querystring.stringify(data), config);
            }
            catch (e) {
                return e.response;
            }
        });
    }
    /**
     * 讯码用户登陆
     * @returns {Promise<object>}
     */
    Login() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/Login?uName=${this.userInfo.uName}&pWord=${this.userInfo.pWord}&Developer=${this.userInfo.Developer}&Code=UTF8`);
            const arr = data.split("&");
            this.token = arr[0];
            return data;
        });
    }
    /**
     * 获取项目实例
     * @returns {Promise<object>}
     */
    GetItems() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/GetItems?token=${this.token}&tp=ut&Code=UTF8`);
            return data;
        });
    }
    /**
     * 获取区域
     * @returns {Promise<object>}
     */
    GetArea() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/GetArea?Code=UTF8`);
            return data;
        });
    }
    /**
     * 获取号码
     * @returns {Promise<string>}
     */
    getPhone() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/getPhone?ItemId=${this.itemId}&token=${this.token}&Code=UTF8`);
            if (/^\d{11};$/.test(data)) {
                const arr = data.split(";");
                return arr[0];
            }
            else {
                return "";
            }
        });
    }
    /**
     * 获取号码固定手机号码
     * @returns {Promise<string>}
     */
    getPhoneP(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/getPhone?ItemId=${this.itemId}&token=${this.token}&Phone=${phone}&Code=UTF8`);
            if (/^\d{11};$/.test(data)) {
                const arr = data.split(";");
                return arr[0];
            }
            else {
                return "";
            }
        });
    }
    /**
     * 释放号码
     * @returns {Promise<string>}
     */
    releasePhone(phoneList) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/releasePhone?token=${this.token}&phoneList=${phoneList}&Code=UTF8`);
            return data;
        });
    }
    /**
     * 获取消息
     * @returns {Promise<object>}
     */
    getMessage(mobile) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/getMessage?token=${this.token}&itemId=${this.itemId}&phone=${mobile}&Code=UTF8`);
            //console.log(data);
            const first = data.search(/验证码是/i) + 4;
            const last = first + 6;
            const code = data.slice(first, last);
            return code;
        });
    }
    /**
     * 退出
     * @returns {Promise<string>}
     */
    Exit() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/Exit?token=${this.token}&Code=UTF8`);
            return data;
        });
    }
    //解析图形验证码
    dealPictrueCode(image) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var rest = require('restler');
                let url = 'http://api.ruokuai.com/create.json';
                rest.post('http://api.ruokuai.com/create.json', {
                    multipart: true,
                    data: {
                        'username': 'delanggong',
                        'password': 'gdl18758896369',
                        'typeid': '3040',
                        'softid': '118240',
                        'softkey': 'e096114da09346038713c65d02436a29',
                        'image': image // filename: 抓取回来的码证码文件
                    },
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).on('complete', function (data) {
                    var captcha = JSON.parse(data);
                    resolve(captcha);
                });
            });
        });
    }
}
exports.xunma = xunma;
