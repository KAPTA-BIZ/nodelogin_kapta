var mongoose = require('mongoose');

var HookSchema = mongoose.Schema({
    category:String,
    test_id:String,
    access_code:String
});

module.exports = mongoose.model('HookSchema', HookSchema);
