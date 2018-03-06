var mongoose = require('mongoose');

var aSchema = mongoose.Schema({
    name:String,
    code:String,
    access_code:String
});

module.exports = mongoose.model('aSchema', aSchema);
