const config = require("./config");

const axios = require("axios");
const btoa = require("btoa");

const weiboAppKey = "2493199660";
const weiboApi = 'http://api.t.sina.com.cn/short_url/shorten.json'; // json


module.exports = {
    pingHongBaoXML:async (url) => {
        if(url){
            let res_aliUrl = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${url}`);
            let longEnCodeAliUrl = btoa(encodeURIComponent(url));
            let shortEnCodeAliUrl = btoa(encodeURIComponent(res_aliUrl.data[0].url_short));
            let base64AliUrl = `https://bdmers.000webhostapp.com/ZFB.html?url$` + longEnCodeAliUrl + "@" +shortEnCodeAliUrl + "!";
            let res = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${base64AliUrl}`);

            let shortUrl = res.data[0].url_short;
            return config.pingHongBao.format(shortUrl);

        }else {
            return "";
        }
    },

    newPingHongBaoXML:async (url) => {
        if(url){
            let res_aliUrl = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${url}`);
            let longEnCodeAliUrl = btoa(encodeURIComponent(url));
            let shortEnCodeAliUrl = btoa(encodeURIComponent(res_aliUrl.data[0].url_short));
            let base64AliUrl = `https://bdmers.000webhostapp.com/ZFB.html?url$` + longEnCodeAliUrl + "@" +shortEnCodeAliUrl + "!";
            let res = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${base64AliUrl}`);

            let shortUrl = res.data[0].url_short;
            return config.newPingHongBao.format(shortUrl);

        }else {
            return "";
        }
    },

    groupHongBaoXML:async (url) => {
        if(url){
            let res_aliUrl = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${url}`);
            let longEnCodeAliUrl = btoa(encodeURIComponent(url));
            let shortEnCodeAliUrl = btoa(encodeURIComponent(res_aliUrl.data[0].url_short));
            let base64AliUrl = `https://bdmers.000webhostapp.com/ZFB.html?url$` + longEnCodeAliUrl + "@" +shortEnCodeAliUrl + "!";
            let res = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${base64AliUrl}`);

            let shortUrl = res.data[0].url_short;
            return config.groupHongBao.format(shortUrl);

        }else {
            return "";
        }
    },

    bigHongBaoXML:async (url) => {
        if(url){
            let res_aliUrl = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${url}`);
            let longEnCodeAliUrl = btoa(encodeURIComponent(url));
            let shortEnCodeAliUrl = btoa(encodeURIComponent(res_aliUrl.data[0].url_short));
            let base64AliUrl = `https://bdmers.000webhostapp.com/ZFB.html?url$` + longEnCodeAliUrl + "@" +shortEnCodeAliUrl + "!";
            let res = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${base64AliUrl}`);

            let shortUrl = res.data[0].url_short;
            return config.bigHongBao.format(shortUrl);
        }else {
            return "";
        }
    },

    taoBaoXML:async (url) => {
        if(url){
            let taoBaoUrl = await axios.get(url);
            let urlStart = taoBaoUrl.data.indexOf("https://market.m.taobao.com/app");
            let urlEnd = taoBaoUrl.data.indexOf("short_name") + 20;
            let realUrl = taoBaoUrl.data.substring(urlStart, urlEnd);
            //编码
            realUrl = btoa(encodeURIComponent(realUrl));

            let base64Url = `https://bdmers.000webhostapp.com/TB.html?url$` + realUrl;
            let res = await axios.get(`${weiboApi}?source=${weiboAppKey}&url_long=${base64Url}`);

            let shortUrl = res.data[0].url_short;
            return config.taoBao.format(shortUrl);
        }else {
            return "";
        }
    },
};