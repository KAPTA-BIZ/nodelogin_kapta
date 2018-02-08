var mongoose = require('mongoose');

var GroupSchema = mongoose.Schema({
    group_name: String,
    group_id:Number
});

module.exports = mongoose.model('GroupSchema', GroupSchema)