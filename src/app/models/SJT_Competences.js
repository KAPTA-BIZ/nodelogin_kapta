var mongoose = require('mongoose');

var SJT_Competences = mongoose.Schema({
    questions: [{
        classmarker_question_id: String
    }],
    habilities:[{
        hability_name: String
    }],
    insufficient:[],
    insufficient_es:[],
    adequate:[],
    adequate_es:[],
    excellent:[],
    excellent_es:[],
    number: String,
    name: String,
    name_es: String,
    min: String,
    max: String
});

module.exports = mongoose.model('SJT_Competences', SJT_Competences);
