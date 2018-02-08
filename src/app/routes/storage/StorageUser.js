function storeUser(user){
    for (var i=0;i<user.length;i++){		
        const SaveUsers = new UserSchema({		
            name: user[i].name,		
            email: user[i].email,		
            password: user[i].password
        });		
        SaveUsers.save(function (err, userAdded){		
            console.log("----- USERS Added ----- " + userAdded)		
            if (err) console.log(err)		
        }) 
    }
}