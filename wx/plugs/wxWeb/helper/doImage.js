const fs = require('fs');
const qr = require('qr-image');
const images = require("images");
const path = require('path');


doImage = {};
/**
 * 根据地址生成二维码
 * 参数 url(string) 地址
 * 参数 callback(Function)
 */
doImage.createQr = function(url, uid){
    return new Promise(( resolve, reject ) => {
        let qr_jpg = qr.image(url, { type: 'png',size : 6 });
        let imgName = `${uid}.png`;
        let qr_pipe = qr_jpg.pipe(fs.createWriteStream(path.join(__dirname, '../../../', `/public/image/qrcode/${imgName}`)));
        qr_pipe.on('error', function(err){
            console.log(err);
            reject(`${uid}-二维码生成失败`);
        });
        qr_pipe.on('finish', function(){
            console.log(`${uid}-二维码生成成功`);
            resolve(`ok`)
        });
    });
};

/**
 * 给图片添加水印
 * 参数 sourceImg(string) 原图片路径
 * 参数 waterImg(string) 水印图片路径
 * 参数 callback(Function)
 */
doImage.addWater = function(sourceImg, waterImg){
    return new Promise(( resolve, reject ) => {
        let lastput = waterImg;
        try{
            images(sourceImg)                    //Load image from file
            //加载图像文件
                .size(650)                          //Geometric scaling the image to 400 pixels width
                //等比缩放图像到400像素宽
                .draw(images(waterImg), 200, 525)   //Drawn logo at coordinates (70,260)//为了遮住不该看的东西..
                //在(10,10)处绘制Logo
                .save(lastput, {               //Save the image to a file,whih quality 50
                    quality : 50                    //保存图片到文件,图片质量为50
                });
            console.log(`${waterImg}-图片生成成功`);
            resolve(`${waterImg}-图片生成成功`);
        }catch(err){
            console.log(err);
            reject(`${waterImg}-图片生成失败`);
        }
    });
};

module.exports = doImage;
