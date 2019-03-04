var mongoose = require('mongoose');

var SummaryResults = mongoose.Schema({
    assignment_id:String,
    //user_email: String,
    number_of_results:String,
    knowledge_test_average:String,
    knowledge_points_scored:String,
    knowledge_points_available:String,
    categories:[{
        id: String,
        name:String,
        average:String,
        points_scored:String,
        points_available:String
    }]
});

module.exports = mongoose.model('SummaryResults', SummaryResults);