var LinkResults = require('../../models/LinkResults');
var Codes = require('../../models/Codes');
var Assignments = require('../../models/Assignments');

function storeLinkResult(result) {
    /////////// pendiente verificar que el resultado ya este registrado
    Codes.findOne({'code': result.result.access_code_used},null,(err,code)=>{
        if (err) {throw err}
        if (code){
            if(code.used==0){
                code.used=1;
                code.save(err=>{if(err){throw err}})
                Assignments.findOneAndUpdate({'_id':code.assignment_id,'users.email':code.user_email},{$inc: { 'users.$.codes_used': 1 , 'users.$.codes_created':-1}},(err, doc)=>{
                });
                
                var linkResult = new LinkResults({
                    percentage: result.result.percentage,
                    points_scored: result.result.points_scored,
                    points_available: result.result.points_available,
                    time_started: result.result.time_started,
                    time_finished: result.result.time_finished,
                    duration: result.result.duration,
                    percentage_passmark: result.result.percentage_passmark,
                    passed: result.result.passed,
                    access_code_used: result.result.access_code_used
                });
            
                result.category_results.forEach(category => {
                    linkResult.category_results.push({
                        name: category.name,
                        percentage: category.percentage,
                        points_available: category.points_available,
                        points_scored: category.points_scored
                    });
                });
            
            
                linkResult.save(function (err, testAdded) {
                    if (err) { throw err }
                    //pendiente verificar error
                })
            }
        }
    });
}

module.exports = storeLinkResult;

