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
class Disman {
    createXShared() {
        function GetRandomNum(Min, Max) {
            let Range = Max - Min;
            let Rand = Math.random();
            return (Min + Math.round(Rand * Range));
        }
        ;
        //this.lat = parseFloat((GetRandomNum(22, 23) + Math.random()).toString().slice(0, 9));
        //this.long = parseFloat((GetRandomNum(112, 114) + Math.random()).toString().slice(0, 11));
        this.lat = 23.132191;
        this.long = 113.266531;
        return `loc=${this.long},${this.lat}`;
    }
    /**
     * 每一个小号需要实例化一次
     * @param {object} UserInfo 授权登录饿了么的QQ或者WX号Cookie
     * @param {AxiosProxyConfig} proxy 代理配置
     */
    constructor(UserInfo, url, proxy) {
        this.UserInfo = UserInfo;
        this.axios = axios_1.default.create({
            proxy,
            baseURL: "https://h5.ele.me",
            method: "POST",
            headers: {
                Referer: url,
                Origin: "https://h5.ele.me",
                "X-Shard": this.createXShared(),
                "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; PRO 6 Build/MRA58K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043221 Safari/537.36 V1_AND_SQ_7.0.0_676_YYB_D QQ/7.0.0.3135 NetType/WIFI WebP/0.3.0 Pixel/1080",
                'Content-Type': `text/plain;charset=UTF-8`,
                'Accept-Encoding': `gzip, deflate, br`,
                'Accept-Language': `zh-CN,zh;q=0.9`,
                Cookie: `${this.UserInfo.data}; track_id=${this.UserInfo.trackid}; USERID=${this.UserInfo.USERID}; SID=${this.UserInfo.SID}`
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
                return yield this.axios[method](url, JSON.stringify(data), config);
            }
            catch (e) {
                return e.response;
            }
        });
    }
    /**
     * 拆红包
     * @param {string} sn 红包链接标识
     * @param {string} headimgurl 领取的头像URL
     * @param {string} nickname 领取的昵称
     * @returns {Promise<object>}
     */
    chaiHongbao(name, avatar) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("post", `/restapi/campaign/redpacket/open`, {
                "packet_id": this.UserInfo.packetId,
                "user_id": this.UserInfo.USERID,
                "lat": this.lat,
                "lng": this.long,
                "nickname": name,
                "avatar": avatar
            });
            return data;
        });
    }
    /**
     * 获取红包
     * @returns {Promise<object>}
     */
    checkByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("post", `/restapi/traffic/redpacket/checkByPhone`, {
                "phone": phone,
                "lat": this.lat,
                "lng": this.long,
            });
            return data;
        });
    }
    /**
     * 拆红包附加条件
     * @returns {Promise<object>}
     */
    chaiExternal() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/restapi/eus/v1/current_user?info_raw={}`);
            return data;
        });
    }
}
exports.Disman = Disman;
