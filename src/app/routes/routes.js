var mongoose = require('mongoose');
var { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
var request = require('request');
var bodyParser = require('body-parser');
var UserSchema = require('../models/user.js');
var Categories = require('../models/categories.js');
var API_Test = require('../models/API_Test');
var Assignments = require('../models/Assignments');
var Codes = require('../models/Codes');
var LinkResults = require('../models/LinkResults');
var SummaryResults = require('../models/SummaryResults');
var storageLinkResult = require('./storage/StorageLinkResult');

mongoose.Promise = global.Promise;

const { url } = require('../../config/database');

var forge = require('node-forge');

module.exports = (app, passport) => {
    //------------------------------- WEBHOOK--------------------------------//
    app.use(bodyParser.json())

    app.post('/aSdgsDdFSDa', (req, res) => {
        var jsonData = req.body;
        /*Al momento de recorrer el cuerpo de la peticion, no se garantiza
        mantener el orden del objeto, este cambio de orden no permite 
        comparar la firma pues el mensaje se considera diferente*/
        if (jsonData.payload_type) {
            res.sendStatus(200);
            if (jsonData.payload_type == 'single_user_test_results_link') {
                storageLinkResult(jsonData);
            }
        } else {
            res.sendStatus(400);
        }
    });

    /* pendiente por verificar uso
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
    */

    //------------------------- JOIN PROJECT START----------------------------//
    app.get('/', (req, res) => {
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });

    /*-------------------- LOGIN POST ----------------------*/
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true
    }));

    //-------------------- LOGOUT ----------------------//
    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    //-----------  FUNCIONLOGIN VALIDATION -------------//
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/');
    }

    //-------------------  NEW USER REGISTER--------------//
    app.get('/signup', isLoggedIn, (req, res) => {
        req.user.sa >= 1 ? (res.render('signup', { user: req.user, message: req.flash('signupMessage') })) : (res.sendStatus(404))
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true,
        //Session false para que no inicie sesión al crear una cuenta
        session: false
    }));

    //------------------- VIEW DASHBOARD ------------------ pendiente cambiar nombre links*/
    app.get('/profile', isLoggedIn, (req, res) => {
        switch (req.user.sa) {
            case '1'://superadmin
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

            case '2'://consultor
                res.render('profile',
                    {
                        user: req.user
                    });
                break;

            case '0'://admin
                res.render('profile', {
                    user: req.user,
                    participantes: ''
                })
                break;

            default:
        }
    });

    /*-------------- Assign new test --------------*/
    app.get('/setnewtest/:id', isLoggedIn, (req, res) => {
        setNewTest(req.params.id, req.user, res);
    });

    function setNewTest(user_id, req_user, res, message) {
        UserSchema.findById(user_id, null, (err, user) => {
            if (err) { throw err }
            if (user.admin_email == req_user.local.email || req_user.sa == 1) {
                var data = {};
                data.user = user;
                data.message = message;
                if (user.sa == 2) {//->usuario admin
                    Assignments.find({ 'admin_email': user.local.email }, 'test_id', (err, results) => {
                        if (err) { throw err }
                        var exceptions = [];
                        if (results.length > 0) {
                            results.forEach(function (item) {
                                exceptions.push(item.test_id);
                            });
                        }
                        API_Test.find({ 'test_id': { $nin: exceptions } }, null, { sort: { test_name: 1 } }, (err, tests) => {
                            if (err) { throw err }
                            data.tests = tests;
                            res.render('set_new_test', {
                                user: req_user,
                                data: data
                            });
                        });
                    });
                } else if (user.sa == 0) {//->usuario consultor..
                    Assignments.find({ $and: [{ 'admin_email': user.admin_email }, { 'users.email': { $ne: user.local.email } }] }, null, { sort: { 'test_name': 1 } }, (err, tests) => {
                        if (err) { throw err }
                        data.tests = tests;
                        res.render('set_new_test', {
                            user: req_user,
                            data: data
                        });
                    });
                }
            }
        });
    }

    app.get('/temp',(req,res)=>{//pendiente
        var uri = require('../../classmarker/temp')(270957,635860);
        request(uri,(err,response,body)=>{
            res.send(JSON.parse(body));
        })
        
    })

    app.get('/setnewtest_updated/:id', isLoggedIn, (req, res) => {
        var testsArray = new Array;
        var uri = require('../../classmarker/all')();
        request(uri, (error, response, body) => {
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
                    if (err) { throw err }
                    updateTests(0, testsArray.length);
                })
            } else {
                //->pendiente se debe manejar este error (no se pudo actualizar)
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
                    if (err) { throw err };//--->se debe manejar este error al guardar datos
                    updateTests(i + 1, imax)
                })
            } else {
                setNewTest(req.params.id, req.user, res, 2)
            }
        }
    });

    app.post('/setnewtest/:id', isLoggedIn, (req, res) => {
        if (req.body.linklist == -1) {
            setNewTest(req.params.id, req.user, res, 1);
        } else if (req.body.testlist == -1) {
            setNewTest(req.params.id, req.user, res, 3);
        } else {
            UserSchema.findById(req.params.id, null, (err, user) => {
                if (user.sa == 2) {//-> usuario admin
                    API_Test.findOne({ 'test_name': req.body.test_name }, null, (err, test) => {
                        var newAssignment = new Assignments();
                        newAssignment.test_id = test.test_id;
                        newAssignment.test_name = test.test_name;
                        newAssignment.link_name = test.links[req.body.linklist].link_name;
                        newAssignment.link_id = test.links[req.body.linklist].link_id;
                        newAssignment.link_url_id = test.links[req.body.linklist].link_url_id;
                        newAssignment.access_list_id = test.links[req.body.linklist].access_list_id;
                        newAssignment.admin_email = user.local.email;
                        newAssignment.codes_max = req.body.MaxCodes;
                        newAssignment.codes_created = 0;
                        newAssignment.codes_used = 0;
                        newAssignment.codes_availables = req.body.MaxCodes;
                        newAssignment.save(function (err) {
                            if (err) { throw err }
                            res.redirect('/users_list');
                        });
                    });
                } else if (user.sa == 0) {//->usuario consultor...
                    Assignments.findOneAndUpdate({ 'test_name': req.body.test_name, 'admin_email': user.admin_email }, {
                        $push: {
                            'users': {
                                id: user._id,
                                email: user.local.email,
                                codes_max: req.body.MaxCodes,
                                codes_created: 0,
                                codes_used: 0,
                                created_by: req.user.local.email
                            }
                        }, $inc: {
                            'codes_availables': -req.body.MaxCodes
                        }
                    }, err => {
                        if (err) { throw err }
                        res.redirect('/users_list');
                    });
                }
            });
        }
    });

    //---------------- Generar codigos -------------//
    app.post('/generate_new_code/:assignment_id/:user_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.user_id, null, (err, test_user) => {
            if (err) { throw err }
            if (req.user.local.email == test_user.local.email || req.user.local.email == test_user.admin_email || req.user.sa == 1) {
                Assignments.findById(req.params.assignment_id, null, (err, assignment) => {
                    console.log(assignment)
                    generate_code(0, req.body.GenerateCodes);

                    function generate_code(i, number) {
                        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                        if (i < number) {
                            var new_code = '';
                            for (var j = 0; j < 4; j++) {
                                new_code += chars[Math.floor(Math.random() * chars.length)];
                            }
                            console.log("nuevo codigo")
                            console.log(new_code)
                            check_code(i, number, new_code);
                        } else {
                            console.log("tipo de usuario: ")
                            console.log(test_user.sa)
                            if (test_user.sa == 2) {//-> usuario admin
                                assignment.codes_created += Number(number);
                                assignment.codes_availables -= Number(number);
                            } else if (test_user.sa == 0) {//-> usuario consultor
                                var index = assignment.users.findIndex(doc => doc.id == test_user._id)
                                assignment.users[index].codes_created += Number(number);
                            }
                            assignment.save(err => {
                                if (err) { throw err }
                                res.redirect('/test_view/' + assignment._id + '/' + test_user._id)
                            });
                        }
                    }

                    function check_code(i, number, new_code) {
                        Codes.findOne({ 'code': new_code }, null, (err, result) => {
                            if (err) { throw err }
                            if (result) {
                                console.log("ya existe")
                                console.log("------------")
                                generate_code(i, number);
                            } else {
                                console.log("guardando....")
                                request.post({
                                    headers: { 'Content-type': 'application/json; charset=utf-8' },
                                    url: require('../../classmarker/addCode')(assignment.access_list_id),
                                    body: JSON.stringify([new_code])
                                }, (err, res, body) => {
                                    if (err) { throw err }
                                    var cleanBody = JSON.parse(body);
                                    if (cleanBody.status != 'ok' || cleanBody.access_lists.access_list.num_codes_added == 0) {
                                        console.log(cleanBody)
                                        generate_code(i, number);
                                    } else {
                                        var new_code_schema = new Codes();
                                        new_code_schema.code = new_code;
                                        new_code_schema.used = 0;
                                        new_code_schema.assignment_id = assignment._id;
                                        new_code_schema.user_email = test_user.local.email;
                                        new_code_schema.save(function (err) {
                                            if (err) { throw err }
                                            console.log("Guardado")
                                            console.log("------------")
                                            generate_code(i + 1, number);
                                        })
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.sendStatus(403)
            }
        });
    });

    //-----------------Lista de usuarios (superadmin)-------------//
    app.get('/users_list', isLoggedIn, (req, res) => {
        UserSchema.find({}, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
            err ? console.log(err) : res.render('users_list', { items: resultArray, user: req.user })
        });
    });

    //-----------------Lista de usuarios (admin)-------------//
    app.get('/users_list/:id', isLoggedIn, (req, res) => {
        UserSchema.find({ 'admin_email': req.user.local.email }, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
            if (err) { throw err; }
            res.render('users_list', { items: resultArray, user: req.user });
        });
    })

    //-------------------- Vista de pruebas de consultores--------------------//
    app.get('/tests_list_cons/:cons_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.cons_id, null, (err, consultant) => {
            if (req.user.local.email == consultant.local.email || req.user.local.email == consultant.admin_email || req.user.sa == 1) {
                Assignments.find({ 'users.id': consultant._id }, null, { sort: { 'test_name': 1 } }, (err, assignments) => {
                    if (err) { throw err }
                    var data = {};
                    data.consultant = {};
                    data.consultant.email = consultant.local.email;
                    data.consultant.id = consultant._id;
                    data.assignments = [];
                    assignments.forEach(assignment => {
                        var index = assignment.users.findIndex(x => x.id == consultant._id);
                        data.assignments.push({
                            name: assignment.test_name,
                            id: assignment._id,
                            codes_used: assignment.users[index].codes_used,
                            codes_max: assignment.users[index].codes_max
                        });
                    });
                    res.render('tests_list_cons', {
                        user: req.user,
                        data: data
                    });
                });
            } else {
                res.sendStatus(403)
            }
        });
    });

    //-------------------- Vista de pruebas asignadas administradores---------------------//
    app.get('/tests_list_admin/:admin_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.admin_id, null, (err, administrator) => {
            if (err) { throw err }
            if (req.user.local.email == administrator.local.email || req.user.sa == 1) {
                var data = {};
                data.administrator = {
                    email: administrator.local.email
                };
                Assignments.find({ 'admin_email': administrator.local.email }, null, { sort: { 'test_name': 1 } }, (err, assignments) => {
                    if (err) { throw err }
                    data.assignments = [];
                    assignments.forEach(assignment => {
                        console.log(assignment);
                        var users = [];
                        users.push({
                            email: assignment.admin_email,
                            codes_used: assignment.codes_used,
                            codes_max: assignment.codes_availables + assignment.codes_created + assignment.codes_used,
                            id: administrator._id
                        });
                        assignment.users.forEach(assignment_user => {
                            users.push({
                                email: assignment_user.email,
                                codes_used: assignment_user.codes_used,
                                codes_max: assignment_user.codes_max,
                                id: assignment_user.id
                            });
                        });
                        data.assignments.push({
                            test_name: assignment.test_name,
                            codes_max: assignment.codes_max,
                            id: assignment._id,
                            users: users
                        });
                    })
                    res.render('tests_list_admin', {
                        user: req.user,
                        data: data
                    });
                });
            }
        });
    });

    /*-------------------VISTA DE PRUEBAS-------------------------------------------*/
    app.get('/test_view/:assignment_id/:user_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.user_id, null, (err, test_user) => {
            if (err) { throw err }
            if (req.user.local.email == test_user.local.email || req.user.local.email == test_user.admin_email || req.user.sa == 1) {
                Codes.find({ 'assignment_id': req.params.assignment_id, 'user_email': test_user.local.email }, null, { sort: { 'code': 1 } }, (err, codesArray) => {
                    if (err) { throw err }
                    var data = {};
                    data.codes_created_array = [];
                    data.user = test_user;
                    data.codes_used_array = [];
                    codesArray.forEach(code => {
                        if (code.used == 0) {
                            data.codes_created_array.push(code.code);
                        } else {
                            data.codes_used_array.push(code.code);
                        }
                    });
                    LinkResults.find({ 'access_code_used': { $in: data.codes_used_array } }, null, { sort: { 'access_code_used': 1 } }, (err, linkresultsArray) => {
                        if (err) { throw err }
                        data.categories = [];
                        data.results = [];
                        var index;
                        linkresultsArray.forEach(result => {
                            data.results.push({
                                access_code_used: result.access_code_used,
                                passed: result.passed,
                                percentage: result.percentage,
                                points_scored: result.points_scored,
                                points_available: result.points_available,
                                duration: result.duration,
                                time_finished: result.time_finished,
                                test_result_id: result._id
                            });
                            result.category_results.forEach(category => {
                                index = data.categories.findIndex(doc => doc.name == category.name);
                                if (index == -1) {
                                    data.categories.push({
                                        name: category.name,
                                        percentage_sum: category.percentage,
                                        points_available_sum: category.points_available,
                                        points_scored: category.points_scored,
                                        answers: 1
                                    });
                                } else {
                                    data.categories[index].percentage_sum += category.percentage;
                                    data.categories[index].points_available_sum += category.points_available;
                                    data.categories[index].points_scored += category.points_scored;
                                    data.categories[index].answers += 1;
                                }
                            });
                        });
                        data.categories.sort((a, b) => {
                            if (a.name < b.name) { return -1; }
                            if (a.name > b.name) { return 1; }
                            return 0;
                        });
                        if (test_user.sa == 2) {//->usuario admin
                            Assignments.findOne({ '_id': req.params.assignment_id, 'admin_email': test_user.local.email }, null, (err, assignment) => {
                                if (err) { throw err }
                                data.test_name = assignment.test_name;
                                data.assignment_id = assignment._id
                                data.codes_max = assignment.codes_created + assignment.codes_used + assignment.codes_availables;
                                data.codes_created = assignment.codes_created;
                                data.codes_used = assignment.codes_used;
                                res.render('test_view', {
                                    user: req.user,
                                    data: data,
                                });
                            });
                        } else if (test_user.sa == 0) {//->usuario consultor
                            Assignments.findOne({ '_id': req.params.assignment_id, 'users.id': test_user._id }, null, (err, assignment) => {
                                if (err) { throw err }
                                data.test_name = assignment.test_name;
                                data.assignment_id = assignment._id
                                for (var assignment_user of assignment.users) {
                                    if (assignment_user.id == test_user._id) {
                                        data.codes_max = assignment_user.codes_max;
                                        data.codes_created = assignment_user.codes_created;
                                        data.codes_used = assignment_user.codes_used;
                                        break;
                                    }
                                }
                                res.render('test_view', {
                                    user: req.user,
                                    data: data,
                                });
                            });
                        }
                    });
                });
            }
        });
    });

    /*-------------------------VISTA DE RESULTADOS------------------------*/
    app.get('/test_result/:result_id', isLoggedIn, (req, res) => {
        LinkResults.findById(req.params.result_id, null, (err, linkResult) => {
            if (err) { throw err }
            Codes.findOne({ 'code': linkResult.access_code_used }, null, (err, code) => {
                if (err) { throw err }
                UserSchema.findOne({ 'local.email': code.user_email }, null, (err, user) => {
                    if (err) { throw err }
                    SummaryResults.findOne({ 'assignment_id': code.assignment_id, 'user_email': code.user_email }, null, (err, summary) => {
                        if (err) { throw err }
                        if (req.user.local.email == user.local.email || req.user.local.email == user.admin_email || req.user.sa == 1) {
                            var data = {};
                            data.test_name = linkResult.test_name;
                            data.access_code_used = linkResult.access_code_used;
                            data.percentage = linkResult.percentage;
                            data.points_scored = linkResult.points_scored;
                            data.points_available = linkResult.points_available;
                            data.duration = linkResult.duration;
                            data.time_started = linkResult.time_started;
                            data.time_finished = linkResult.time_finished;
                            data.category_results = linkResult.category_results.sort((a, b) => {
                                return (a.name < b.name) ? -1 : 1;
                                return 0;
                            });
                            summary.categories.sort((a, b) => {
                                return (a.name < b.name) ? -1 : 1;
                                return 0;
                            });
                            data.category_results.labels = [];
                            data.category_results.data = [];
                            data.category_results.average = [];
                            data.category_results.forEach((result, index) => {
                                data.category_results.labels.push(JSON.stringify(result.name));
                                data.category_results.data.push(result.percentage);
                                if (summary.categories[index].name == result.name) {
                                    data.category_results.average.push(summary.categories[index].average);
                                } else {
                                    data.category_results.average.push(0);
                                }
                            });
                            var questions = linkResult.questions.sort((a, b) => {
                                return (a.category < b.category) ? -1 : 1;
                                return 0;
                            });
                            data.questions = [];
                            //---formato de las respuestas ---/
                            questions.forEach((question, index) => {
                                var result = 0;
                                if (question.question_type == "multiplechoice" || question.question_type == "truefalse") {
                                    var correct_option = question.correct_option.split(",");
                                    var user_response = question.user_response.split(",");
                                    var options = [];
                                    for (var key in question.options) {
                                        if (question.options.hasOwnProperty(key)) {
                                            if (user_response.indexOf(key) != -1) {
                                                if (correct_option.indexOf(key) != -1) {
                                                    options.push({
                                                        option: question.options[key].replace(new RegExp('<br /><br />', 'g'), "<br />"),
                                                        status: 'correct answer'
                                                    });
                                                    result++;
                                                } else {
                                                    options.push({
                                                        option: question.options[key].replace(new RegExp('<br /><br />', 'g'), "<br />"),
                                                        status: 'wrong answer'
                                                    });
                                                }
                                            } else {
                                                if (correct_option.indexOf(key) != -1) {
                                                    options.push({
                                                        option: question.options[key].replace(new RegExp('<br /><br />', 'g'), "<br />"),
                                                        status: 'missed answer'
                                                    });
                                                } else {
                                                    options.push({
                                                        option: question.options[key].replace(new RegExp('<br /><br />', 'g'), "<br />"),
                                                        status: 'answer'
                                                    });
                                                }
                                            }
                                        }
                                    }
                                } else if (question.question_type == "freetext") { //-> pendiente explorar opciones grammar y essay 
                                    var options = {};
                                    options.user_answer = question.user_response;
                                    if (question.result == "incorrect") {
                                        options.status = 'wrong answer';
                                    } else {
                                        options.status = 'correct answer';
                                        result++;
                                    }
                                    options.options = '';
                                    question.options.exact_match.forEach(option => {
                                        options.options += option.content + ',';
                                    });
                                    options.options = options.options.substr(0, options.options.length - 1);
                                } else if (question.question_type == "matching") {
                                    var options = [];
                                    for (var key in question.options) {
                                        if (question.options.hasOwnProperty(key)) {
                                            if (question.options[key].clue) {
                                                var status = '';
                                                if (question.options[key].correct_option == question.options[key].user_response) {
                                                    status = 'correct answer';
                                                    result++
                                                } else {
                                                    status = 'wrong answer';
                                                }
                                                options.push({
                                                    clue: question.options[key].clue,
                                                    match: question.options[key].match,
                                                    user_response: question.options[question.options[key].user_response].match,
                                                    status: status
                                                });
                                            }
                                        }
                                    }
                                }
                                if (result > 0 && question.result == "incorrect") {
                                    data.questions.push({
                                        question: question.question,
                                        options: options,
                                        category: question.category,
                                        points_scored: question.points_scored,
                                        points_available: question.points_available,
                                        question_type: question.question_type,
                                        result: 'partial_correct'
                                    });
                                } else {
                                    data.questions.push({
                                        question: question.question,
                                        options: options,
                                        category: question.category,
                                        points_scored: question.points_scored,
                                        points_available: question.points_available,
                                        question_type: question.question_type,
                                        result: question.result
                                    });
                                }


                            });
                            res.render('test_result', {
                                data: data,
                                user: req.user
                            });
                        } else {
                            res.sendStatus(403);
                        }
                    });
                });
            });
        });

    });


    /*-------------------------- VER CATEGORIAS ------------------------------*/
    app.get('/categories', isLoggedIn, (req, res) => {
        Categories.find().exec((err, result) => {
            err ? console.log("Error retrieving") : console.log(result)
            res.render('categorias', { categorias: result, user: req.user })
        })
    });

    //------------------------Compare tool--------------------------------//
    app.get('/compare',isLoggedIn,(req,res)=>{
        Codes.find({'user_email':req.user.local.email,'used':1},null,{sort:{'assignment_id':1}},(err,codes)=>{
            if(err) throw err;
            var datasets=[];
            var assignment_ids=[]
            var index;
            codes.forEach(code=>{
                index=datasets.findIndex(doc=>doc.assignment_id==code.assignment_id);
                if (index==-1){
                    assignment_ids.push(code.assignment_id);
                    datasets.push({
                        assignment_id:code.assignment_id,
                        codes: [code.code]
                    });
                }else{
                    datasets[index].codes.push(code.code);
                }
            });
            Assignments.find({_id:{$in:assignment_ids}},null,(err,assignments)=>{
                if(err) throw err;
               assignments.forEach(assignment=>{
                   datasets[datasets.findIndex(doc=>doc.assignment_id==assignment._id)].test_name=assignment.test_name;
                });
                res.render('compare',{
                    user:req.user,
                    datasets:datasets
                });
            });
        });
    });

    app.post('/compare',isLoggedIn,(req,res)=>{
        var codes=[]
        for(var property in req.body){
            codes.push(property);
        }
        
        LinkResults.find({'access_code_used':{$in:codes}},null,{sort:{'access_code_used':1}},(err,results)=>{
            if(err) throw err;
            var first=true;
            var data={
                labels:[],
                percentages:[],
                duration:[],
                points_scored:[],
                points_available:[],
                categories:[],
                common_categories:{
                    labels:[],
                    percentage:[]
                }
            };
            results.forEach(result=>{
                    data.percentages.push(result.percentage);
                    data.labels.push(result.access_code_used);
                    var time=result.duration.split(':');
                    data.duration.push(Number(time[0])*60+Number(time[1]));
                    data.points_scored.push(result.points_scored);
                    data.points_available.push(result.points_available)
                    var categories_labels=[];
                    var categories_percentage=[];
                    result.category_results.forEach(category=>{
                        categories_labels.push(category.name);
                        categories_percentage.push(category.percentage);
                        if (first){
                            data.common_categories.labels.push(category.name);
                            data.common_categories.percentage.push([category.percentage])
                        }
                    });
                   if(first){
                        first=false;
                    }else{
                        for (index=0;index<data.common_categories.labels.length;index++){
                            var label=data.common_categories.labels[index];
                            var i=categories_labels.findIndex(category=>category==label);
                            if(i>-1){
                                data.common_categories.percentage[index].push(categories_percentage[i]);
                            }else{
                                data.common_categories.percentage.splice(index,1);
                                data.common_categories.labels.splice(index,1);
                                index-=1;
                            }
                        }
                    }
                    data.categories.push({
                        labels: categories_labels,
                        percentage: categories_percentage
                    });
            });
            for (i=0;i<data.categories.length;i++){
                for (j=0;j<data.common_categories.labels.length;j++){
                    var k=data.categories[i].labels.findIndex(value=>value==data.common_categories.labels[j]);
                    data.categories[i].labels.splice(k,1);
                    data.categories[i].percentage.splice(k,1);
                }
                if(data.categories[i].labels.length==0){
                    data.categories.splice(i,1);
                    i--;
                }
            }
            console.log(data.common_categories);
            res.render('compare_results',{
                user:req.user,
                data:data,
                dataset: [{
                    label: 'test',
                    data:'[100,50,10,12,85,45,14,23]',
                    backgroundColor: 'rgba(51, 88, 153, 1)',
                }]
            });
        });
       
    });
}