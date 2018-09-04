var mongoose = require('mongoose');

var Codes = mongoose.Schema({
    code:String,
    used:String,
    assignment_id:String,
    user_email: String
});

module.exports = mongoose.model('Codes', Codes);
