var mongoose = require('mongoose');

var LSchema = mongoose.Schema({
    link_name: String,
    link_id:String,
    link_url_id:String
});

module.exports = mongoose.model('LSchema', LSchema)