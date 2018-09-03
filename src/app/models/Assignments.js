var mongoose = require('mongoose');

var Assignments = mongoose.Schema({
    test_id: String,
    test_name: String,
    link_name: String,
    link_id: String,
    link_url_id: String,
    access_list_id: String,
    admin_email: String,
    codes_max: String,
    codes_created: String,
    codes_used: String,
    codes_availables: Number,
    users: [{
        email: String,
        codes_max: String,
        codes_created: String,
        codes_used: String,
        created_by: String
    }]
});

module.exports = mongoose.model('Assignments', Assignments);