const log4js = require('log4js');
const path = require('path');


log4js.configure({
    appenders: {
        console: {
            type: 'console'
        },
        wxWeb: {
            type: 'dateFile',
            filename: path.join(__dirname, '../../', 'logs/wxWeb-'),
            encoding: 'utf-8',
            maxLogSize: 1024000,
            backups: 10,
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
        eleme: {
            type: 'dateFile',
            filename: path.join(__dirname, '../../', '/logs/eleme-'),
            encoding: 'utf-8',
            maxLogSize: 1024000,
            backups: 10,
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: {
            appenders: ['console', 'wxWeb'],
            level: 'trace'
        },
        wxWeb: {
            appenders: ['console','wxWeb'],
            level: 'info'
        },
        eleme: {
            appenders: ['console','eleme'],
            level: 'info'
        }
    },
    pm2: true,
    replaceConsole: true
});

module.exports = log4js;