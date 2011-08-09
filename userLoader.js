var argv = require('optimist')
            .usage(['Usage: --password=[consumer password] ',
                    '--username=[consumer username]',
                    '--email=[consumer email]'].join(' '))
            .demand(['password','username']).argv;

var dbMan = require('./webcbr_models.js');
var bcrypt = require('bcrypt');
var salt = bcrypt.gen_salt_sync(10);  
var hash = bcrypt.encrypt_sync(argv.password.toString(), salt);

dbMan.webUsersModel.findOne({'username':argv.username},function(err,existingUser){
    if(err){
        console.log(err); 
        return;
    };
    if(existingUser && bcrypt.compare_sync(argv.password.toString(), existingUser.password)){
        console.log('User already exists , updating ');
        existingUser.username = argv.username;
        existingUser.email = argv.email;

        existingUser.save(function(err){
             if(err){
                console.log(err); 
                return;
             } 
             console.log('Existing User Updated');
             process.exit();
        });       
    }else{
        var user = new dbMan.webUsersModel();
        user.username = argv.username;
        user.password = hash;
        user.email = argv.email;

        user.save(function(err){
             if(err){
                console.log(err); 
                return;
             } 
             console.log('User saved');
             process.exit();
        });
    };
});
