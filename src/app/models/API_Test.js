var mongoose = require('mongoose');

var API_Test = mongoose.Schema({
    test_id: String,
    test_name: String,
    links: [{
        link_name: String,
        link_id: String,
        link_url_id: String,
        access_list_id: String,
    }]
});

module.exports = mongoose.model('API_Test', API_Test);