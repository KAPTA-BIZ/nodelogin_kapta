var mongoose = require('mongoose');

var LinkSchema = mongoose.Schema({
    test_name: String,
    test_id:String,
});

module.exports = mongoose.model('LinkSchema', LinkSchema)