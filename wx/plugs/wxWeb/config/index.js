let config = {
    appId: '',
    appSecret: '',
    token: '',
    menu:`[
         {
             "name":"我的",
             "sub_button":[
             {    
                 "type":"view",
                 "name":"个人中心",
                 "url":"https://bdmer.cn/bdmer/mine"
             },
             {    
                 "type":"click",
                 "name":"专属邀请码",
                 "key":"invitation"
             }, 
             {    
                 "type":"view",
                 "name":"充值点数",
                 "url":"https://bdmer.cn/bdmer/recharge/"
             }
             ]
         },
         {
             "name":"一键优惠",
             "sub_button":[
              {    
                 "type":"click",
                 "name":"拆取红包",
                 "key":"chaiUrl"
             },
             {    
                 "type":"view",
                 "name":"点数获取",
                 "url":"https://bdmer.cn/bdmer/bind"
             },
             {    
                 "type":"click",
                 "name":"一键最大",
                 "key":"getHongBao"
             }
             ]
         },
         {
             "name":"帮助",
             "sub_button":[
             {    
                 "type":"view",
                 "name":"通知公告",
                 "url":"https://bdmer.cn/about/notice"
             },
             {    
                 "type":"view",
                 "name":"新手教程",
                 "url":"https://bdmer.cn/course"
             },
             {    
                 "type": "view", 
                 "name": "联系客服", 
                 "url": "https://bdmer.cn/about/kefu"
             }
             ]
         }
         ]`,
    templateId:{fail:'YbekRKHcStxEERQeF4R3-gbZ4FhofWEHBlE1r0xdwvI', success:'ff9NHJR0ZW_JQVqhTRkGoEwg4X1GTcq-6IOxk6AeanQ', recharge:''},
    qrcode:{temporary:'QR_SCENE', forever:'QR_LIMIT_SCENE'},
    login:`https://open.weixin.qq.com/connect/oauth2/authorize?appid={0}&redirect_uri={1}&response_type=code&scope=snsapi_base&state=bdmer#wechat_redirect`,
    mchid:'',
    mchidKey:'',
    notify_url:'https://bdmer.cn/bdmer/payJsOkCallBack',
    points:{get:0,chai:5,bind:5,getBig:10,invitation:5,subscribe:15}
};

module.exports = config;