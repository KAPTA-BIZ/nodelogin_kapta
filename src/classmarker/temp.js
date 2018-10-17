var MD5 = require('./MD5.js');

var get_temp = function(link_id,test_id){
    var API_KEY = '1V33QYTiOjwWB4MahW8N0MyjfFi2xFjx';
    var API_SECRET = 'bKYxJSf7cBZjdMoPjsdNfB5pMKqJv0h3pgY99Dcg';
    var CURRENT_UNIX_TIMESTAMP = (Math.round(+new Date() / 1000));
    var AFTER_TIMESTAMP=(Math.round(+new Date(2018,4,01,0,0,0) / 1000));
    var SIGNATURE = MD5(API_KEY + API_SECRET + CURRENT_UNIX_TIMESTAMP);
    return "https://api.classmarker.com/v1/links/"+link_id+"/tests/"+test_id+"/recent_results.json?api_key="+API_KEY+"&signature="+SIGNATURE+"&timestamp="+CURRENT_UNIX_TIMESTAMP+"&finishedAfterTimestamp="+AFTER_TIMESTAMP
}
 
module.exports = get_temp;