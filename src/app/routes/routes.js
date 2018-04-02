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
var aSchema = require('../models/accessSchema.js');
var LSchema = require('../models/link.js');
var GroupSchema = require('../models/group.js');
var Categories = require('../models/categories.js');
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
        res.render('login', {
            message: req.flash('loginMessage')
        });
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
            //console.log(jsonData)
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

    /*app.get('/', (req, res) => {
        //res.render('index');
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });*/

    /*------------- LOGIN VIEW ------------------*/
    /*app.get('/login', (req, res) => {
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });*/


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
        
        //Se inicializan en cero para que sean enviadas e identificadas en el front
        
        if(req.user.sa==1){
            res.render('profile', {
            lresult: "0",
            participantes: "0", 
            participantes_totales: "0",
            user:req.user
            
            });
        }else{
        
        LSchema.find({id_inst: req.user.id}).exec((err, Lresult)=>{
        err?console.log(err):
        console.log("SI1", Lresult)
        
        if(Lresult=="")
        {
            console.log("VACIO", Lresult)
            res.render('profile', 
                {
                    lresult: Lresult,
                    participantes: "", 
                    participantes_totales: "",
                    user:req.user
                    
                })
        }else{
        
        //for para iterar los link_url_id pertenecientes a cada consultor
         var arrayResult = []
        
        for(var i=0; i<Lresult.length; i++)
        {
            arrayResult.push(Lresult[i].link_url_id)
        }
        
        
        //TestSchema.find({$or:[{link_url_id: Lresult[0].link_url_id}, {link_url_id: Lresult[1].link_url_id}]})
        TestSchema.find({link_url_id: {$in: arrayResult}})
        
            .limit(5) 
            .sort({time_finished: -1}) //fecha de mayor a menor
            .exec((err, result)=>{
                
        console.log("SI2", result)
        err?console.log("Error retrieving"):
        
        aSchema.find({id_ins: req.user.id}).exec((err,accessresult)=>{
            if(err){console.log("ERROR " ,err)}
            else{
            
                res.render('profile', 
                {
                    lresult: Lresult,
                    participantes: result, 
                    participantes_totales: accessresult,
                    user:req.user
                    
                })
           
              }
            })
          })
        }
        })//LSchema
        }
    })
        
        
        /*
        
        LSchema.find({id_inst: req.user.id}).exec((err, Lresult)=>{
        err?console.log(err):
        TestSchema.find().sort( { time_finished: -1 } ).exec((err, result)=>{
        console.log("SISISI", result)
        err?console.log("Error retrieving"):
        aSchema.find({id_ins: req.user.id}).exec((err,accessresult)=>{
            err?console.log("ERROR " ,err):
            
            res.render('profile', 
            {
                lresult: Lresult,
                participantes: result, 
                participantes_totales: accessresult,
                user:req.user,
                
            })   
            })
        })
        })//LSchema
        
        
        TestSchema.find({}).exec((err, Presult)=>{
        err?console.log(err):
        console.log("CAMILO HOY", Presult)
        res.render('profile', {
            user: req.user
        })
      })*/
    



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
        return  res.redirect('/');
        //Next: Crear View para decir que debe estar autenticado
        //return res.redirect('/');
    }
    
    /*-------------------- LOGIN POST ----------------------*/
    
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true    
    }));

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
        req.user.sa==1?(res.render('signup', { user: req.user, message: req.flash('signupMessage')})):(res.sendStatus(404))
    });

    /* --------------- REGISTRAR PARTICIPANTE -------------*/
    
    app.get('/newpart', isLoggedIn, (req, res) => {
        res.render('new_part', {user: req.user, message: req.flash('signupMessage'), participante: ""});
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


    /*-------------- REGISTRAR PARTICIPANTE POST  ----------------*/

    app.post('/newpart', isLoggedIn, function(req, res){
        console.log('Update participante');

        var newTestSchema = new TestSchema();
        var access_code = req.body.access_code;
        
        TestSchema.findOne({access_code: access_code}, (err, test) => {
            err?console.log(err):newTestSchema.access_code = req.body.access_code;
                    TestSchema.findOneAndUpdate({access_code: req.body.access_code},
                    {
                        $set: {id_inst: req.body.id_inst}
                    },
                    {
                        new: true
                    },
                    (err, updateTest) => {
                        err?res.send("Error actualizando"):res.render('new_part', {user: req.user, participante: updateTest, message: req.flash('signupMessage')})
                        }
                    ) 
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
    //Se busca link_url_id en la colección LSChema (links), si no existe se anuncia, si existe se
    //entra a buscar y actualizar segun el id enviado, se actualiza el campo id_inst con el id de instructor
    //para sincronizar link con instructor
    
    app.post('/newlink', isLoggedIn, (req, res) => {
        
        //accesscode ingresado
        var access_code = req.body.access_code;
        
        //id inst
        var id_ins = req.body.id_inst
        
        var existe
        
        console.log("ttt", access_code, id_ins)
        
        
        aSchema.find({access_code: access_code }).exec((err, existAc) => {
            if(err){console.log(err)}else{
            
        
        if(existAc.length)
        {
            UserSchema.find().exec((err, resultArray) => {
            err?console.log(err):res.render('list', {
                items: resultArray, 
                user:req.user,
                existe: 1,
                access_code: access_code
            })
          })
        }else{
            
            const Save = new aSchema({		
            access_code: access_code,
            id_ins: id_ins
            
        });	
        
        Save.save(function (err, access_code_inserted){		
            console.log("----- access_code_inserted ----- ")		
            err?console.log(err):
            UserSchema.find().exec((err, resultArray) => {
            err?console.log(err):res.render('list', {
                items: resultArray, 
                user:req.user,
                access_code: access_code,
                existe: 2
            })
          })	
        }) 
        
        }  
                
            }//else aSchema
            
         
            
            
        })
        
        
        
    });
    
    
    /*-------------------- VISTA INSTRUCTOR ---------------------*/
    
    //busqueda general de usuarios para despliegue de lista
    app.get('/list', isLoggedIn, (req, res) => {
        UserSchema.find().exec((err, resultArray) => {
            err?console.log(err):res.render('list', {items: resultArray, user:req.user})
        })
    })
    
    
    
    /*-------------------- VISTA DE LINKS POR INSTRUCTOR ---------------------*/
    
    
    app.get('/link_inst/:id', isLoggedIn, (req, res) => {
        if((req.user._id==req.params.id)||(req.user.sa==1))
        {
        
            
        LSchema.find().exec((err, resultArray) => {
            err?console.log(err):
            UserSchema.find({_id: req.params.id}).exec((err, resultUser) => {
                err?console.log(err):
                console.log("COMPROBAR",resultUser)
                res.render('links_instructor', {
                    items: resultArray, 
                    user: req.user, 
                    id_inst: req.params.id, 
                    resultUser: resultUser})
          })
        })
        
        }else{
            (res.sendStatus(404))
        }
    });
    
    
    /*-------------------- VISTA PARTICIPANTES POR INSTRUCTOR ---------------------*/
    
   
    
    app.get('/list_part/', isLoggedIn, (req, res, next) => {
        //Consulta a LSchema para igualar el id de consultor con el actual y obtener el link_url_id 
        //de los links del consultor ya que en schema no se asigna id_consultor
        
        LSchema.find({id_inst: req.user.id}).exec((err, Lresult)=>{
        err?console.log(err):
        TestSchema.find().exec((err, result)=>{
        err?console.log("Error retrieving"):
        aSchema.find({id_ins: req.user.id}).exec((err,accessresult)=>{
            err?console.log("ERROR " ,err):
            
            res.render('list_participantes', 
            {
                lresult: Lresult,
                participantes: result, 
                participantes_totales: accessresult,
                user:req.user,
                
            })  
                
            })
        })
        })//LSchema
    })
    
   
    
    /*----------- codigos sin usar Funcion -----------*/
    
    var cod_sin = function (req, res, next) {

        TestSchema.find().exec((err, allresult) => {
                
                if(err){
                    console.log("Error retrieving");
                }
                else{
                    req.cod_sin = allresult
                    next()
                }
        })
    }
    
    
    /*-------------------- VISTA DE TEST POR LINK ---------------------*/
    //Se hace busqueda en categorias en general, dentro de esta se hace busqueda en Test con el link_url_id
    //igualando al id enviado, se retornan variables de las categorias, del test asociado y val=0 por defecto para posterior busqueda
    
   
    
    app.get('/list_test/:id&:iduser', isLoggedIn, cod_sin, (req, res) => {
        
        var usuario = req.user
        var id_link = req.params.id
        var id_user = req.params.iduser
        var allresult =  req.cod_sin
        
        
        //valida si el usuario actual coincide con la url, con el fin de evitar ver otros usuarios
        
        
        //Variable definida para validar en el front si viene de la ruta list_test
        var list_test = 0;
    
        Categories.find().exec((err, resultCat) => {
            
            if(err){
                console.log("Error retrieving");
        }else{
            TestSchema.find({link_url_id: req.params.id}).exec((err, result) => {
                
            if(err){
                console.log("Error retrieving");
            }
            else{
                
                LSchema.find({ link_url_id: req.params.id }).exec((err,resultLink) => {
                    if(err) console.log("ERROR " ,err)
                    else{
                      
                      LSchema.find({ link_url_id: req.params.id }).exec((err,resultLink) => {
                      if(err) console.log("ERROR " ,err)
                      else{
                        aSchema.find({id_ins: id_user}).exec((err,accessresult)=>{
                            
                        if(err) console.log("ERROR " ,err)
                        else{
                             UserSchema.find({_id: id_user}).exec((err, resultUser)=>{
                            if(err) console.log(err)
                            else{
                        // Cuando long es 0 pasa a la lista
                        // Cuando long es 1 pasa a la busqueda
                        var long=0
                        res.render('list_test_view', {
                            cat: resultCat, 
                            item: result, 
                            allitem: allresult,
                            url: req.params.id, 
                            val: long, 
                            link: resultLink, 
                            aresult: accessresult ,
                            user: usuario,
                            list_test: list_test,
                            resultUser: resultUser,
                            id_user: id_user,
                            id_link: id_link
                          })
                            }
                          })//UserSchema.find({id: resultCat.id_inst})
                         }
                        })//alSchema
                      }//else LSchema
                    })//LSchema
                   
                  }
                })
                
            }});
        }
        });
        
    });
    
    
    /*-----------------  VER INFO FROM ACCESS CODE ----------------------------*/
    app.get('/viewinfo/:access_code', isLoggedIn, (req, res) => {
        
        
        //Capturo access code y id user por GET
        var access_code = req.params.access_code
        var usuario = req.user
        
            TestSchema.find({access_code: access_code}).exec((err, result) => {
            if(err){
                console.log("Error retrieving");
            }
            else{
                // Cuando long es 0 pasa a la lista
                console.log("RESULTADO", result)
                // Cuando long es 1 pasa a la busqueda
                res.render('view_info_ac', {
                    user: usuario,
                    access_code: access_code,
                    result: result
                })
            }});
        
    })
    
    app.get('/question/:id_question&:access_code', isLoggedIn, (req, res)  => {
        
        //Capturo access code y id user por GET
        var access_code = req.params.access_code
        var id_question = req.params.id_question
        var usuario = req.user
        
            TestSchema.find({access_code: access_code}).exec((err, result) => {
            if(err){
                console.log("Error retrieving");
            }
            else{
                // Cuando long es 0 pasa a la lista
                console.log("RESULTADO", result)
                // Cuando long es 1 pasa a la busqueda
                res.render('question', {
                    user: usuario,
                    id_question: id_question,
                    access_code: access_code,
                    result: result
                })
            }});
        
    })
    
    
    /*-------------------    BUSQUEDA POR CATEGORIA  -------------------------*/
    
    app.get('/search/', isLoggedIn, cod_sin, (req, res) => {
        if(req.query.search){
            
            var usuario = req.user
            var allresult =  req.cod_sin
            //console.log(req.query.search)
            
            //Se hace busqueda a partir de la categoria seleccionada en name de categories
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            Categories.find({name: regex}, function(err, allCategories){
                
                if(err){
                    console.log(err);
                }else{
                    //Se hace consulta de todas las categorias para renderizarlas
                    Categories.find().exec((err, resultCat) => {
                    if(err){
                        console.log("Error retrieving");
                    }else{
                    
                    if(req.query.search=="all")
                    {
                        var querySearch = {}
                    }else{
                        var querySearch = {'category_results.name': req.query.search}
                    }
                        
                    TestSchema.find(querySearch).exec((err, result) => {
                        console.log("CONSULTA1", result)
                    if(err){
                        console.log("Error retrieving");
                    }else{
                        var long
                        (result==0)?long=1:long=0
                        
                        LSchema.find({ link_url_id: req.query.id }).exec((err,resultLink) => {
                            if(err) console.log("ERROR " ,err)
                            else{
                                if(usuario.sa==1){//If superAdmin
                                UserSchema.find({id: allCategories.id_inst}).exec((err, resultUser)=>{
                                err?console.log("Error retrieving"):
                                
                                (res.render('list_test_search', {
                                    cat: resultCat, 
                                    allcat: allCategories,
                                    url: req.query.id, 
                                    search: req.query.search,
                                    val: long, 
                                    link: resultLink, 
                                    user: usuario,
                                    result: result,
                                    User: resultUser
                                }
                               ))})
                              }else{
                               UserSchema.find({id: allCategories.id_inst}).exec((err, resultUser)=>{
                                err?console.log("Error retrieving"):
                                
                                (res.render('consultor_search', {
                                    cat: resultCat, 
                                    allcat: allCategories,
                                    url: req.query.id, 
                                    val: long, 
                                    link: resultLink, 
                                    user: usuario,
                                    result: result,
                                    User: resultUser
                                })
                                )})
                              }
                              
                           }
                        })
                       }
                     })//Close TestSchema.find
                    } //Close Categories else
                  })//Close Categories.find()
                }
            })
        }else{
        //Si no hay query enviada retorna todas las categorias
        Categories.find({}, (err, allCategories) => {
            if(err){
                console.log(err);
            }else{
                res.render("list_test_b", {categories: allCategories})
            }
        })}
    })
    
    
    /*-------------------    BUSQUEDA PARA ADMIN  -------------------------*/
    
    app.get('/adminsearch/', isLoggedIn, (req, res) => {
        if(req.query.search){
            //Defino variable de usuario
           var usuario = req.user
            console.log(req.query.id)
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            TestSchema.find({$or:[{access_code: regex}, {id_inst: regex}, {link_url_id: regex}]}, (err, allCategories)=>{
                if(err){
                    console.log(err);
                }else{
                    var long
                    (allCategories==0)?long=1:long=0
                    Categories.find().exec((err, resultCat) => {
                    if(err){
                        console.log("Error retrieving");
                    }else{
                        console.log(req.query.search)
                        LSchema.find().exec((err, resultUser)=>{
                        console.log("AQUIESTE",resultUser)
                        err?console.log("Error retrieving"):(res.render('list_test', {
                            result: allCategories, 
                            val: long, 
                            User: resultUser,
                            user: usuario,
                            cat: resultCat,
                            busqueda: req.query.search,
                            url: ""
                        })) //res.render
                      }) //UserSchema.fin
                    
                    }//else categories
                  })//Categories.find   
                }
            })
        }else{
            (res.sendStatus(404))
        }
    })
    
    
    /*-------------------    BUSQUEDA PARA CONSULTAR ------------------------*/
    
    app.get('/consultor_search/', isLoggedIn, (req, res) => {
        if(req.query.search){
            console.log("LOGG", req.user.id)
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            TestSchema.find({$or:[{access_code: regex}, {link_url_id: regex}]}, (err, allCategories)=>{
                if(err){
                    console.log(err);
                }else{
                    var long
                    (allCategories==0)?long=1:long=0
                    TestSchema.find({id_inst:req.user.id}).exec((err, resultID)=>{
                        if(err){
                            console.log(err)
                        }else{
                            Categories.find().exec((err, resultCat) => {
                            if(err) console.log(err)
                            else{
                                
                                UserSchema.find({id: allCategories.id_inst}).exec((err, resultUser)=>{
                                err?console.log("Error retrieving"):(res.render('consultor_search', {
                                    
                                    cat: resultCat,
                                    result: allCategories, 
                                    val: long, 
                                    User: resultUser, 
                                    user:req.user,
                                    busqueda: req.query.search
                                    
                                    }))
                                  })
                                }
                            })
                        }
                    })
                }
            })
        }else{
            (res.sendStatus(404))
        }
    })
    
    
    
    
    /*------------------------ BUSQUEDA POR FECHA ----------------------------*/
    
    app.get('/date', isLoggedIn, function(req, res){
       
        var url=req.query.id
        
        var date_start_get=req.query.start
        var date_end_get=req.query.end
        
        //Defino usuario globalmente
        var usuario = req.user
        
        //Se suma 86400 para obtener el día completo
        var date_start = ((new Date(date_start_get)/1000)+86400);
        var date_end = ((new Date(date_end_get)/1000)+86400);
        
        //console.log(date_start)
        //console.log(date_end)
        
        var search_date = {time_started:{ $gte: date_start, $lte: date_end }}
        TestSchema.find(search_date).exec(function(err, resultDate){
            if(err){
                console.log("Error retrieving");
                }else{
                    //console.log(req.query.search)
                    //res.render("list_test_b", {categories: allCategories});
                    Categories.find().exec(function(err, resultCat){
                    if(err){
                        console.log("Error retrieving");
                    }else{
                        console.log(resultDate)
                        var long
                        (resultDate==0)?long=1:long=0
                        //Captura de variable query.admin para validar si la busqueda la hace admin
                        //si es admin renderiza admin_search, si no renderiza list_test
                        //Si hace nueva busqueda UserSchema para hayar los datos segun el id del instructor hayado
                        
                        aSchema.find().exec((err,accessresult)=>{
                        if(err) console.log("ERROR " ,err)
                        else{
                            
                        //COMMENT GIt
                        LSchema.find({ link_url_id: req.query.id }).exec((err,resultLink) => {
                            if(err) console.log("ERROR " ,err)
                            else{
                                UserSchema.find({id: resultDate.id_inst}).exec((err, resultUser)=>{
                                    if(err) console.log(err)
                                    else
                                    {
                                        if(usuario.sa==1)
                                        {
                                            res.render('list_test', 
                                            {
                                            cat: resultCat, 
                                            result: resultDate, 
                                            val: long, 
                                            link: resultLink,
                                            user:usuario,
                                            aresult: accessresult,
                                            User: resultUser,
                                            resultUser: resultUser,
                                            date_start: date_start_get,
                                            date_end: date_end_get,
                                            url: url
                                            })
                                            
                                        }else{
                                            res.render('consultor_search', 
                                            {
                                            cat: resultCat, 
                                            result: resultDate, 
                                            val: long, 
                                            link: resultLink,
                                            user:usuario,
                                            aresult: accessresult,
                                            User: resultUser,
                                            resultUser: resultUser,
                                            date_start: date_start_get,
                                            date_end: date_end_get,
                                            url: url
                                            })
                                        }
                                    }//else
                             })//UserSchema
                           }
                         })//Close LSchema
                        }
                      })//aSchema.find(    
                    }
                     //Close TestSchema.find
                     //Close Categories else
                  })//Close Categories.find()
                }
        })//Close TestSchema.find(search_date)
        
    })
    
    
    
    /*-------------------------- VER CATEGORIAS ------------------------------*/
    
    app.get('/categories', isLoggedIn, (req, res) => {
        Categories.find().exec((err, result) => {
            err?console.log("Error retrieving"):console.log(result); res.render('categorias', {categorias: result, user: req.user})
        })
    })
    
    
    
    /*------------------------SEARCH FUNCIONALIDAD ---------------------------*/
    
    function escapeRegex(text){
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };
    /*------------------------------------------------------------------------*/
    
    /*
    app.post('/new', passport.authenticate('consulta', {
        successRedirect: '/new',
        failureRedirect: '/new',
        failureFlash: true
    }));

    */
    
    // function Consultas(req, res, next) {

    //     var id = req.query.id
        
    //     Categories.find().exec(function(err, resultCat){
    //         if(err){
    //             console.log("Error retrieving");
    //     }else{
    //         res.render('list_test', {cat: resultCat, item: resultCat, url: req.params.id})
    //         }
    //     });
        
    // }
}