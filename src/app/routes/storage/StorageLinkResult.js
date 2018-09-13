var LinkResults = require('../../models/LinkResults');
var Codes = require('../../models/Codes');
var Assignments = require('../../models/Assignments');
var UserSchema = require('../../models/user.js');

function storeLinkResult(result) {
    /////////// pendiente verificar que el resultado ya este registrado
    Codes.findOne({'code': result.result.access_code_used},null,(err,code)=>{
        if (err) {throw err}
        if (code){
            if(code.used==0){
                code.used=1;
                code.save(err=>{if(err){throw err}})

                UserSchema.findOne({'local.email':code.user_email},'sa',(err, user)=>{
                    console.log(user.sa)
                    if (user.sa==2){
                        Assignments.findByIdAndUpdate(code.assignment_id,{$inc:{'codes_used':1,'codes_created':-1}},(err,doc)=>{
                            //pendiente verificar
                        })
                    }else{
                        Assignments.findOneAndUpdate({'_id':code.assignment_id,'users.email':code.user_email},{$inc: { 'users.$.codes_used': 1 , 'users.$.codes_created':-1}},(err, doc)=>{
                        //pendiente por verificar
                        });
                    }
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
                    console.log ("new result added")
                    //pendiente verificar error
                })
            }
        }
    });
}

module.exports = storeLinkResult;

