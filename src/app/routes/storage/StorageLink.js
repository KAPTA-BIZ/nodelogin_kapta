function storeLink(link){
    for (var i=0;i<link.length;i++){		
        const Save = new LSchema({		
            link_name: linkTest[i].link_name,		
            link_id: linkTest[i].link_id,
            link_url_id: linkTest[i].link_url_id
        });		
        SaveLinks.save(function (err, linkTestAdded){		
            console.log("----- linkTest Added ----- " + linkTestAdded)		
            if (err) console.log(err)		
        }) 
    }
}