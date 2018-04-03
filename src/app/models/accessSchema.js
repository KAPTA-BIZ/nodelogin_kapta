var mongoose = require('mongoose');

var aSchema = mongoose.Schema({
    name:String,
    code:String,
    access_code:String,
    id_ins: String
});

module.exports = mongoose.model('aSchema', aSchema);
