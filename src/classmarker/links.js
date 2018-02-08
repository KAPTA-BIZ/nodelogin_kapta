var { API_KEY, API_SECRET, CURRENT_UNIX_TIMESTAMP, SIGNATURE, FINISHED_AFTER_TIMESTAMP } = require('./credentials')

var get_links = "https://api.classmarker.com/v1/links/recent_results.json?api_key=" + API_KEY + "&signature=" + SIGNATURE + "&timestamp=" + CURRENT_UNIX_TIMESTAMP + "&finishedAfterTimestamp=" + FINISHED_AFTER_TIMESTAMP ;

module.exports = get_links;