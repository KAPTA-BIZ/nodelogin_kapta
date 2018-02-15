var mongoose = require('mongoose');

var Categories = mongoose.Schema({
    name: String
});

module.exports = mongoose.model('Categories', Categories);
