
var LinkSchema = require('../../models/linkTest')
var mongoose = require('mongoose');


function storeLink(linkTest){
    LinkSchema.find(function (err,result){
        console.log("longitud" , linkTest.links.length);
        
        result.map((info) => {
            
            if(linkTest.links.length>0){
            for (var i=0;i<linkTest.links.length;i++){
                
                 console.log("longitud" , linkTest.links.length);
                 console.log("longitud" , linkTest.links[i].link.assigned_tests[0].test.test_name);
                
                const SaveLinks = new LinkSchema({		
                    test_name: linkTest.links[i].link.assigned_tests[0].test.test_name,		
                    test_id: linkTest.links[i].link.assigned_tests[0].test.test_id
                });

                if(info.test_id !== SaveLinks.test_id){
                    SaveLinks.save(function (err, linkTestAdded){		
                        console.log("----- linkTest Added ----- " + linkTestAdded)		
                        if (err) console.log(err)		
                    }) 
                }else{
                    console.log("Esos links ya fueron registrados.")
                }
              }
            }
        })

        if(err) {
            console.log("ERROR " + err)
    
        }    
    })
}

module.exports = storeLink