var LinkSchema = require('../../models/linkTest')
var mongoose = require('mongoose');


function storeLink(linkTest){
    LinkSchema.find(function (err,result){
        
        console.log("longitud" , linkTest);
        result.map((info) => {
            
                var SaveLinks = new LinkSchema({	
                    
                    test_name: linkTest.link.assigned_tests.test.test_name,		
                    test_id: linkTest.link.assigned_tests.test.test_id
                });

                if(info.test_id !== SaveLinks.test_id){
                    SaveLinks.save(function (err, linkTestAdded){		
                        console.log("----- linkTest Added ----- " + linkTestAdded)		
                        if (err) console.log(err)		
                    }) 
                }else{
                    console.log("Esos links ya fueron registrados.")
                }
        })

        if(err) {
            console.log("ERROR " + err)
    
        }    
    })
}

module.exports = storeLink

