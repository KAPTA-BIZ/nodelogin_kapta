var TestSchema = require('../../models/test');

function storeTestHook(jsonData){
    const SaveTestHook = new TestSchema({
        test_id           : jsonData.test.test_id,
        access_code       : jsonData.result.access_code_used,
        percentage        : jsonData.result.percentage,
        points_scored     : jsonData.result.points_scored,
        points_available  : jsonData.result.points_available,
        time_started      : jsonData.result.time_started,
        time_finished     : jsonData.result.time_finished,
        duration          : jsonData.result.duration
    });
    
    SaveTestHook.save(function (err){		
       console.log("----- TEST HOOK Added -----");
       if (err) console.log(err);		
    });        
}

module.exports = storeTestHook;