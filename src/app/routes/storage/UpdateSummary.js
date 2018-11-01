var Codes = require('../../models/Codes');
var LinkResults = require('../../models/LinkResults');
var SummaryResults = require('../../models/SummaryResults');

function UpdateSummary(assignment_id,user_email){
    if(assignment_id&&user_email){
        Codes.find({'assignment_id':assignment_id,'user_email':user_email,'used':1},null,(err,codes_list)=>{
            if(err)throw err;
            codes=[];
            codes_list.forEach(code=>{
                codes.push(code.code);
            });

            LinkResults.find({'access_code_used':{$in:codes}},null,(err,results_list)=>{
                if(err)throw err;
                average=0;
                categories=[];
                results_list.forEach(result=>{
                    average+=Number(result.percentage);
                    result.category_results.forEach(categorie=>{
                        index = categories.findIndex(doc => doc.name == categorie.name);
                        if(index==-1){
                            categories.push({
                                name:categorie.name,
                                average:categorie.percentage,
                                points_scored: categorie.points_scored,
                                points_available: categorie.points_available
                            });
                        }else{
                            categories[index].average+=categorie.percentage;
                            categories[index].points_scored+=categorie.points_scored;
                            categories[index].points_available+=categorie.points_available;
                        }
                    });
                });
                categories.forEach(categorie=>{
                    categorie.average=categorie.average/codes.length;
                })
                data={
                    assignment_id:assignment_id,
                    user_email: user_email,
                    number_of_results:codes.length,
                    test_average:average/codes.length,
                    categories:categories
                };

                SummaryResults.findOne({'assignment_id':assignment_id,'user_email':user_email},null,(err,summary)=>{
                    if (err)throw err;
                    if(summary){
                        summary.number_of_results=data.number_of_results;
                        summary.test_average=data.test_average;
                        summary.categories=data.categories;
                    }else{
                        var summary= new SummaryResults(data);
                    }
                    summary.save();
                });
                console.log('codes_list',data);
            });
        });
    }
}

module.exports=UpdateSummary;