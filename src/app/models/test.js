var mongoose = require('mongoose');

var TestSchema = mongoose.Schema({
    test_id:String,
    access_code:String,
    percentage:Number,
    points_scored:Number,
    points_available:Number,
    time_started:String,
    time_finished:String,
    duration:String,
    id_inst: String
});

module.exports = mongoose.model('TestSchema', TestSchema);
