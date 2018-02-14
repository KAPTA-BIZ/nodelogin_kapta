var express = require('express');
var mongoose = require('mongoose');
var { buildSchema } = require('graphql');
var { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
var request = require('request');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var crypto = require('crypto');
var { authenticate } = require('../../graphql/authentication');
var schema = require('../../graphql/schema.js');
var UserSchema = require('../models/user.js');
var TestSchema = require('../models/test.js');
var HookSchema = require('../models/hook.js');
var LinkSchema = require('../models/linkTest.js');
var LSchema = require('../models/link.js');
var GroupSchema = require('../models/group.js');
var get_all_available = require('../../classmarker/all');
var get_links = require('../../classmarker/links');
var get_groups = require('../../classmarker/groups');
var storageLinkTest = require('./storage/StorageLinkTest');
var storageTest = require('./storage/StorageTest');
var storageHook = require('./storage/StorageHook');
var storageTestHook = require('./storage/StorageTestHook');
var storageTestWh = require('./storageWebHook/StorageTestWh');
var mongo = require('mongodb');
var assert = require('assert');

mongoose.Promise = global.Promise;

const { url } = require('../../config/database');

var forge = require('node-forge');

module.exports = (app, passport) => {



    /*------------------------- JOIN PROJECT START----------------------------*/ 

    app.get('/', (req,res,next) => {
        //res.render('home/index.jsx', {foo: 'bar'});
        res.render('index');
      });

    /*------------CONEXION WEBHOOK START------------*/

    app.use(bodyParser.json())
    
    app.post('/', (req,res) => {
        var jsonData = req.body;
        var secret = 'Yu92voJl59q4Bwp';
        var verified = crypto.createHmac('sha256', secret).update('X-Classmarker-Hmac-Sha256').digest('hex');

        if(verified){
            //Guardar test Web Hook
            storageTestWh(jsonData);
            res.sendStatus(200);
          }else{
            res.sendStatus(500);
          }
    });
    
    /*------------CONEXION WEBHOOK END------------*/
    
    
    app.get('/dashboard', (req,res) => {
        res.send('Dashboard');
      });

    
    const buildOptions = async (req,res) =>{
     const user = await authenticate(req, UserSchema);
        return {
          context: {
            UserSchema,
            TestSchema,
            LinkSchema,
            GroupSchema,
            HookSchema
          },
          schema
        };
      };


    app.use( '/graphql', bodyParser.json(), graphqlExpress(buildOptions));

    app.use('/graphiql', graphiqlExpress({ 
        endpointURL: '/graphql',
        passHeader: ` 'Authorization': 'bearer token-camilo.arguello@kapta.biz' `
      }));


    app.get ('/get_all_available', (req, res) => {
        request (get_all_available, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              var cleanBody = JSON.parse(body);
              //console.log(cleanBody);
              //res.json(cleanBody);
              storageLinkTest(cleanBody)
            }
            return console.log(error);
        });
      });
      

    app.get ('/get_links', function (req, res) {
        request (get_links, function (error, response, body) {
            if (!error && response.statusCode === 200) {
              var cleanBody = JSON.parse(body);
              res.json(cleanBody.links);
            }
            return console.log(error);
        });
      });

    app.get ('/get_groups', function (req, res) {
        request (get_groups, function (error, response, body) {
            if (!error && response.statusCode === 200) {
              var cleanBody = JSON.parse(body);
              res.json(cleanBody);
            }
            return console.log(error);
        });
      });


    /*-------------------------- JOIN PROJECT END ----------------------------*/ 

    app.get('/', (req, res) => {
        res.render('index');
    });

    /*------------- LOGIN VIEW ------------------*/
    app.get('/login', (req, res) => {
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });

    /*----------------- LOGIN --------------------*/
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }));

    /*------- REGISTRO VIEW ONLY SUPER ADMIN -------
    app.get('/signup', isLoggedIn, (req, res) => {
        res.render('signup', {
            message: req.flash('signupMessage')
        });
    });*/

    //Vista simple para SignUp (Todos los usuarios)


    /*----------------- REGISTRO POST-------------------*/
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true,
        //Session false para que no inicie sesión al crear una cuenta
        session: false
    }));
    
    

    /*------------------- VIEW PERFIL ------------------*/
    app.get('/profile', isLoggedIn, (req, res) => {
        if(req.user)
            console.log(req.user.sa)
        res.render('profile', { user: req.user });
    });

    /*------------------- VIEW PERFIL ------------------*/
    app.get('/statistics', isLoggedIn, (req, res) => {
        res.render('statistics', {
            user: req.user,
            //sesion: req.session.nuevaSesion
        });
    });


    /*-------------------- LOGOUT ----------------------*/
    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    /*-----------  FUNCIONLOGIN VALIDATION -------------*/
    function isLoggedIn(req, res, next) {
        if(req.isAuthenticated()){
            return next(); 
        }
        return  res.send('Debe estar autenticado');
        //Next: Crear View para decir que debe estar autenticado
        //return res.redirect('/');
    }


    /* ------- FUNCION PARA ENCONTRAR INSCRITOS --------*/

    function lista(req, res, next) {

        var id = req.user.id;
        //nuevo objeto clase test, para buscar test asociados
        var newTestSchema = new TestSchema();
        
        //busqueda de test asociados con id_inst=id
        TestSchema.find({id_inst: id}, function(err, test){
            if(err){
                console.log(err);
                }
                if(!test){
                    console.log("no hay inscritos")
                    return next();
                }else{
                    //esto se muestra
                    res.json(test);
                    //res.render('list')
                    
                }
        });
    }


    
    /* ---------------- LOGIN SUPER ADMIN --------------*/
    //Autentica a SuperAdmin comprobando que req.user.sa exista
    
    app.get('/signup', isLoggedIn, (req, res) => {
        //prueba temporal, aun no sirve user.sa
        if(req.user.sa){
        //if(req.user.sa){
        res.render('signup', {
            user: req.user,
            message: req.flash('signupMessage')
        });
        console.log("Si es super");
        }
        res.sendStatus(404);
        console.log("No autorizado");
    });

    /* --------------- REGISTRAR INSTRUCTOR -------------*/
    
    app.get('/newpart', isLoggedIn, (req, res) => {
        res.render('new_part', {
            user: req.user,
            message: req.flash('signupMessage')
        });
    }) 


    /*----- CONSULTA JSON COLLECCION testSchemas -------*/
    
    /*
    app.get('/new/:id', function(req, res){
        console.log("entro a new");
        TestSchema.findOne({access_code: req.params.id})
        //TestSchema.find({},'access_code')
        .exec(function(err, testSchemas){
            if(err){
                console.log("Error retrieving");
        }else{
            res.json(testSchemas);
            }
        });
    });
    */

    /* --------- REGISTRAR NUEVO ACCESS CODE (PRUEBA NO SE USA) ------- */

    
    /*
    app.post('/new', function(req, res){
        console.log('Ingreso');
        var newTestSchema = new TestSchema();
        newTestSchema.access_code = req.body.access_code;
        newTestSchema.id_inst = req.body.id_inst;
        newTestSchema.save(function(err, register){
            if(err){
                console.log('Error al guardar');
            }else{
                res.json(register);
            }
        });
     });
     */

    /*------------- UPDATE id_inst FIND access_code ------------*/

    /*----------- VERIFICA SI EXISTE EL ACCESS CODE  -----------*/

    app.post('/newpart', function(req, res){
        console.log('Update participante');

        var newTestSchema = new TestSchema();
        var access_code = req.body.access_code;
        
        TestSchema.findOne({access_code: access_code}, function(err, test){
            if(err){
                console.log(err);
                    console.log(err); 
                }
                if(!test){
                    console.log("no existe")
                }else{
                    console.log("si existe");
                    /*----------- SI EXISTE, SE HAYA EL DOC Y SE ACTUALIZA -------*/
                    newTestSchema.access_code = req.body.access_code;
                    TestSchema.findOneAndUpdate({access_code: req.body.access_code},
                    {
                        $set: {id_inst: req.body.id_inst}
                    },
                    {
                        new: true
                    },
                    function(err, updateTest){
                        if(err){
                            res.send("Error actualizando");
                        }else{
                            res.json(updateTest);
                            }
                        }
                    )
                }
        });
    });
    
    /*-------------- REGISTRAR LINK --------------*/
    //Se accede por GET al id del instructor y se lo pasa a la vista 
    //en modo Hidden para ser pasado por POST a la siguiente ruta 
    
    app.get('/newlink/:id', isLoggedIn, (req, res) => {
        res.render('new_link', {
            //paso ID instructor
            user: req.params.id,
            //Mensaje predefinido
            message: req.flash('signupMessage')
        });
    }) 
    
    
    /*--------------- VERIFICA SI EXISTE LINK  --------------*/
    //Se busca link_url_id
    
    app.post('/newlink', function(req, res){
        console.log('LINK UPDATE');

        var newLSchema = new LSchema();
        var link_url_id = req.body.link_url_id;
        
        LSchema.findOne({link_url_id: link_url_id}, function(err, link){
            if(err){
                console.log(err);
                }
                if(!link){
                    console.log("no existe")
                }else{
                    console.log("si existe");
                    /*----------- SI EXISTE, SE HAYA EL DOC Y SE ACTUALIZA -------*/
                    newLSchema.link_url_id = req.body.link_url_id;
                    LSchema.findOneAndUpdate({link_url_id: req.body.link_url_id},
                    {
                        $set: {id_inst: req.body.id_inst}
                    },
                    {
                        new: true
                    },
                    function(err, updateTest){
                        if(err){
                            res.send("Error actualizando");
                        }else{
                            res.json(updateTest);
                            }
                        }
                    )
                }
        });
    });
    
    
    /*-------------------- VISTA INSTRUCTOR ---------------------*/
    
    //Usa funcion isLoggedIn para acceder a id, luego lista y busca id_inst = id
    
    app.get('/list', function(req, res, nexxt) {
        var resultArray = [];
        mongo.connect(url, function(err, db){
            assert.equal(null, err);
            var cursor = db.collection('users').find();
            
            
            cursor.forEach(function(doc, err){
                assert.equal(null, err);
                resultArray.push(doc);
                console.log(resultArray);
            }, function(){
                db.close();
                res.render('list', {items: resultArray});
            });
        });
    });
    
    
    /*-------------------- VISTA DE LINKS POR INSTRUCTOR ---------------------*/
    
    //Usa funcion isLoggedIn para acceder a id, luego lista y busca id_inst = id
    
    app.get('/link_inst/:id', function(req, res, nexxt) {
        var resultArray = [];
        mongo.connect(url, function(err, db){
            
            assert.equal(null, err);
            var cursor = db.collection('lschemas').find();
            /*PENDIENTE ENVIAR DATOS A PARTIR DEL ID */
            
            cursor.forEach(function(doc, err){
                assert.equal(null, err);
                resultArray.push(doc);
            }, 
            
            function(){
                db.close();
                console.log("ID INSTRUCTOR" + req.params.id)
                console.log(resultArray)
                res.render('links_instructor', {items: resultArray, id_inst: req.params.id });
            });
        });
    });



    /*------------------------------------------------------------------------*/
    
    /*
    app.post('/new', passport.authenticate('consulta', {
        successRedirect: '/new',
        failureRedirect: '/new',
        failureFlash: true
    }));

    */

}