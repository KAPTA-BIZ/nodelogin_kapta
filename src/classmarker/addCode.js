var { API_KEY, API_SECRET, CURRENT_UNIX_TIMESTAMP, SIGNATURE, FINISHED_AFTER_TIMESTAMP } = require('./credentials')

var post_code = function (access_list_id) {
    return "https://api.classmarker.com/v1/accesslists/" + access_list_id + ".json?api_key=" + API_KEY + "&signature=" + SIGNATURE + "&timestamp=" + CURRENT_UNIX_TIMESTAMP
}

module.exports = post_code;