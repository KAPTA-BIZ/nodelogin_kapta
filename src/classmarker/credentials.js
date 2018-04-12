var MD5 = require('./MD5.js');
var API_KEY = 'W7pFXBWBWF3Qxvvmz1hE9kp3d3fG3YsX';
var API_SECRET = '4Hdzo0blKcBH65Y46ggBV2C85nK7Ld2nPeMDjtuY';
var CURRENT_UNIX_TIMESTAMP = (Math.round(+new Date()/1000));
var SIGNATURE = MD5(API_KEY + API_SECRET + CURRENT_UNIX_TIMESTAMP);

var today = new Date();
var two_weeks_ago = new Date(today.getTime() - (60*60*24*13*1000));

console.log(CURRENT_UNIX_TIMESTAMP)

var FINISHED_AFTER_TIMESTAMP = two_weeks_ago / 1000;

module.exports={
    API_KEY,
    API_SECRET,
    CURRENT_UNIX_TIMESTAMP,
    SIGNATURE,
    FINISHED_AFTER_TIMESTAMP
}

