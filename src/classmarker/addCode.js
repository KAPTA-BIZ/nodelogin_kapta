var MD5 = require('./MD5.js');

var post_code = function (access_list_id) {
    var API_KEY = '1V33QYTiOjwWB4MahW8N0MyjfFi2xFjx';
    var API_SECRET = 'bKYxJSf7cBZjdMoPjsdNfB5pMKqJv0h3pgY99Dcg';
    var CURRENT_UNIX_TIMESTAMP = (Math.round(+new Date() / 1000));
    var SIGNATURE = MD5(API_KEY + API_SECRET + CURRENT_UNIX_TIMESTAMP);
    return "https://api.classmarker.com/v1/accesslists/" + access_list_id + ".json?api_key=" + API_KEY + "&signature=" + SIGNATURE + "&timestamp=" + CURRENT_UNIX_TIMESTAMP
}

module.exports = post_code;