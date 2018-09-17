var mongoose = require('mongoose');

var LinkResults = mongoose.Schema({
    test_name: String,
    percentage: String,
    points_scored: String,
    points_available: String,
    time_started: String,
    time_finished: String,
    duration: String,
    percentage_passmark: String,
    passed: String,
    access_code_used: String,
    questions: [{
        question_type: String,
        category: String,
        question: String,
        options:{},
        correct_option: String,
        user_response:String,
        result: String,
        points_available: String,
        points_scored: String
    }],
    category_results: [{
        name: String,
        percentage: Number,
        points_available: Number,
        points_scored: Number
    }]
});

module.exports = mongoose.model('LinkResults', LinkResults);
