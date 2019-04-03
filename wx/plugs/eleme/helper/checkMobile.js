/**
 * 比对用户手机号与返回手机
 */
module.exports = function checkMobile(userMobile, resMobile) {
    if (userMobile.substring(0,3) === resMobile.substring(0,3) && userMobile.substring(8,11) === resMobile.substring(8,11)) {
        return true;
    }
    return false;
}