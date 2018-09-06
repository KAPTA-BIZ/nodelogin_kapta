var mongoose = require('mongoose');

var LinkResults = mongoose.Schema({
    percentage: String,
    points_scored: String,
    points_available: String,
    time_started: String,
    time_finished: String,
    duration: String,
    percentage_passmark: String,
    passed: String,
    access_code_used: String,
    questions:[],
    category_results:[{
        name: String,
        percentage:Number,
        points_available:Number,
        points_scored:Number
    }]
});

module.exports = mongoose.model('LinkResults', LinkResults);
