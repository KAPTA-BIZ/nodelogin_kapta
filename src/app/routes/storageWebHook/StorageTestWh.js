//Usa modelo test
var TestSchema = require('../../models/test');

function storeTestWh(test){
    		
        var Save = new TestSchema({		
            test_id:test.test.test_id,
            access_code:test.result.access_code_used,
            percentage:test.result.percentage,
            points_scored:test.result.points_scored,
            points_available:test.result.points_available,
            time_started:test.result.time_started,
            time_finished:test.result.time_finished,
            duration:test.result.duration,
            link_url_id:test.link.link_url_id,
            category_results: test.category_results,
            questions: test.questions
            
            
        });	
        
        //console.log(Save.category_results)
        
        
        
        Save.save(function (err, testAdded){		
            console.log("----- test Added ----- " + testAdded.test_id)		
            if (err) console.log(err)		
        }) 
    
}

module.exports = storeTestWh;

