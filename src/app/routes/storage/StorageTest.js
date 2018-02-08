var TestSchema = require('../../models/test');

function storeTest(test){
    for (var i=0;i<test.length;i++){		
        const Save = new TestSchema({		
            test_id:test[i].test_id,
            access_code:test[i].access_code,
            percentage:test[i].percentage,
            points_scored:test[i].points_scored,
            points_available:test[i].points_available,
            time_started:test[i].time_started,
            time_finished:test[i].time_finished,
            duration:test[i].duration
        });	
    

        Save.save(function (err, testAdded){		
            console.log("----- test Added ----- " + testAdded.test_id)		
            if (err) console.log(err)		
        }) 
    }
}

module.exports = storeTest;