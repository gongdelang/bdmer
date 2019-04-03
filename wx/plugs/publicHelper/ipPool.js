const axios = require('axios');

let request = axios.create({
    baseURL: 'IP地址:5020',
    timeout: 1000
});

let ipPool = {};

ipPool.getAIP = async ()=> {
    try{
        let data = await request['get']('/get');

        if(data.data){
            data = data.data;
        }else{
            return {};
        }

        if(!(/:/.test(data))){
            return {};
        }

        let proxyArr = data.split(":");
        let proxy = {};
        proxy.host = proxyArr[0];
        proxy.port = parseInt(proxyArr[1]);
        return proxy;
    }catch (e) {
        console.log(`获取ipPool错误${e.message}`);
        return {};
    }
};

ipPool.deleteAIP = async (proxy)=> {
    try{
        let proxyStr = `${proxy.host}:${proxy.port}`;
        await request['delete'](`/get?proxy=${proxyStr}`);
        return true;
    }catch (e) {
        console.log(`删除ipPool错误${e.message}`);
        return false;
    }

};


module.exports = ipPool;

/*
(async ()=>{
    ipPool.getAIP();
})();*/
