var mongoose = require('mongoose');

var SJT_Competences = mongoose.Schema({
    questions: [{
        classmarker_question_id: String
    }],
    habilities:[{
        hability_name: String
    }],
    number: String,
    name: String,
    min: String,
    max: String
});

module.exports = mongoose.model('SJT_Competences', SJT_Competences);
