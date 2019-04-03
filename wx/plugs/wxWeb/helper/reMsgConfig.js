let reMsgConfig = {
    textXML: `<xml> 
<ToUserName><![CDATA[{0}]]></ToUserName> 
<FromUserName><![CDATA[gh_2f12b15e047a]]></FromUserName> 
<CreateTime>{1}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[{2}]]></Content> 
</xml>`,
    imgXML:`<xml>
<ToUserName><![CDATA[{0}]]></ToUserName>
<FromUserName><![CDATA[gh_2f12b15e047a]]></FromUserName>
<CreateTime>{1}</CreateTime>
<MsgType><![CDATA[image]]></MsgType>
<Image><MediaId><![CDATA[{2}]]></MediaId></Image>
</xml>`,
    preMsgId:'',
    preFromUserName:'',
    preCreateTime:'',
    elemeUrl:`https://h5.ele.me/hongbao/#hardware_id=&is_lucky_group=True&lucky_number=0&track_id=&platform=0&sn={0}&theme_id=3393&device_id=&refer_user_id=`,
    chaiUrl:`https://h5.ele.me/grouping/?from=owner`
};

module.exports = reMsgConfig;