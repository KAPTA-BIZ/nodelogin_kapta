var { API_KEY, API_SECRET, CURRENT_UNIX_TIMESTAMP, SIGNATURE, FINISHED_AFTER_TIMESTAMP } = require('./credentials')

var get_all_available = "https://api.classmarker.com/v1.json?api_key=" + API_KEY + "&signature=" + SIGNATURE + "&timestamp=" + CURRENT_UNIX_TIMESTAMP 

module.exports = get_all_available;