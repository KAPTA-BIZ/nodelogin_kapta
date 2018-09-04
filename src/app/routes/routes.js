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
const API_Test = require('../models/API_Test');
var Assignments = require('../models/Assignments');
var Codes = require('../models/Codes');


mongoose.Promise = global.Promise;

const { url } = require('../../config/database');

var forge = require('node-forge');

module.exports = (app, passport) => {



    /*------------------------- JOIN PROJECT START----------------------------*/

    app.get('/', (req, res, next) => {
        /*res.render('signup',{
            message: "",
            user: {sa:1}
        });*/
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });

    /*------------CONEXION WEBHOOK START------------*/

    app.use(bodyParser.json())

    app.post('/', (req, res) => {
        var jsonData = req.body;
        var secret = 'Yu92voJl59q4Bwp';
        var verified = crypto.createHmac('sha256', secret).update('X-Classmarker-Hmac-Sha256').digest('hex');

        if (verified) {
            //Guardar test Web Hook
            storageTestWh(jsonData);
            //console.log(jsonData)
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    });

    /*------------CONEXION WEBHOOK END------------*/


    app.get('/dashboard', (req, res) => {
        res.send('Dashboard');
    });


    const buildOptions = async (req, res) => {
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


    app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));

    app.use('/graphiql', graphiqlExpress({
        endpointURL: '/graphql',
        passHeader: ` 'Authorization': 'bearer token-camilo.arguello@kapta.biz' `
    }));


    app.get('/get_all_available', (req, res) => {
        request(get_all_available, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                var cleanBody = JSON.parse(body);
                //console.log(cleanBody);
                res.json(cleanBody);
                //storageLinkTest(cleanBody)
            }
            return console.log(error);
        });
    });


    app.get('/get_links', function (req, res) {
        request(get_links, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var cleanBody = JSON.parse(body);
                res.json(cleanBody.links);
            }
            return console.log(error);
        });
    });

    app.get('/get_groups', function (req, res) {
        request(get_groups, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var cleanBody = JSON.parse(body);
                res.json(cleanBody);
            }
            return console.log(error);
        });
    });

    /* ----------------  REGISTER NEW USER ONLY SUPER ADMIN --------------*/
    //Autentica a SuperAdmin comprobando que req.user.sa exista
    app.get('/signup', isLoggedIn, (req, res) => {
        req.user.sa >= 1 ? (res.render('signup', { user: req.user, message: req.flash('signupMessage') })) : (res.sendStatus(404))
    });


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
        switch (req.user.sa) {
            case '1':
                API_Test.find({}, null, { sort: { test_name: 1 } }, (err, results) => {
                    if (err) {
                        console.log(err);
                    }
                    res.render('profile',
                        {
                            Tests: results,
                            participantes: "0", ///---->pendiente ppor verificar
                            user: req.user
                        });
                })
                break;

            case '2':
                res.render('profile',
                    {
                        user: req.user
                    });
                break;

            case '0':
                res.render('profile', {
                    user: req.user,
                    participantes: ''
                })
                break;

            default:
                console.log('emmm');
                console.log(req.user.sa);
        }

        /*
        
                req.user.sa==1?
                    res.render('profile', 
                    {
                    lresult: "0",
                    participantes: "0", 
                    participantes_totales: "0",
                    user:req.user
                    })
                    
                ://else
                //Si no, es consultor
                
                LSchema.find({id_inst: req.user.id}).exec((err, Lresult)=>{
                err?console.log(err):
                
                //Si no hay resultados
                Lresult==""?
                
                
                res.render('profile', 
                    {
                    lresult: Lresult,
                    participantes: "", 
                    participantes_totales: "",
                    user:req.user
                    })
                        
                ://else
                //Si se encuentran resultados no nulos en la consulta a la coleccion de Links (LSchema) 
                
                console.log(Lresult)
                
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
                    err?console.log(err):
                    
                        res.render('profile', 
                        {
                            lresult: Lresult,
                            participantes: result, 
                            participantes_totales: accessresult,
                            user:req.user
                            
                        })
                    })//aSchema.find({id_ins: req.user.id})
                  })//TestSchema.find({link_url_id: {$in: arrayResult}})
                })//LSchema
        */
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




    /*------------------- VIEW STADISTICS ------------------*/
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
        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/');
        //Next: Crear View para decir que debe estar autenticado
        //return res.redirect('/');
    }

    /*-------------------- LOGIN POST ----------------------*/

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true
    }));

    /* ------- FUNCION PARA ENCONTRAR INSCRITOfS --------*/

    function lista(req, res, next) {

        var id = req.user.id;
        //nuevo objeto clase test, para buscar test asociados
        var newTestSchema = new TestSchema();

        //busqueda de test asociados con id_inst=id
        TestSchema.find({ id_inst: id }, function (err, test) {
            if (err) {
                console.log(err);
            }
            if (!test) {
                console.log("no hay inscritos")
                return next();
            } else {
                //esto se muestra
                res.json(test);
                //res.render('list')
            }
        });
    }




    /* --------------- REGISTRAR PARTICIPANTE -------------*/

    app.get('/newpart', isLoggedIn, (req, res) => {
        res.render('new_part', { user: req.user, message: req.flash('signupMessage'), participante: "" });
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

    app.post('/newpart', isLoggedIn, function (req, res) {
        console.log('Update participante');

        var newTestSchema = new TestSchema();
        var access_code = req.body.access_code;

        TestSchema.findOne({ access_code: access_code }, (err, test) => {
            err ? console.log(err) : newTestSchema.access_code = req.body.access_code;
            TestSchema.findOneAndUpdate({ access_code: req.body.access_code },
                {
                    $set: { id_inst: req.body.id_inst }
                },
                {
                    new: true
                },
                (err, updateTest) => {
                    err ? res.send("Error actualizando") : res.render('new_part', { user: req.user, participante: updateTest, message: req.flash('signupMessage') })
                }
            )
        });
    });

    /*-------------- Assign new test (consult users)--------------*/
    app.get('/setnewtest_cons/:cons_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.cons_id, null, (err, consulant) => {
            if (err) { throw err }
            Assignments.find({ $and: [{ 'admin_email': req.user.local.email }, { 'users.email': { $ne: consulant.local.email } }] }, null, { sort: { 'test_name': 1 } }, (err, tests) => {
                if (err) { throw err }
                res.render('set_new_test_cons', {
                    consultant: consulant,
                    admin: req.user,
                    Tests: tests
                })
            });
        });

    })

    app.post('/setnewtest_cons', isLoggedIn, (req, res) => {
        if (req.body.testlist != -1) {
            Assignments.findByIdAndUpdate(req.body.testlist, {
                $push: {
                    'users': {
                        email: req.body.consultant_email,
                        codes_max: req.body.maxcodes,
                        codes_created: 0,
                        codes_used: 0,
                        created_by: req.body.admin_email
                    }
                }, $inc: { 'codes_availables': -req.body.maxcodes }
            }, (err, doc) => {
                if (err) { throw err }
                UserSchema.find({ 'admin_email': req.user.local.email }, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
                    if (err) { throw err; }
                    res.render('list', { items: resultArray, user: req.user });
                });
            });
        }
    })


    /*-------------- Assign new test (admin users)--------------*/
    app.get('/setnewtest/:id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.id, 'local.email', (err, admin) => {
            if (err) { throw err }
            Assignments.find({ 'admin_email': admin.local.email }, 'test_id', (err, results) => {
                if (err) { throw err }
                var exceptions = [];
                if (results.length > 0) {
                    results.forEach(function (item) {
                        exceptions.push(item.test_id);
                    });
                }
                API_Test.find({ 'test_id': { $nin: exceptions } }, null, { sort: { test_name: 1 } }, (err, tests) => {
                    if (err) { throw err }
                    res.render('set_new_test', {
                        admin: { id: req.params.id, email: admin.local.email },
                        Tests: tests,
                    });
                });
            });
        });
    })

    app.get('/setnewtest_updated/:id', isLoggedIn, (req, res) => {
        var testsArray = new Array;
        request(get_all_available, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                var cleanBody = JSON.parse(body);
                var LinksNumber = cleanBody['links'].length;
                if (LinksNumber > 0) {
                    var newTest = new Object;
                    newTest.test_id = cleanBody['links'][0]['link']['assigned_tests'][0]['test']['test_id'];
                    newTest.test_name = cleanBody['links'][0]['link']['assigned_tests'][0]['test']['test_name'];

                    var newLink = new Object;
                    newLink.link_name = cleanBody['links'][0]['link']['link_name'];
                    newLink.link_url_id = cleanBody['links'][0]['link']['link_url_id'];
                    newLink.link_id = cleanBody['links'][0]['link']['link_id'];
                    newLink.access_list_id = cleanBody['links'][0]['link']['access_list_id'];
                    newTest.links = [newLink];
                    testsArray.push(newTest);

                    for (var j = 1; j < LinksNumber; j++) {
                        var testFromJson = cleanBody['links'][j]['link']['assigned_tests'][0]['test']['test_id'];
                        for (var i = 0; i < testsArray.length; i++) {
                            if (testsArray[i].test_id == testFromJson) {
                                var newLink = new Object;
                                newLink.link_name = cleanBody['links'][j]['link']['link_name'];
                                newLink.link_url_id = cleanBody['links'][j]['link']['link_url_id'];
                                newLink.link_id = cleanBody['links'][j]['link']['link_id'];
                                newLink.access_list_id = cleanBody['links'][j]['link']['access_list_id'];
                                testsArray[i].links.push(newLink);
                                i = testsArray.lengt;
                            } else if (i == testsArray.length - 1) {
                                var newTest = new Object;
                                newTest.test_id = testFromJson;
                                newTest.test_name = cleanBody['links'][j]['link']['assigned_tests'][0]['test']['test_name'];
                                var newLink = new Object;
                                newLink.link_name = cleanBody['links'][j]['link']['link_name'];
                                newLink.link_url_id = cleanBody['links'][j]['link']['link_url_id'];
                                newLink.link_id = cleanBody['links'][j]['link']['link_id'];
                                newLink.access_list_id = cleanBody['links'][j]['link']['access_list_id'];
                                newTest.links = [newLink];
                                testsArray.push(newTest);
                                i = testsArray.lengt;
                            }
                        }
                    }

                }

                API_Test.remove({}, (err) => {
                    if (!err) { }
                    updateTests(0, testsArray.length);
                })
            } else {
                //->se debe manejar este error (no se pudo actualizar)
                console.log(error);
            }

        });

        function updateTests(i, imax) {
            if (i < imax) {

                var newAPI_Test = new API_Test({
                    test_id: testsArray[i].test_id,
                    test_name: testsArray[i].test_name,
                    links: testsArray[i].links
                });

                newAPI_Test.save((err) => {
                    if (err) console.log(err);
                    //--->se debe manejar este error al guardar datos
                    updateTests(i + 1, imax)
                })

            } else {
                UserSchema.findById(req.params.id, 'local.email', (err, admin) => {
                    if (err) { throw err }
                    Assignments.find({ 'admin_email': admin.local.email }, 'test_id', (err, results) => {
                        if (err) { throw err }
                        var exceptions = [];
                        if (results.length > 0) {
                            results.forEach(function (item) {
                                exceptions.push(item.test_id);
                            });
                        }
                        API_Test.find({ 'test_id': { $nin: exceptions } }, null, { sort: { test_name: 1 } }, (err, tests) => {
                            if (err) { throw err }
                            res.render('set_new_test', {
                                admin: { id: req.params.id, email: admin.local.email },
                                Tests: tests,
                                message: 2
                            });
                        });
                    });
                });
            }
        }
    })

    app.post('/setnewtest', isLoggedIn, (req, res) => {
        if (req.body.linklist == -1) {
            UserSchema.findOne({ 'local.email': req.body.admin_email }, '_id', (err, admin) => {
                if (err) { throw err }
                Assignments.find({ 'admin_email': req.body.admin_email }, 'test_id', (err, results) => {
                    if (err) { throw err }
                    var exceptions = [];
                    if (results.length > 0) {
                        results.forEach(function (item) {
                            exceptions.push(item.test_id);
                        });
                    }
                    API_Test.find({ 'test_id': { $nin: exceptions } }, null, { sort: { test_name: 1 } }, (err, tests) => {
                        if (err) { throw err }
                        res.render('set_new_test', {
                            admin: { id: admin._id, email: req.body.admin_email },
                            Tests: tests,
                            message: 1
                        });
                    });
                });
            });
        } else {
            var newAssignment = new Assignments();
            newAssignment.test_id = req.body.test_id;
            newAssignment.test_name = req.body.test_name;
            newAssignment.link_name = req.body.link_name;
            newAssignment.link_id = req.body.link_id;
            newAssignment.link_url_id = req.body.link_url_id;
            newAssignment.access_list_id = req.body.access_list_id;
            newAssignment.admin_email = req.body.admin_email;
            newAssignment.codes_max = req.body.MaxCodes;
            newAssignment.codes_created = 0;
            newAssignment.codes_used = 0;
            newAssignment.codes_availables = req.body.MaxCodes;
            newAssignment.save(function (err) {
                if (err) { console.log(err); }

                UserSchema.find({}, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
                    err ? console.log(err) : res.render('list', {
                        items: resultArray,
                        user: req.user,
                    })
                })
            });
        }
    })

    /*---------------- Generar codigos -------------*/
    app.post('/generate_new_code', isLoggedIn, (req, res) => {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        generate_code(0, req.body.GenerateCodes);

        function generate_code(i, number) {
            if (i < number) {
                var new_code = '';
                for (var j = 0; j < 4; j++) {
                    new_code += chars[Math.floor(Math.random() * chars.length)];
                }
                check_code(i, number, new_code);
            } else {
                Assignments.findOneAndUpdate({ '_id': req.body.assignment_id, 'users.email': req.user.local.email }, {
                    $inc: { 'users.$.codes_created': number }
                }, { new: true }, (err, assignment) => {
                    if (err) { throw err; }
                    res.redirect('/test_view/'+req.body.assignment_id)

                })
            }
        }

        function check_code(i, number, new_code) {
            Codes.findOne({ 'code': new_code }, null, (err, result) => {
                if (err) { throw err }
                if (result) {
                    generate_code(i, number);
                } else {
                    request.post({
                        headers: { 'Content-type': 'application/json; charset=utf-8' },
                        url: require('../../classmarker/addCode')(req.body.access_list_id),
                        body: JSON.stringify([new_code])
                    }, (err, res, body) => {
                        if (err) { throw err }
                        var cleanBody = JSON.parse(body);
                        if (cleanBody.status != 'ok' || cleanBody.access_lists.access_list.num_codes_added == 0) {
                            generate_code(i, number);
                        } else {
                            var new_code_schema = new Codes();
                            new_code_schema.code = new_code;
                            new_code_schema.used = 0;
                            new_code_schema.assignment_id = req.body.assignment_id;
                            new_code_schema.user_email = req.user.local.email;
                            new_code_schema.save(function (err) {
                                if (err) { throw err }
                                generate_code(i + 1, number);
                            })
                        }
                    });
                }
            });
        }

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

        aSchema.find({ access_code: access_code }).exec((err, existAc) => {
            if (err) { console.log(err) }

            else {
                if (existAc.length) {
                    UserSchema.find().exec((err, resultArray) => {
                        err ? console.log(err) : res.render('list', {
                            items: resultArray,
                            user: req.user,
                            existe: 1,
                            access_code: access_code
                        })
                    })
                } else {
                    const Save = new aSchema({
                        access_code: access_code,
                        id_ins: id_ins
                    });

                    Save.save(function (err, access_code_inserted) {
                        console.log("----- access_code_inserted ----- ")
                        err ? console.log(err) :
                            UserSchema.find().exec((err, resultArray) => {
                                err ? console.log(err) : res.render('list', {
                                    items: resultArray,
                                    user: req.user,
                                    access_code: access_code,
                                    existe: 2
                                })
                            })
                    })

                }
            }

        })
    });

    //busqueda total de usuarios (solo superadmin)
    app.get('/users_list', isLoggedIn, (req, res) => {
        UserSchema.find({}, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
            err ? console.log(err) : res.render('list', { items: resultArray, user: req.user })
        });
    })

    //busqueda  usuarios asociados a un administrador (solo admin)
    app.get('/users_list/:id', isLoggedIn, (req, res) => {
        UserSchema.find({ 'admin_email': req.user.local.email }, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
            if (err) { throw err; }
            res.render('list', { items: resultArray, user: req.user });
        });
    })

    /*-------------------- Vista de pruebas asignadas---------------------*/
    app.get('/tests_list', isLoggedIn, (req, res) => {
        if (req.user.sa == 2) {
            Assignments.find({ 'admin_email': req.user.local.email }, null, { sort: { 'test_name': 1 } }, (err, resultArray) => {
                if (err) { throw err; }
                res.render('tests_list', {
                    user: req.user,
                    items: resultArray
                });
            });
        } else if (req.user.sa == 0) {
            Assignments.find({ 'users.email': req.user.local.email }, null, { sort: { 'test_name': 1 } }, (err, resultArray) => {
                if (err) { throw err; }
                res.render('tests_list', {
                    user: req.user,
                    items: resultArray
                });
            });

            /*var assignedTests = [];
            req.user.assignments.forEach(function (item) {
                assignedTests.push(item.assignment_id);
            });
            Assignments.find({ _id: { $in: assignedTests } }, null, { sort: { 'test_name': 1 } }, (err, resultArray) => {
                if (err) { throw err; }
                res.render('tests_list', {
                    user: req.user,
                    items: resultArray
                })
            });*/
        }
    });



    /*-------------------VISTA DE PRUEBAS-------------------------------------------*/
    app.get('/test_view/:assig_id', isLoggedIn, (req, res) => {
        Assignments.findById(req.params.assig_id, null, (err, assignment) => {
            if (err) { throw err; }
            if (req.user.sa == 0) {
                var user_temp;
                assignment.users.forEach(function (consultant) {
                    if (consultant.email == req.user.local.email) {
                        user_temp = consultant;
                    }
                });
                assignment.users = user_temp;

            }
            Codes.find({ $and: [{ 'assignment_id': req.params.assig_id }, { 'user_email': req.user.local.email }, { 'used': '0' }] }, null,{sort:{'code':1}}, (err, codesArray) => {
                if (err) { throw err; }
                res.render('test_view', {
                    user: req.user,
                    assignment: assignment,
                    codesArray: codesArray
                });
            })
        });
    });


    /*-------------------- VISTA PARTICIPANTES POR INSTRUCTOR ---------------------*/


    app.get('/list_part/', isLoggedIn, (req, res, next) => {
        //Consulta a LSchema para igualar el id de consultor con el actual y obtener el link_url_id 
        //de los links del consultor ya que en schema no se asigna id_consultor

        LSchema.find({ id_inst: req.user.id }).exec((err, Lresult) => {
            console.log("1BUSQUEDA", Lresult)
            err ? console.log(err) :
                TestSchema.find().exec((err, result) => {
                    //console.log("2BUSQUEDA", result)
                    err ? console.log("Error retrieving") :
                        aSchema.find({ id_ins: req.user.id }).exec((err, accessresult) => {
                            //console.log("3BUSQUEDA", accessresult)
                            err ? console.log("ERROR ", err) :

                                res.render('list_participantes',
                                    {
                                        lresult: Lresult,
                                        participantes: result,
                                        participantes_totales: accessresult,
                                        user: req.user,

                                    })

                        })
                })
        })//LSchema
    })



    /*----------- codigos sin usar Funcion -----------*/

    var cod_sin = function (req, res, next) {

        TestSchema.find().exec((err, allresult) => {

            if (err) {
                console.log("Error retrieving");
            }
            else {
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
        var allresult = req.cod_sin

        //valida si el usuario actual coincide con la url, con el fin de evitar ver otros usuarios


        //Variable definida para validar en el front si viene de la ruta list_test
        var list_test = 0;

        Categories.find().exec((err, resultCat) => {
            err ? console.log(err) :

                TestSchema.find({ link_url_id: req.params.id }).sort({ time_finished: -1 }).exec((err, result) => {
                    err ? console.log(err) : console.log("")

                    LSchema.find({ link_url_id: req.params.id }).exec((err, resultLink) => {
                        err ? console.log(err) :


                            aSchema.find({ id_ins: id_user }).exec((err, accessresult) => {

                                err ? console.log(err) :

                                    UserSchema.find({ _id: id_user }).exec((err, resultUser) => {
                                        err ? console.log(err) : console.log(resultUser)


                                        TestSchema.find().exec((err, allResult) => {
                                            err ? console.log(err) : console.log("")

                                            // Cuando long es 0 pasa a la lista
                                            // Cuando long es 1 pasa a la busqueda
                                            var long = 0
                                            res.render('list_test_view', {
                                                cat: resultCat,
                                                item: result,
                                                allitem: allresult,
                                                url: req.params.id,
                                                val: long,
                                                link: resultLink,
                                                aresult: accessresult,
                                                user: usuario,
                                                list_test: list_test,
                                                resultUser: resultUser,
                                                id_user: id_user,
                                                id_link: id_link,
                                                allResult: allResult
                                            })

                                        })

                                    })//UserSchema.find({id: resultCat.id_inst})

                            })//alSchema


                    })//LSchema.find({ link_url_id: req.params.id })

                })//TestSchema.find({link_url_id: req.params.id})

        })//Categories.find()

    })


    /*-----------------  VER INFO FROM ACCESS CODE ----------------------------*/
    app.get('/viewinfo/:access_code', isLoggedIn, (req, res) => {


        //Capturo access code y id user por GET
        var access_code = req.params.access_code
        var usuario = req.user

        var aux;
        console.log("ACCESSRECIBIDO", req.params.access_code)

        if (req.user.sa == 1) { var aschemaquery = { id_ins: usuario._id } } else { aschemaquery = {} }
        aSchema.find().exec((err, resultAc) => {
            err ? console.log(err) :

                //console.log("usuario", resultAc)

                TestSchema.find({ access_code: access_code }).exec((err, result) => {
                    console.log("resultA", result)
                    err ? console.log(err) : console.log("")

                    if (result == "") {
                        aux = {}
                    } else {
                        aux = { link_url_id: result[0].link_url_id }
                    }

                    console.log("AUXILIAR", aux)

                    //console.log("link de access", result[0].link_url_id)

                    //Obtengo link_url_id con result[0].link_url_id
                    //usuarios con mismo link_url_id


                    TestSchema.find().exec((err, resultLinkUrlId) => {

                        err ? console.log(err) :


                            TestSchema.find().exec((err, allResult) => {
                                err ? console.log(err) :

                                    // Cuando long es 0 pasa a la lista
                                    //console.log(result)
                                    // Cuando long es 1 pasa a la busqueda
                                    res.render('view_info_ac', {
                                        user: usuario,
                                        access_code: access_code,
                                        result: result,
                                        resultAc: resultAc,
                                        allResult: allResult
                                    })
                            })

                    })
                })
        })
    })

    app.get('/question/:id_question&:access_code', isLoggedIn, (req, res) => {

        //Capturo access code y id user por GET
        var access_code = req.params.access_code
        var id_question = req.params.id_question
        var usuario = req.user

        TestSchema.find({ access_code: access_code }).exec((err, result) => {
            err ? console.log(err) :

                // Cuando long es 0 pasa a la lista
                console.log(result)
            // Cuando long es 1 pasa a la busqueda
            res.render('question', {
                user: usuario,
                id_question: id_question,
                access_code: access_code,
                result: result
            })
        });
    })


    /*-------------------    BUSQUEDA POR CATEGORIA  -------------------------*/

    app.get('/search/', isLoggedIn, cod_sin, (req, res) => {
        if (req.query.search) {

            // Se recibe el id del instructor, req.query.id
            var usuario = req.user
            var allresult = req.cod_sin

            //Se hace busqueda a partir de la categoria seleccionada en name de categories
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            Categories.find({ name: regex }, function (err, allCategories) {
                err ? console.log(err) :

                    //Se hace consulta de todas las categorias para renderizarlas
                    Categories.find().exec((err, resultCat) => {
                        err ? console.log(err) : console.log(resultCat)

                        //se declara querysearch para saber si se recibe la palabra all y mostrar todas las categorias
                        var querySearch
                        (req.query.search == "all") ? querySearch = {} : querySearch = { 'category_results.name': req.query.search }

                        TestSchema.find()
                            .and([
                                { 'category_results.name': req.query.search },
                                { link_url_id: req.query.id }
                            ])
                            .sort({ time_finished: -1 })
                            .exec((err, result) => {

                                err ? console.log(err) : console.log(result)

                                var long
                                (result == 0) ? long = 1 : long = 0

                                LSchema.find({ link_url_id: req.query.id }).exec((err, resultLink) => {
                                    err ? console.log(err) : console.log(resultLink)


                                    /*---------------------------------------------------------------------------*/
                                    /*var arrayResult = []
                    
                                    for (var i = 0; i < Lresult.length; i++) 
                                    {
                                    arrayResult.push(Lresult[i].link_url_id)
                                    }
                                                    
                                    TestSchema.find({link_url_id: {$in: arrayResult}})
                                        .sort({time_finished: -1}) //fecha de mayor a menor
                                        .exec((err, ByLinkresult) => {
                                                
                                    err ? console.log(err):console.log(ByLinkresult)
                                        
                                    var date_query
                                
                                    if(req.query.id==req.user.id)
                                    {
                                        if(!date_start)
                                    {
                                    date_query=
                                        [{'category_results.name': req.query.search},
                                        {link_url_id: {$in: arrayResult}}]
                                    }else{
                                        date_query=
                                        [{'category_results.name': req.query.search},
                                        {link_url_id: arrayResult},
                                        {time_started:{ $gte: date_start, $lte: date_end}}]
                                    }
                                    
                                    }else{
                                    
                                    if(!date_start)
                                    {
                                        date_query=
                                            [{'category_results.name': req.query.search},
                                            {link_url_id: req.query.id}]
                                    }else{
                                        date_query=
                                            [{'category_results.name': req.query.search},
                                            {link_url_id: req.query.id},
                                            {time_started:{ $gte: date_start, $lte: date_end}}]
                                        }
                                    }
                                
                                  
                                     //Query in test from: query.search (category), req.query.id(id link), betwen dates
                                    TestSchema.find()
                                    .and(
                                        date_query
                                    )
                                    .sort({time_finished: -1})
                                    .exec((err, result) => {
                                        
                                    err?console.log(err):*/

                                    /*---------------------------------------------------------------------------*/


                                    //Condicion para saber si es supeAdmin o consultor, sa=1 Admin, sa=0 consultor
                                    usuario.sa == 1 ?

                                        UserSchema.find({ id: allCategories.id_inst }).exec((err, resultUser) => {
                                            err ? console.log("Error retrieving") :

                                                (res.render('list_test_search',
                                                    {
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
                                                ))

                                        })//UserSchema.find({id: allCategories.id_inst})

                                        : //else usuario.sa==1?

                                        UserSchema.find({ id: allCategories.id_inst }).exec((err, resultUser) => {
                                            err ? console.log("Error retrieving") :

                                                LSchema.find({ id_inst: req.user.id }).exec((err, Lresult) => {
                                                    err ? console.log(err) : console.log("Lresult", Lresult)

                                                    var arrayResult = []

                                                    for (var i = 0; i < Lresult.length; i++) {
                                                        arrayResult.push(Lresult[i].link_url_id)
                                                    }

                                                    TestSchema.find({ link_url_id: { $in: arrayResult } })
                                                        .sort({ time_finished: -1 }) //fecha de mayor a menor
                                                        .exec((err, ByLinkresult) => {

                                                            err ? console.log(err) :

                                                                (res.render('consultor_search',
                                                                    {
                                                                        cat: resultCat,
                                                                        allcat: allCategories,
                                                                        url: req.query.id,
                                                                        val: long,
                                                                        link: resultLink,
                                                                        user: usuario,
                                                                        result: result,
                                                                        ByLinkresult: ByLinkresult,
                                                                        User: resultUser,
                                                                        lresult: Lresult

                                                                    }))

                                                        })//TestSchema.find({link_url_id: {$in: arrayResult}})

                                                })//LSchema.find({id_inst: req.user.id})

                                        })//UserSchema.find({id: allCategories.id_inst})

                                }) //LSchema.find({ link_url_id: req.query.id })

                            })//Close TestSchema.find
                    })//Close Categories.find()

            })

        }

        else {
            //Si no hay query enviada retorna todas las categorias
            Categories.find({}, (err, allCategories) => {
                err ? console.log(err) : res.render("list_test_b", { categories: allCategories })
            })
        }
    })


    /*-------------- Busqueda por categorias desde enlace  -------------------------*/

    app.get('/searchandlink/', isLoggedIn, cod_sin, (req, res) => {

        if (req.query.search) {

            var busqueda_get = req.query.busqueda_get

            //Get id consultor, req.query.id
            var usuario = req.user
            var allresult = req.cod_sin

            //Get dates
            var date_start_get = req.query.start
            var date_end_get = req.query.end

            //dates are converted to universal format
            var date_start = ((new Date(date_start_get) / 1000) + 86400);
            var date_end = ((new Date(date_end_get) / 1000) + 86400);

            //query is mdae from choosen category
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            Categories.find({ name: regex }, function (err, allCategories) {
                err ? console.log(err) :

                    //make a query with every categories to show them
                    Categories.find().exec((err, resultCat) => {
                        err ? console.log(err) : console.log(resultCat)

                        //querysearch is declared to know if get the word "all" and show all categories
                        var querySearch
                        (req.query.search == "all") ? querySearch = {} : querySearch = { 'category_results.name': req.query.search }

                        //Query in links is made from id consultor
                        LSchema.find({ link_url_id: req.query.id }).exec((err, resultLink) => {
                            err ? console.log(err) : console.log(resultLink)

                            UserSchema.find({ id: allCategories.id_inst }).exec((err, resultUser) => {
                                err ? console.log("Error retrieving") :

                                    LSchema.find({ id_inst: req.user.id }).exec((err, Lresult) => {
                                        err ? console.log(err) : console.log("Lresult", Lresult)

                                        var arrayResult = []

                                        for (var i = 0; i < Lresult.length; i++) {
                                            arrayResult.push(Lresult[i].link_url_id)
                                        }

                                        TestSchema.find({ link_url_id: { $in: arrayResult } })
                                            .sort({ time_finished: -1 }) //fecha de mayor a menor
                                            .exec((err, ByLinkresult) => {

                                                err ? console.log(err) : console.log(ByLinkresult)

                                                var date_query

                                                if (req.query.id == req.user.id) {
                                                    if (!date_start) {
                                                        date_query =
                                                            [{ 'category_results.name': req.query.search },
                                                            { link_url_id: { $in: arrayResult } }]
                                                    } else {
                                                        date_query =
                                                            [{ 'category_results.name': req.query.search },
                                                            { link_url_id: arrayResult },
                                                            { time_started: { $gte: date_start, $lte: date_end } }]
                                                    }
                                                } else {

                                                    if (!date_start) {
                                                        date_query =
                                                            [{ 'category_results.name': req.query.search },
                                                            { link_url_id: req.query.id }]
                                                    } else {
                                                        date_query =
                                                            [{ 'category_results.name': req.query.search },
                                                            { link_url_id: req.query.id },
                                                            { time_started: { $gte: date_start, $lte: date_end } }]
                                                    }

                                                }


                                                //Query in test from: query.search (category), req.query.id(id link), betwen dates
                                                TestSchema.find()
                                                    .and(
                                                        date_query
                                                    )
                                                    .sort({ time_finished: -1 })
                                                    .exec((err, result) => {

                                                        err ? console.log(err) :

                                                            (res.render('searchandlink',
                                                                {
                                                                    cat: resultCat,
                                                                    allcat: allCategories,
                                                                    url: req.query.id,
                                                                    cat_search: req.query.search,
                                                                    link: resultLink,
                                                                    user: usuario,
                                                                    result: result,
                                                                    date_start: req.query.start,
                                                                    date_end: req.query.end,
                                                                    ByLinkresult: ByLinkresult,
                                                                    User: resultUser,
                                                                    lresult: Lresult,
                                                                    busqueda_get: busqueda_get

                                                                }))

                                                    })//TestSchema.find({link_url_id: {$in: arrayResult}})

                                            })//LSchema.find({id_inst: req.user.id})

                                    })//UserSchema.find({id: allCategories.id_inst})

                            }) //LSchema.find({ link_url_id: req.query.id })

                        })//Close TestSchema.find

                    })//Close Categories.find()

            })
        }
    })




    /*-------------------    BUSQUEDA PARA ADMIN  -------------------------*/

    app.get('/adminsearch/', isLoggedIn, (req, res) => {
        if (req.query.search) {
            //Defino variable de usuario
            var usuario = req.user

            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            TestSchema.find({ $or: [{ access_code: regex }, { id_inst: regex }, { link_url_id: regex }] }).sort({ time_finished: -1 }).exec((err, allCategories) => {
                err ? console.log(err) : console.log(allCategories)

                var long
                (allCategories == 0) ? long = 1 : long = 0
                Categories.find().exec((err, resultCat) => {

                    err ? console.log("Error retrieving") :

                        LSchema.find().exec((err, resultUser) => {
                            err ? console.log("Error retrieving") :

                                (res.render('list_test', {
                                    result: allCategories,
                                    val: long,
                                    User: resultUser,
                                    user: usuario,
                                    cat: resultCat,
                                    busqueda: req.query.search,
                                    url: ""

                                })) //res.render

                        }) //UserSchema.fin

                })//Categories.find   

            })//TestSchema.find({$or:[{access_code: regex}

        } else {
            (res.sendStatus(404))
        }
    })



    /*-------------- ADMIN Busqueda por categorias desde enlace  -------------------------*/

    app.get('/adminsearchandlink/', isLoggedIn, cod_sin, (req, res) => {

        if (req.query.search) {

            var busqueda_get = req.query.busqueda_get

            //Get id consultor, req.query.id
            var usuario = req.user
            var allresult = req.cod_sin

            //Get dates
            var date_start_get = req.query.start
            var date_end_get = req.query.end

            //dates are converted to universal format
            var date_start = ((new Date(date_start_get) / 1000) + 86400);
            var date_end = ((new Date(date_end_get) / 1000) + 86400);

            //query is mdae from choosen category
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            Categories.find({ name: regex }, function (err, allCategories) {
                console.log("CATEGORIA SELECCIONADA: ", allCategories)
                err ? console.log(err) :


                    console.log("fecha inicio: ", date_start_get)
                console.log("fecha final: ", date_end_get)

                //make a query with every categories to show them
                Categories.find().exec((err, resultCat) => {
                    err ? console.log(err) : console.log("resultCat")

                    //querysearch is declared to know if get the word "all" and show all categories
                    var querySearch
                    (req.query.search == "all") ? querySearch = {} : querySearch = { 'category_results.name': req.query.search }

                    //Query in links is made from id consultor
                    LSchema.find({ link_url_id: req.query.id }).exec((err, resultLink) => {
                        err ? console.log(err) : console.log(resultLink)

                        UserSchema.find({ id: allCategories.id_inst }).exec((err, resultUser) => {
                            err ? console.log("Error retrieving") :

                                LSchema.find({ id_inst: req.user.id }).exec((err, Lresult) => {
                                    err ? console.log(err) : console.log("Lresult", Lresult)

                                    var arrayResult = []

                                    for (var i = 0; i < Lresult.length; i++) {
                                        arrayResult.push(Lresult[i].link_url_id)
                                    }

                                    // Se define variable date_query,si existe una fecha inicial 
                                    // se realiza busqueda por fecha, si no solo busqueda por query

                                    var date_query

                                    if (!date_start) {
                                        date_query =
                                            [{ 'category_results.name': req.query.search }]
                                    } else {
                                        date_query =
                                            [{ 'category_results.name': req.query.search },
                                            { time_started: { $gte: date_start, $lte: date_end } }]
                                    }


                                    TestSchema.find()
                                        .and(date_query)
                                        .sort({ time_finished: -1 }) //fecha de mayor a menor
                                        .exec((err, ByLinkresult) => {

                                            err ? console.log(err) : console.log("ByLinkresult")

                                            // *** Consulta no usada en esta ruta, se envia como resultado ByLinkresult            
                                            // Query in test from: query.search (category), req.query.id(id link), betwen dates
                                            TestSchema.find()
                                                .and(date_query)
                                                .sort({ time_finished: -1 })
                                                .exec((err, result) => {
                                                    console.log("RESULTADO ADMIN ")

                                                    err ? console.log(err) :

                                                        (res.render('searchandlink',
                                                            {
                                                                cat: resultCat,
                                                                allcat: allCategories,
                                                                url: req.query.id,
                                                                cat_search: req.query.search,
                                                                link: resultLink,
                                                                user: usuario,
                                                                result: ByLinkresult,
                                                                date_start: req.query.start,
                                                                date_end: req.query.end,
                                                                User: resultUser,
                                                                lresult: Lresult,
                                                                busqueda_get: busqueda_get

                                                            }))

                                                })//TestSchema.find({link_url_id: {$in: arrayResult}})

                                        })//LSchema.find({id_inst: req.user.id})

                                })//UserSchema.find({id: allCategories.id_inst})

                        }) //LSchema.find({ link_url_id: req.query.id })

                    })//Close TestSchema.find

                })//Close Categories.find()

            })
        }
    })


    /*-------------------    BUSQUEDA PARA CONSULTAR ------------------------*/

    app.get('/consultor_search/', isLoggedIn, (req, res) => {



        if (req.query.search) {

            var url = req.query.id_inst
            console.log("urlaqui", url)

            console.log("LOGG", req.user.id)
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');

            TestSchema.find({ $or: [{ access_code: regex }, { link_url_id: regex }] }, (err, allCategories) => {
                err ? console.log(err) : console.log(allCategories)

                var long
                (allCategories == "") ? long = 1 : long = 0
                console.log("VALONG", allCategories)
                console.log("VALONGO", long)


                Categories.find().exec((err, resultCat) => {
                    err ? console.log(err) :


                        //Se encuentran los link_url_id segun req.user.id                
                        LSchema.find({ id_inst: req.user.id }).exec((err, Lresult) => {
                            err ? console.log(err) : console.log("LRESULT", Lresult)

                            //for para iterar los link_url_id pertenecientes a cada consultor
                            var arrayResult = []

                            for (var i = 0; i < Lresult.length; i++) {
                                arrayResult.push(Lresult[i].link_url_id)
                            }

                            //TestSchema.find({$or:[{link_url_id: Lresult[0].link_url_id}, {link_url_id: Lresult[1].link_url_id}]})
                            TestSchema.find({ link_url_id: { $in: arrayResult } })
                                .sort({ time_finished: -1 }) //fecha de mayor a menor
                                .exec((err, result) => {



                                    err ? console.log(err) :

                                        (res.render('consultor_search', {
                                            lresult: Lresult,
                                            participantes: result,
                                            cat: resultCat,
                                            result: allCategories,
                                            val: long,
                                            user: req.user,
                                            busqueda: req.query.search,
                                            url: url

                                        }))//(res.render('consultor_search'

                                })//TestSchema.find({link_url_id: {$in: arrayResult}})

                        })//LSchema

                })//Categories.find()

            })//TestSchema.find({$or:[{access_code: regex},
        } else {
            (res.sendStatus(404))
        }
    })




    /*------------------------ BUSQUEDA POR FECHA ----------------------------*/

    app.get('/date', isLoggedIn, function (req, res) {


        var url = req.query.id

        if (url == req.user.id || req.user.sa == 1) {

            var busqueda_get = req.query.busqueda_get
            console.log("busqueda_get", busqueda_get)

            console.log("VIENE DE BUSQUEDA GENERAL")

            var date_start_get = req.query.start
            var date_end_get = req.query.end

            //Defino usuario globalmente
            var usuario = req.user

            //Se suma 86400 para obtener el día completo
            var date_start = ((new Date(date_start_get) / 1000) + 86400);
            var date_end = ((new Date(date_end_get) / 1000) + 86400);

            //console.log(date_start)
            //console.log(date_end)


            LSchema.find({ id_inst: req.user.id }).exec((err, Lresult) => {
                err ? console.log(err) : console.log("Lresult")

                //for para iterar los link_url_id pertenecientes a cada consultor
                var arrayResult = []

                for (var i = 0; i < Lresult.length; i++) {
                    arrayResult.push(Lresult[i].link_url_id)
                }

                if (req.user.sa == 1) {
                    var querycomplete = [{ time_started: { $gte: date_start, $lte: date_end } }]
                } else {
                    querycomplete = [{ link_url_id: { $in: arrayResult } }, { time_started: { $gte: date_start, $lte: date_end } }]
                }

                //busqueda de fechas y del array con los link_url_id
                TestSchema.find()
                    .and(querycomplete)
                    .sort({ time_finished: -1 }) //fecha de mayor a menor
                    .exec((err, result) => {
                        console.log("RESULT TOTAL ")


                        err ? console.log(err) :


                            //console.log(req.query.search)
                            //res.render("list_test_b", {categories: allCategories});
                            Categories.find().exec(function (err, resultCat) {
                                err ? console.log(err) : console.log("resultCat")


                                //Captura de variable query.admin para validar si la busqueda la hace admin
                                //si es admin renderiza admin_search, si no renderiza list_test
                                //Si hace nueva busqueda UserSchema para hayar los datos segun el id del instructor hayado

                                aSchema.find().exec((err, accessresult) => {
                                    err ? console.log(err) : console.log("accessresult")

                                    //se busca en schema de links segun el id del instructor
                                    if (req.user.sa == 0) { var resultLinkVar = { id_inst: req.query.id } } else { resultLinkVar = {} }
                                    LSchema.find(resultLinkVar).exec((err, resultLink) => {
                                        err ? console.log(err) : console.log("RESULTLINK ", resultLink)


                                        res.render('date_search',
                                            {
                                                cat: resultCat,
                                                result: result,
                                                user: usuario,
                                                aresult: accessresult,
                                                date_start: date_start_get,
                                                date_end: date_end_get,
                                                url: url,
                                                date_start: req.query.start,
                                                date_end: req.query.end,
                                                lresult: resultLink,
                                                busqueda_get: busqueda_get

                                            })


                                    })//Close LSchema

                                })//aSchema.find(    


                                //Close TestSchema.find
                                //Close Categories else

                            })//Categories.find()

                    })//TestSchema.find(search_date)

            })


        } else {

            console.log("VIENE DE ENLACE")

            var date_start_get = req.query.start
            var date_end_get = req.query.end

            console.log("END", req.query.start)
            console.log("START", req.query.end)

            //Defino usuario globalmente
            var usuario = req.user

            //Se suma 86400 para obtener el día completo
            var date_start = ((new Date(date_start_get) / 1000) + 86400);
            var date_end = ((new Date(date_end_get) / 1000) + 86400);

            //console.log(date_start)
            //console.log(date_end)

            var search_date = { time_started: { $gte: date_start, $lte: date_end } }



            TestSchema.find()
                .and([
                    { time_started: { $gte: date_start, $lte: date_end } },
                    { link_url_id: req.query.id }
                ])
                .exec(function (err, resultDate) {

                    err ? console.log(err) :


                        //console.log(req.query.search)
                        //res.render("list_test_b", {categories: allCategories});
                        Categories.find().exec(function (err, resultCat) {
                            err ? console.log(err) : console.log("RESULTCAT ")

                            var long
                            (resultDate == 0) ? long = 1 : long = 0
                            //Captura de variable query.admin para validar si la busqueda la hace admin
                            //si es admin renderiza admin_search, si no renderiza list_test
                            //Si hace nueva busqueda UserSchema para hayar los datos segun el id del instructor hayado

                            aSchema.find().exec((err, accessresult) => {
                                err ? console.log(err) :

                                    //COMMENT GIt
                                    LSchema.find({ link_url_id: req.query.id }).exec((err, resultLink) => {
                                        err ? console.log(err) : console.log(resultLink)


                                        UserSchema.find({ id: resultDate.id_inst }).exec((err, resultUser) => {
                                            err ? console.log(err) : console.log("lista asesores")

                                            usuario.sa == 1 ?

                                                res.render('list_test',
                                                    {
                                                        cat: resultCat,
                                                        result: resultCat,
                                                        val: long,
                                                        link: resultLink,
                                                        user: usuario,
                                                        aresult: accessresult,
                                                        User: resultUser,
                                                        resultUser: resultUser,
                                                        date_start: date_start_get,
                                                        date_end: date_end_get,
                                                        url: url
                                                    })

                                                ://else
                                                res.render('consultor_search',
                                                    {
                                                        cat: resultCat,
                                                        result: resultDate,
                                                        val: long,
                                                        link: resultLink,
                                                        user: usuario,
                                                        aresult: accessresult,
                                                        User: resultUser,
                                                        resultUser: resultUser,
                                                        date_start: req.query.start,
                                                        date_end: req.query.end,
                                                        url: url,
                                                        lresult: resultLink,
                                                        busqueda_get: busqueda_get

                                                    })

                                        })//UserSchema

                                    })//Close LSchema

                            })//aSchema.find(    


                            //Close TestSchema.find
                            //Close Categories else

                        })//Categories.find()

                })//TestSchema.find(search_date)


        }

    })



    /*--------------- BUSQUEDA POR FECHA Y CATEGORIA ----------------------------*/

    app.get('/dateandlink', isLoggedIn, function (req, res) {

        var url = req.query.id

        var date_start_get = req.query.start
        var date_end_get = req.query.end

        //Defino usuario globalmente
        var usuario = req.user

        //Se suma 86400 para obtener el día completo
        var date_start = ((new Date(date_start_get) / 1000) + 86400);
        var date_end = ((new Date(date_end_get) / 1000) + 86400);

        //console.log(date_start)
        //console.log(date_end)


        LSchema.find({ id_inst: req.user.id }).exec((err, Lresult) => {
            err ? console.log(err) : console.log(Lresult)

            //for para iterar los link_url_id pertenecientes a cada consultor
            var arrayResult = []

            for (var i = 0; i < Lresult.length; i++) {
                arrayResult.push(Lresult[i].link_url_id)
            }


            TestSchema.find({ link_url_id: { $in: arrayResult } })
                .sort({ time_finished: -1 }) //fecha de mayor a menor
                .exec((err, ByLinkresult) => {

                    err ? console.log(err) : console.log(ByLinkresult)

                    var date_query
                    var aux

                    if (req.query.id == req.user.id) {
                        aux = 1
                        date_query =
                            [
                                { link_url_id: arrayResult },
                                { time_started: { $gte: date_start, $lte: date_end } }
                            ]
                    } else {

                        if (!date_start) {
                            aux = 2
                            date_query =
                                [{ 'category_results.name': req.query.search },
                                { link_url_id: req.query.id }]
                        } else {
                            aux = 3
                            date_query =
                                [{ 'category_results.name': req.query.search },
                                { link_url_id: req.query.id },
                                { time_started: { $gte: date_start, $lte: date_end } }]


                        }

                    }


                    //busqueda de fechas y del array con los link_url_id
                    TestSchema.find()
                        .and(
                            date_query
                        )
                        .sort({ time_finished: -1 }) //fecha de mayor a menor
                        .exec((err, result) => {

                            console.log("AUX", result)

                            err ? console.log(err) :


                                //console.log(req.query.search)
                                //res.render("list_test_b", {categories: allCategories});
                                Categories.find().exec(function (err, resultCat) {
                                    err ? console.log(err) : console.log(resultCat)


                                    //Captura de variable query.admin para validar si la busqueda la hace admin
                                    //si es admin renderiza admin_search, si no renderiza list_test
                                    //Si hace nueva busqueda UserSchema para hayar los datos segun el id del instructor hayado

                                    aSchema.find().exec((err, accessresult) => {
                                        err ? console.log(err) :

                                            //COMMENT GIt
                                            LSchema.find({ link_url_id: req.query.id }).exec((err, resultLink) => {
                                                err ? console.log(err) : console.log(resultLink)

                                                res.render('searchandlink',
                                                    {
                                                        cat: resultCat,
                                                        cat_search: req.query.cat_search,
                                                        result: result,
                                                        link: resultLink,
                                                        user: usuario,
                                                        aresult: accessresult,
                                                        date_start: date_start_get,
                                                        date_end: date_end_get,
                                                        url: url,
                                                        lresult: resultLink

                                                    })


                                            })//Close LSchema

                                    })//aSchema.find(    

                                })//Categories.find()

                        })//TestSchema.find(search_date)

                })

        })

    })



    /*-------------------------- VER CATEGORIAS ------------------------------*/

    app.get('/categories', isLoggedIn, (req, res) => {
        Categories.find().exec((err, result) => {
            err ? console.log("Error retrieving") : console.log(result)
            res.render('categorias', { categorias: result, user: req.user })
        })
    })



    /*------------------------SEARCH FUNCIONALIDAD ---------------------------*/

    function escapeRegex(text) {
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