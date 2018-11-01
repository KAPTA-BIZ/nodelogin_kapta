var mongoose = require('mongoose');

var SummaryResults = mongoose.Schema({
    assignment_id:String,
    user_email: String,
    number_of_results:String,
    test_average:String,
    categories:[{
        name:String,
        average:String,
        points_scored:String,
        points_available:String
    }]
});

module.exports = mongoose.model('SummaryResults', SummaryResults);