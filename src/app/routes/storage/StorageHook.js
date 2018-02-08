var HookSchema = require('../../models/hook');

function storeHook(jsonData){
    console.log(jsonData.category_results)
    const SaveHook = new HookSchema({
        category          : jsonData.category_results[0].name,
        test_id           : jsonData.test.test_id,
        access_code       : jsonData.result.access_code_used
    });
    
    SaveHook.save(function (err){		
       console.log("----- HOOK Added -----");
       if (err) console.log(err);		
    });        
}

module.exports = storeHook;