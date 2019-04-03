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
const fs = require("fs");
const request = require("request");
const querystring = require("querystring");
const path = require("path");
class wxRequest {
    /**
     * 每一个用户需要实例化一次
     * @param {string} config 讯码的用户信息
     * @param {AxiosProxyConfig} proxy 代理配置
     */
    constructor(config, proxy) {
        this.config = config;
        this.access_token = "";
        this.axios = axios_1.default.create({
            proxy,
            baseURL: "https://api.weixin.qq.com",
            headers: {
                origin: "https://api.weixin.qq.com"
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
    //=====获取access_token=====//
    //获取access_token
    renovateAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/cgi-bin/token?grant_type=client_credential&appid=${this.config.appid}&secret=${this.config.secret}`);
            this.access_token = data.access_token;
            return data;
        });
    }
    //更新acess_token
    setAccessToken(access_token) {
        return __awaiter(this, void 0, void 0, function* () {
            this.access_token = access_token;
            return "ok";
        });
    }
    //=====自定义菜单=====//
    //创建菜单
    createMenu(menu) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("post", `/cgi-bin/menu/create?access_token=${this.access_token}`, {
                button: menu
            });
            return data;
        });
    }
    //创建菜单
    getMenu() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/cgi-bin/menu/get?access_token=${this.access_token}`);
            return data;
        });
    }
    //=====用户管理=====//
    //获取用户信息（openID）
    getUserInfoOpenID(openid) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/cgi-bin/user/info?access_token=${this.access_token}&openid=${openid}&lang=zh_CN`);
            return data;
        });
    }
    //=====消息管理=====//
    //发送模板消息
    sendTemplateMsg(openid, templateId, dataMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("post", `/cgi-bin/message/template/send?access_token=${this.access_token}`, {
                "touser": openid,
                "template_id": templateId,
                "url": dataMsg.url,
                "data": {
                    "first": {
                        "value": dataMsg.first,
                    },
                    "keyword1": {
                        "value": dataMsg.key1,
                    },
                    "keyword2": {
                        "value": dataMsg.key2,
                    },
                    "keyword3": {
                        "value": dataMsg.key3,
                    },
                    "keyword4": {
                        "value": dataMsg.key4,
                    },
                    "remark": {
                        "value": dataMsg.remark,
                    }
                }
            });
            return data;
        });
    }
    //=====带参数二维码=====//
    //获取二维码ticket
    getQrcodeTicket(uid, qrcodeId, expireSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("post", `/cgi-bin/qrcode/create?access_token=${this.access_token}`, {
                "expire_seconds": expireSeconds ? expireSeconds : 0,
                "action_name": qrcodeId,
                "action_info": {
                    "scene": { "scene_id": uid }
                }
            });
            return data;
        });
    }
    //获取二维码图片
    getQrcodeImg(uid, ticket) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/cgi-bin/showqrcode?ticket=${ticket}`, {}, { responseType: 'stream' });
            return data.pipe(fs.createWriteStream(path.join(__dirname, '../../../', `public/image/qrcode/${uid}.png`)));
        });
    }
    //=====素材管理接口=====//
    //上传素材
    uploadMediaImg(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let image = fs.readFileSync(path.join(__dirname, '../../../', `public/image/qrcode/${fileName}.png`));
                request.post({
                    url: `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${this.access_token}&type=image`,
                    formData: {
                        buffer: {
                            value: image,
                            options: {
                                filename: `${fileName}.png`,
                                filelength: image.length,
                                'content-type': 'image/png'
                            }
                        }
                    }
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        return reject(err);
                    }
                    body = JSON.parse(body);
                    return resolve(body);
                });
            });
        });
    }
    //上传图形二维码
    uploadPictrueCode(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let image = fs.readFileSync(path.join(__dirname, '../../../', `public/image/pictrueCode/${fileName}.jpeg`));
                request.post({
                    url: `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${this.access_token}&type=image`,
                    formData: {
                        buffer: {
                            value: image,
                            options: {
                                filename: `${fileName}.jpeg`,
                                filelength: image.length,
                                'content-type': 'image/jpeg'
                            }
                        }
                    }
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        return reject(err);
                    }
                    body = JSON.parse(body);
                    return resolve(body);
                });
            });
        });
    }
    //=====网页接口=====//
    //获取jsapi-ticket
    getJsApiTicket() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/cgi-bin/ticket/getticket?access_token=${this.access_token}&type=jsapi`);
            if (data.ticket) {
                return data.ticket;
            }
            return data.errmsg;
        });
    }
    //用户授权（获取用户access_token）
    getUserAccessToken(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.request("get", `/sns/oauth2/access_token?appid=${this.config.appid}&secret=${this.config.secret}&code=${code}&grant_type=authorization_code`);
            return data;
        });
    }
    //获取订单
    createOrder(orderInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = 'https://payjs.cn/api/jsapi';
            let data = yield axios_1.default.post(url, querystring.stringify(orderInfo));
            return data;
        });
    }
    //关闭订单
    closeOrder(orderInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = 'https://payjs.cn/api/close';
            let data = yield axios_1.default.post(url, querystring.stringify(orderInfo));
            return data;
        });
    }
}
exports.wxRequest = wxRequest;
