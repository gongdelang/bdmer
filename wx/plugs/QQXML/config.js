let config = {
    pingHongBao:`<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><msg serviceID="27" templateID="1" action="web" brief="[转账]你收到一笔转账" sourceMsgId="0" url="{0}" flag="0" adverSign="0" multiMsgFlag="0"><item layout="1"  bg="-1694123"><title size="40">恭喜发财  , 大吉大利</title><title size="30">领取5/88个，剩余177.00元</title></item><item layout="1"><summary size="28">拼手气红包</summary></item></msg>`,

    newPingHongBao:`<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><msg serviceID="27" templateID="1" action="web" brief="[QQ红包]恭喜发财，大吉大利" sourceMsgId="20" url="{0}" flag="0" adverSign="0" multiMsgFlag="0"><item layout="1" bg="-1694379"><title size="44">QQ红包</title><title size="33">恭喜发财，大吉大利</title><tr /></item><item layout="6"><summary size="28" color="#9C9C9C">拼手气红包</summary></item><source name="" icon="" action="" appid="-1" /></msg>
`,

    groupHongBao:`<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><msg serviceID="27" templateID="1" action="web" brief="[您有新的回复]" sourceMsgId="0" url="{0}" flag="2" adverSign="0" multiMsgFlag="0"><item layout="2" mode="1" bg="-88832"><picture cover="http://wx3.sinaimg.cn/mw690/0060lm7Tly1fupxocn04vj3050050q32.jpg" w="0" h="0" /><title size="40">恭喜发财 大吉大利</title><summary> </summary></item><item layout="6"><summary size="24" color="#666666">QQ群红包</summary></item><source name="" icon="" action="" appid="-1" /></msg>`,

    bigHongBao:`<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><msg serviceID="6" templateID="1" action="web" brief="[QQ红包]恭喜发财" sourceMsgId="0" url="{0}" flag="0" adverSign="0" multiMsgFlag="0"><item layout="1" bg="-1694379"><title style="0"></title><picture cover="http://t.cn/EhBd1HQ" w="0" h="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><source name="QQ红包" icon="" action="" appid="-1" /></msg>`,

    wangZhe:``,

    taoBao:`<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><msg serviceID="6" templateID="1" action="web" brief="淘宝双11助力" sourceMsgId="0" url="{0}" flag="0" adverSign="0" multiMsgFlag="0"><item layout="1"><picture cover="http://t.cn/EwKJchn" w="0" h="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><item layout="6"><hr hidden="false" style="0" /></item><source name="淘宝双11" icon="" action="" appid="-1" /></msg>`,
};

module.exports = config;