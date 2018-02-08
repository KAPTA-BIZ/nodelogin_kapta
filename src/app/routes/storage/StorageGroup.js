function storeLink(group){
    for (var i=0;i<group.length;i++){		
        const Save = new GroupSchema({		
            group_name: group[i].test_name,		
            group_id: group[i].test_id
        });		
        Save.save(function (err, groupAdded){		
            console.log("----- group Added ----- " + groupAdded)		
            if (err) console.log(err)		
        }) 
    }
}