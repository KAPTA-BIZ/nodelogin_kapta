var MD5 = require('./MD5.js');

var get_all_available = function(){
    var API_KEY = '1V33QYTiOjwWB4MahW8N0MyjfFi2xFjx';
    var API_SECRET = 'bKYxJSf7cBZjdMoPjsdNfB5pMKqJv0h3pgY99Dcg';
    var CURRENT_UNIX_TIMESTAMP = (Math.round(+new Date() / 1000));
    var SIGNATURE = MD5(API_KEY + API_SECRET + CURRENT_UNIX_TIMESTAMP);
    return "https://api.classmarker.com/v1.json?api_key=" + API_KEY + "&signature=" + SIGNATURE + "&timestamp=" + CURRENT_UNIX_TIMESTAMP
}
 
module.exports = get_all_available;