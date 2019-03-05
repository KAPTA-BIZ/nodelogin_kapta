/*jshint esversion: 6 */
var mongoose = require('mongoose');
var { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
var request = require('request');
var bodyParser = require('body-parser');
var UserSchema = require('../models/user.js');
var API_Test = require('../models/API_Test');
var Assignments = require('../models/Assignments');
var Codes = require('../models/Codes');
var LinkResults = require('../models/LinkResults');
var SummaryResults = require('../models/SummaryResults');
var storageLinkResult = require('./storage/StorageLinkResult');
var fs = require('fs');

mongoose.Promise = global.Promise;

const { url } = require('../../config/database');

var forge = require('node-forge');

module.exports = (app, passport) => {
    //------------------------------- WEBHOOK--------------------------------//
    app.use(bodyParser.json());

    app.post('/vGLfjH@d=u9Fht8K', (req, res) => {
        var jsonData = req.body;
        /*Al momento de recorrer el cuerpo de la peticion, no se garantiza
        mantener el orden del objeto, este cambio de orden no permite 
        comparar la firma pues el mensaje se considera diferente*/
        if (jsonData.payload_type) {
            res.sendStatus(200);
            fs.writeFile("test.txt", JSON.stringify(jsonData), function (err) {
                if (err) {
                    console.log(err);
                }
            });
            if (jsonData.payload_type == 'single_user_test_results_link') {
                storageLinkResult(jsonData);
            }
        } else {
            res.sendStatus(400);
        }
    });

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
        (req.user.sa >= 1) ? (res.render('signup', { user: req.user, message: req.flash('signupMessage') })) : (res.sendStatus(404));
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/users_list',
        failureRedirect: '/signup',
        failureFlash: true,
        //Session false para que no inicie sesión al crear una cuenta
        session: false
    }));

    //------------------- VIEW DASHBOARD ------------------*/
    app.get('/profile', isLoggedIn, (req, res) => {
        switch (req.user.sa) {
            case '1': //superadmin
                UserSchema.find({}, null, (err, users) => {
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        var NSC_users = [],
                            dealer_users = [];
                        users.forEach(user => {
                            if (user.sa == 0) {
                                dealer_users.push(user.local.user);
                            } else if (user.sa == 2) {
                                NSC_users.push(user.local.user);
                            }
                        });
                        API_Test.find({}, null, (err, tests) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                LinkResults.find({}, null, (err, results) => {
                                    if (err) {
                                        res.sendStatus(502);
                                    } else {
                                        Assignments.find({}, null, { sort: { 'NSC': 1, 'test_name': 1 } }, (err, assignments) => {
                                            console.log(assignments);
                                            if (err) {
                                                res.sendStatus(502);
                                            } else {
                                                var NSC = '';
                                                var index = -1;
                                                var credits = [];
                                                assignments.forEach(assignment => {
                                                    var assignment_credits = [assignment.codes_max, assignment.codes_created, assignment.codes_used];
                                                    assignment.users.forEach(user => {
                                                        assignment_credits[1] += user.codes_created;
                                                        assignment_credits[2] += user.codes_used;
                                                    })
                                                    if (NSC != assignment.NSC) {
                                                        index++;
                                                        NSC = assignment.NSC;
                                                        credits.push({
                                                            user: NSC,
                                                            tests: [{
                                                                name: assignment.test_name,
                                                                credits: assignment_credits
                                                            }]
                                                        });
                                                    } else {
                                                        credits[index].tests.push({
                                                            name: assignment.test_name,
                                                            credits: assignment_credits
                                                        });
                                                    }
                                                });
                                                var data = {
                                                    users: {
                                                        admin: NSC_users.length,
                                                        consult: dealer_users.length
                                                    },
                                                    tests: tests.length,
                                                    assigned_tests: assignments.length,
                                                    results: results.length,
                                                    credits: credits
                                                }
                                                res.render('profile_superadmin', {
                                                    data: data,
                                                    user: req.user
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
                break;
            case '0': //dealer
                var data = {
                    tests: [],
                    codes_datasets: [],
                    codes: []
                };
                Assignments.find({ 'dealers.id': req.user._id }, null, { sort: { 'test_name': 1 } }, (err, assignments) => {
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        Codes.find({ 'dealer': req.user.local.user, 'assignment_id': 0 }, null, { sort: { 'code': 1 } }, (err, codes) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                data.codes = codes;
                                get_data(0, assignments);
                            }
                        });
                    }
                });
                break;
            case '2': //NSC
                var data = {
                    tests: [],
                    codes_datasets: [],
                    codes: []
                };
                var color = ['rgba(  6, 58, 81,1)',
                    'rgba( 42, 98,123,1)',
                    'rgba( 22, 78,103,1)',
                    'rgba(  2, 40, 57,1)',
                    'rgba(  0, 23, 32,1)',
                ];
                var colorHover = ['rgba(  6, 58, 81,0.5)',
                    'rgba( 42, 98,123,0.5)',
                    'rgba( 22, 78,103,0.5)',
                    'rgba(  2, 40, 57,0.5)',
                    'rgba(  0, 23, 32,0.5)',
                ];
                Assignments.find({ 'admin_email': req.user.local.email }, null, { sort: { 'test_name': 1 } }, (err, assignments) => {
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        UserSchema.find({ 'admin_email': req.user.local.email }, null, { sort: { 'local.email': 1 } }, (err, admin_users) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                get_data(0, assignments, admin_users);
                            }
                        });
                    }
                });
                break;
            default:
        }

        function get_data(i, assignments, admin_users) {
            if (assignments.length > 0) {
                assignment = assignments[i];
                SummaryResults.findOne({ 'assignment_id': assignment._id, 'user_email': req.user.local.email }, null, (err, sumary) => {
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        if (!sumary) {
                            sumary = {
                                knowledge_test_average: '-',
                                number_of_results: 0
                            }
                        }
                        Codes.find({ 'assignment_id': assignment._id, 'dealer': req.user.local.user }, null, { sort: { 'code': 1 } }, (err, codes) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                var codes_array_used = [];
                                var codes_array_unused = [];
                                codes.forEach(code => {
                                    code.assignment_id == 0 ? codes_array_unused.push(code.code) : codes_array_used.push(code.code);
                                });
                                LinkResults.find({ 'access_code_used': { $in: codes_array_used } }, ['knowledge_test_average', 'time_finished', 'access_code_used'], { sort: { 'time_finished': -1 }, limit: 3 }, (err, results) => {
                                    if (err) {
                                        res.sendStatus(502);
                                    } else {
                                        var results_temp = [];
                                        results.forEach(result => {
                                            var date = new Date(result.time_finished * 1000);
                                            results_temp.push({
                                                id: result._id,
                                                code: result.access_code_used,
                                                date: date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(),
                                                percentage: result.knowledge_test_average
                                            });
                                        });
                                        var codes_temp;
                                        if (req.user.sa == 2) {
                                            codes_temp = {
                                                used: assignment.codes_used,
                                                created: assignment.codes_created,
                                                availables: assignment.codes_availables,
                                                created_array: codes_array_unused
                                            }
                                            /* if (i == 0) {
                                                data.codes_datasets.push({
                                                    label: req.user.local.email,
                                                    data: [assignment.codes_max],
                                                    backgroundColor: color[0],
                                                    hoverBackgroundColor: colorHover[0]
                                                });
                                            } else {
                                                data.codes_datasets[0].data.push(assignment.codes_max);
                                            } */
                                            for (var l = 0; l < admin_users.length; l++) {
                                                user = admin_users[l];
                                                k = assignment.users.findIndex(doc => doc.email == user.local.email)
                                                if (i == 0) {
                                                    data.codes_datasets.push({
                                                        label: user.local.email,
                                                        data: (k == -1) ? [0] : [assignment.users[k].codes_max],
                                                        backgroundColor: color[l + 1],
                                                        hoverBackgroundColor: colorHover[l + 1]
                                                    });
                                                } else {
                                                    data.codes_datasets[l + 1].data.push((k == -1) ? 0 : assignment.users[k].codes_max);
                                                }
                                                data.codes_datasets[0].data[i] -= (k == -1) ? 0 : assignment.users[k].codes_max;
                                            }
                                        } else {
                                            for (var dealer of assignment.dealers) {
                                                if (dealer.email == req.user.local.email) {
                                                    codes_temp = {
                                                        used: dealer.codes_used,
                                                        created: dealer.codes_created,
                                                        availables: dealer.codes_max - dealer.codes_used - dealer.codes_created,
                                                        created_array: codes_array_unused
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        data.tests.push({
                                            name: assignment.test_name,
                                            link_url_id: assignment.link_url_id,
                                            id: assignment._id,
                                            average: sumary.knowledge_test_average,
                                            number_of_results: sumary.number_of_results,
                                            codes: codes_temp,
                                            results: results_temp
                                        });
                                        if (i + 1 == assignments.length) {
                                            res.render('profile_client', {
                                                user: req.user,
                                                data: data
                                            });
                                        } else {
                                            (admin_users) ? get_data(i + 1, assignments, admin_users) : get_data(i + 1, assignments);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.send(data);
                res.render('profile_client', {
                    user: req.user,
                    data: data
                });
            }
        }
    });

    /*-------------- Assign new test --------------*/
    app.get('/setnewtest/:id', isLoggedIn, (req, res) => {
        setNewTest(req.params.id, req.user, res);
    });

    function setNewTest(user_id, req_user, res, message) {
        UserSchema.findById(user_id, null, (err, user) => {
            if (err) {
                res.sendStatus(502);
            } else {
                if (user.admin_email == req_user.local.email || req_user.sa == 1) {
                    var data = {};
                    data.user = user;
                    data.message = message;
                    if (user.sa == 2) { //->usuario NSC
                        Assignments.find({ 'admin_email': user.local.email }, 'test_id', (err, results) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                var exceptions = [];
                                if (results.length > 0) {
                                    results.forEach(function (item) {
                                        exceptions.push(item.test_id);
                                    });
                                }
                                API_Test.find({ 'test_id': { $nin: exceptions } }, null, { sort: { test_name: 1 } }, (err, tests) => {
                                    if (err) {
                                        res.sendStatus(502);
                                    } else {
                                        data.tests = tests;
                                        res.render('set_new_test', {
                                            user: req_user,
                                            data: data
                                        });
                                    }
                                });
                            }
                        });
                    } else if (user.sa == 0) { //->usuario dealer..
                        Assignments.find({ $and: [{ 'admin_email': user.admin_email }, { 'users.email': { $ne: user.local.email } }] }, null, { sort: { 'test_name': 1 } }, (err, tests) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                data.tests = tests;
                                res.render('set_new_test', {
                                    user: req_user,
                                    data: data
                                });
                            }
                        });
                    }
                }
            }
        });
    }

    app.get('/setnewtest_updated/:id', isLoggedIn, (req, res) => {
        var testsArray = new Array;
        var uri = require('../../classmarker/all')();
        request(uri, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                var cleanBody = JSON.parse(body);
                console.log(cleanBody);
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
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        updateTests(0, testsArray.length);
                    }
                })
            } else {
                res.sendStatus(502);
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
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        updateTests(i + 1, imax)
                    }
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
                if (err) {
                    res.sendStatus(502);
                } else {
                    if (user.sa == 2) { //-> usuario NSC
                        API_Test.findOne({ 'test_name': req.body.test_name }, null, (err, test) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
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
                                UserSchema.find({ 'admin_email': user.local.email }, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
                                    if (err) {
                                        res.sendStatus(502);
                                    } else {
                                        newAssignment.users = [];
                                        let usertemp = {};
                                        resultArray.forEach(result => {
                                            usertemp = {}
                                            usertemp.id = result._id;
                                            usertemp.email = result.local.email;
                                            usertemp.codes_max = 0;
                                            usertemp.codes_created = 0;
                                            usertemp.codes_used = 0;
                                            newAssignment.users.push(usertemp);
                                        });
                                        newAssignment.save(function (err) {
                                            if (err) {
                                                res.sendStatus(502);
                                            } else {
                                                res.redirect('/users_list');
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else if (user.sa == 0) { //->usuario Dealer...
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
                            },
                            $inc: {
                                'codes_availables': -req.body.MaxCodes
                            }
                        }, err => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                res.redirect('/users_list');
                            }
                        });
                    }
                }
            });
        }
    });

    //----------------Generar codigos-----------------//
    app.get('/setCodes/:id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.id, null, (err, user) => {
            if (err) {
                res.sendStatus(502);
            } else {
                res.render('set_codes', {
                    user: user,
                    data: {}
                });
            }
        });

    });

    app.post('/setCodes/:id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.id, null, (err, test_user) => {
            if (err) {
                res.sendStatus(502);
            } else {
                Assignments.findOne({ 'admin_email': req.user.local.email }, null, (err, assignment) => {
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        generate_code(0, req.body.MaxCodes);

                        function generate_code(i, number) {
                            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                            if (i < number) {
                                var new_code = '';
                                for (var j = 0; j < 4; j++) {
                                    new_code += chars[Math.floor(Math.random() * chars.length)];
                                }
                                check_code(i, number, new_code);
                            } else {
                                res.redirect('/users_list');
                            }
                        }

                        function check_code(i, number, new_code) {
                            Codes.findOne({ 'code': new_code }, null, (err, result) => {
                                if (err) {
                                    res.sendStatus(502);
                                } else {
                                    if (result) {
                                        generate_code(i, number);
                                    } else {
                                        request.post({
                                            headers: { 'Content-type': 'application/json; charset=utf-8' },
                                            url: require('../../classmarker/addCode')(assignment.access_list_id),
                                            body: JSON.stringify([new_code])
                                        }, (err, res, body) => {
                                            if (err) {
                                                res.sendStatus(502);
                                            } else {
                                                var cleanBody = JSON.parse(body);
                                                if (cleanBody.status != 'ok' || cleanBody.access_lists.access_list.num_codes_added == 0) {
                                                    generate_code(i, number);
                                                } else {
                                                    var new_code_schema = new Codes();
                                                    new_code_schema.code = new_code;
                                                    new_code_schema.used = 0;
                                                    new_code_schema.assignment_id = 0;
                                                    new_code_schema.user_email = test_user.local.email;
                                                    new_code_schema.save(function (err) {
                                                        if (err) {
                                                            res.sendStatus(502);
                                                        } else {
                                                            generate_code(i + 1, number);
                                                        }
                                                    })
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });


            }
        });
        console.log(req.body.MaxCodes);
        console.log(req.params.id);
    });

    //---------------- Generar codigos -------------//
    app.post('/generate_new_code/:assignment_id/:user_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.user_id, null, (err, test_user) => {
            if (err) {
                res.sendStatus(502);
            } else {
                if (req.user.local.email == test_user.local.email || req.user.local.email == test_user.admin_email || req.user.sa == 1) {
                    Assignments.findById(req.params.assignment_id, null, (err, assignment) => {
                        if (err) {
                            res.sendStatus(502);
                        } else {
                            generate_code(0, req.body.GenerateCodes);

                            function generate_code(i, number) {
                                var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                                if (i < number) {
                                    var new_code = '';
                                    for (var j = 0; j < 4; j++) {
                                        new_code += chars[Math.floor(Math.random() * chars.length)];
                                    }
                                    check_code(i, number, new_code);
                                } else {
                                    if (test_user.sa == 2) { //-> usuario admin
                                        assignment.codes_created += Number(number);
                                        assignment.codes_availables -= Number(number);
                                    } else if (test_user.sa == 0) { //-> usuario consultor
                                        var index = assignment.users.findIndex(doc => doc.id == test_user._id)
                                        assignment.users[index].codes_created += Number(number);
                                    }
                                    assignment.save(err => {
                                        if (err) {
                                            res.sendStatus(502);
                                        } else {
                                            res.redirect('/test_view/' + assignment._id + '/' + test_user._id)
                                        }
                                    });
                                }
                            }

                            function check_code(i, number, new_code) {
                                Codes.findOne({ 'code': new_code }, null, (err, result) => {
                                    if (err) {
                                        res.sendStatus(502);
                                    } else {
                                        if (result) {
                                            generate_code(i, number);
                                        } else {
                                            request.post({
                                                headers: { 'Content-type': 'application/json; charset=utf-8' },
                                                url: require('../../classmarker/addCode')(assignment.access_list_id),
                                                body: JSON.stringify([new_code])
                                            }, (err, res, body) => {
                                                if (err) {
                                                    res.sendStatus(502);
                                                } else {
                                                    var cleanBody = JSON.parse(body);
                                                    if (cleanBody.status != 'ok' || cleanBody.access_lists.access_list.num_codes_added == 0) {
                                                        generate_code(i, number);
                                                    } else {
                                                        var new_code_schema = new Codes();
                                                        new_code_schema.code = new_code;
                                                        new_code_schema.used = 0;
                                                        new_code_schema.assignment_id = assignment._id;
                                                        new_code_schema.user_email = test_user.local.email;
                                                        new_code_schema.save(function (err) {
                                                            if (err) {
                                                                res.sendStatus(502);
                                                            } else {
                                                                generate_code(i + 1, number);
                                                            }
                                                        })
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                } else {
                    res.sendStatus(403)
                }
            }
        });
    });

    //-----------------Lista de usuarios (superadmin)-------------//
    app.get('/users_list', isLoggedIn, (req, res) => {
        var consultants = [];
        if (req.user.sa == 1) {
            UserSchema.find({}, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
                if (err) {
                    res.sendStatus(502);
                } else {
                    resultArray.forEach(result => {
                        if (result.sa == 0) {
                            var [user_id, user_domain] = result.local.email.split("@");
                            consultants.push({
                                id: result._id,
                                email: user_id.substring(0, 3) + '*****@' + user_domain,
                                admin_email: result.admin_email
                            });
                        }
                    });
                    res.render('users_list', {
                        consultants: consultants,
                        items: resultArray,
                        user: req.user
                    });
                }
            });
        } else if (req.user.sa == 2) {
            UserSchema.find({ 'admin_email': req.user.local.email }, null, { sort: { 'local.email': 1 } }, (err, resultArray) => {
                if (err) {
                    res.sendStatus(502);
                } else {
                    resultArray.forEach(result => {
                        if (result.sa == 0) {
                            consultants.push({
                                id: result._id,
                                email: result.local.email,
                                admin_email: result.admin_email
                            });
                        }
                    });
                    res.render('users_list', {
                        consultants: consultants,
                        items: resultArray,
                        user: req.user
                    });
                }
            });
        }
    });

    //-------------------- Vista de pruebas de consultores--------------------//
    app.get('/tests_list_cons/:cons_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.cons_id, null, (err, dealer) => {
            if (err) {
                res.sendStatus(502);
            } else {
                console.log(dealer);
                console.log(req.user);
                if (req.user.local.user == dealer.local.user || req.user.local.user == dealer.NSC || req.user.sa == 1) {
                    Assignments.find({ 'dealers.id': dealer._id }, null, { sort: { 'test_name': 1 } }, (err, assignments) => {
                        if (err) {
                            res.sendStatus(502);
                        } else {
                            Codes.find({ 'assignment_id': { $ne: 0 }, 'dealer': dealer.local.user }, ['code', 'assignment_id'], (err, codes) => {
                                console.log(codes);
                                var data = {};
                                data.dealer = {};
                                data.dealer.user = dealer.local.user;
                                data.dealer.id = dealer._id;
                                data.assignments = [];
                                assignments.forEach(assignment => {
                                    data.assignments.push({
                                        name: assignment.test_name,
                                        id: assignment._id,
                                        codes_used: codes.reduce((total, currentValue) => (currentValue.assignment_id == assignment._id) ? ++total : total, 0)
                                    });
                                });
                                res.render('tests_list_cons', {
                                    user: req.user,
                                    data: data
                                });
                            });
                        }
                    });
                } else {
                    res.sendStatus(403)
                }
            }
        });
    });

    //-------------------- Vista de pruebas asignadas administradores---------------------//
    app.get('/tests_list_admin/:admin_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.admin_id, null, (err, administrator) => {
            if (err) {
                res.sendStatus(502);
            } else {
                if (req.user.local.email == administrator.local.email || req.user.sa == 1) {
                    var data = {};
                    data.administrator = {
                        email: administrator.local.email
                    };
                    Assignments.find({ 'admin_email': administrator.local.email }, null, { sort: { 'test_name': 1 } }, (err, assignments) => {
                        if (err) {
                            res.sendStatus(502);
                        } else {
                            data.assignments = [];
                            assignments.forEach(assignment => {
                                var users = [];
                                users.push({
                                    email: assignment.admin_email,
                                    codes_used: assignment.codes_used,
                                    codes_max: assignment.codes_availables + assignment.codes_created + assignment.codes_used,
                                    id: administrator._id
                                });
                                assignment.users.forEach(assignment_user => {
                                    if (req.user.sa == 1) {
                                        var [email_id, email_domain] = assignment_user.email.split("@");
                                        email_id = email_id.substring(0, 3);
                                    }
                                    users.push({
                                        email: (req.user.sa == 1) ? email_id + '*****@' + email_domain : assignment_user.email,
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
                        }
                    });
                }
            }
        });
    });

    /*-------------------VISTA DE PRUEBAS-------------------------------------------*/
    app.get('/test_view/:assignment_id/:user_id', isLoggedIn, (req, res) => {
        UserSchema.findById(req.params.user_id, null, (err, test_user) => {
            if (err) {
                res.sendStatus(502);
            } else {
                if (req.user.local.user == test_user.local.user || req.user.local.user == test_user.NSC || req.user.sa == 1) {
                    Codes.find({ 'dealer': test_user.local.user }, null, { sort: { 'code': 1 } }, (err, codesArray) => {
                        if (err) {
                            res.sendStatus(502);
                        } else {
                            var data = {};
                            data.codes_created_array = [];
                            data.user = test_user;
                            data.codes_used_array = [];
                            codesArray.forEach(code => {
                                if (code.assignment_id == 0) {
                                    data.codes_created_array.push(code.code);
                                } else if (code.assignment_id == req.params.assignment_id) {
                                    data.codes_used_array.push(code.code);
                                }
                            });
                            LinkResults.find({ 'access_code_used': { $in: data.codes_used_array } }, null, { sort: { 'access_code_used': 1 } }, (err, linkresultsArray) => {
                                if (err) {
                                    res.sendStatus(502);
                                } else {
                                    /* data.categories = []; */
                                    data.results = [];
                                    var index;
                                    linkresultsArray.forEach(result => {
                                        data.results.push({
                                            access_code_used: result.access_code_used,
                                            passed: result.passed,
                                            percentage: result.knowledge_test_average,
                                            points_scored: result.knowledge_points_scored,
                                            points_available: result.knowledge_points_available,
                                            duration: result.duration,
                                            time_finished: result.time_finished,
                                            test_result_id: result._id
                                        });
                                    });
                                    /* data.categories.sort((a, b) => {
                                        if (a.name < b.name) { return -1; }
                                        if (a.name > b.name) { return 1; }
                                        return 0;
                                    }); */
                                    SummaryResults.findOne({ 'assignment_id': req.params.assignment_id }, null, (err, summary) => {
                                        if (err) {
                                            res.sendStatus(502);
                                        } else {
                                            console.log(summary);
                                            data.categories = [];
                                            summary.categories.forEach(category => {
                                                if (category.id > 83 && category.id < 91) {
                                                    data.categories.push({
                                                        name: category.name.replace("&amp;", "&"),
                                                        points_scored: category.points_scored,
                                                        points_available: category.points_available,
                                                        average: Number(category.average).toFixed(2)
                                                    });
                                                }
                                            });
                                            if (test_user.sa == 2) { //->NSC
                                                Assignments.findOne({ '_id': req.params.assignment_id, 'admin_email': test_user.local.email }, null, (err, assignment) => {
                                                    if (err) {
                                                        res.sendStatus(502);
                                                    } else {
                                                        data.link_url_id = assignment.link_url_id;
                                                        data.test_name = assignment.test_name;
                                                        data.assignment_id = assignment._id
                                                        data.codes_max = assignment.codes_created + assignment.codes_used + assignment.codes_availables;
                                                        data.codes_created = assignment.codes_created;
                                                        data.codes_used = assignment.codes_used;
                                                        res.render('test_view', {
                                                            user: req.user,
                                                            data: data,
                                                        });
                                                    }
                                                });
                                            } else if (test_user.sa == 0) { //->Dealer
                                                Assignments.findOne({ '_id': req.params.assignment_id, 'dealers.id': test_user._id }, null, (err, assignment) => {
                                                    if (err) {
                                                        res.sendStatus(502);
                                                    } else {
                                                        data.test_name = assignment.test_name;
                                                        data.assignment_id = assignment._id;
                                                        data.link_url_id = assignment.link_url_id;
                                                        data.codes_used =
                                                            data.codes_created = data.codes_created_array.length;
                                                        //data.codes_max = 0;
                                                        data.codes_used = data.codes_used_array.length;

                                                        // for (var assignment_user of assignment.users) {
                                                        //  if (assignment_user.id == test_user._id) {
                                                        //    data.codes_max = assignment_user.codes_max;
                                                        //  data.codes_created = assignment_user.codes_created;
                                                        // data.codes_used = assignment_user.codes_used;
                                                        // break;
                                                        //}
                                                        //} 
                                                        res.render('test_view', {
                                                            user: req.user,
                                                            data: data,
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    });

    /*-------------------------VISTA DE RESULTADOS------------------------*/
    app.get('/test_result/:result_id', isLoggedIn, (req, res) => {
        LinkResults.findById(req.params.result_id, null, (err, linkResult) => {
            if (err) {
                res.sendStatus(502);
            } else {
                Codes.findOne({ 'code': linkResult.access_code_used }, null, (err, code) => {
                    if (err) {
                        res.sendStatus(502);
                    } else {
                        UserSchema.findOne({ 'local.user': code.dealer }, null, (err, user) => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                SummaryResults.findOne({ 'assignment_id': code.assignment_id }, null, (err, summary) => {
                                    if (err) {
                                        res.sendStatus(502);
                                    } else {
                                        if (req.user.local.user == user.local.user || req.user.local.user == user.NSC || req.user.sa == 1) {
                                            var data = {};
                                            data.test_name = linkResult.test_name;
                                            data.access_code_used = linkResult.access_code_used;
                                            data.percentage = linkResult.knowledge_test_average;
                                            data.country_average = summary.knowledge_test_average;
                                            data.points_scored = linkResult.knowledge_points_scored;
                                            data.points_available = linkResult.knowledge_points_available;
                                            data.duration = linkResult.duration;
                                            data.time_started = linkResult.time_started;
                                            data.time_finished = linkResult.time_finished;
                                            data.category_results = linkResult.category_results.sort((a, b) => (a.name < b.name) ? -1 : 1);
                                            data.category_results = data.category_results.filter(result => (result.id > 83 && result.id < 91));
                                            summary.categories = summary.categories.sort((a, b) => (a.name < b.name) ? -1 : 1);
                                            summary.categories = summary.categories.filter(category => (category.id > 83 && category.id < 91));
                                            data.category_results.labels = [];
                                            data.category_results.data = [];
                                            data.category_results.average = [];
                                            data.category_results.forEach((result, index) => {
                                                data.category_results.labels.push(JSON.stringify(result.name).replace("&amp;", "&"));
                                                data.category_results.data.push(result.percentage);
                                                if (summary.categories[index].name == result.name) {
                                                    data.category_results.average.push(Number(summary.categories[index].average).toFixed(2));
                                                } else {
                                                    data.category_results.average.push(0);
                                                }
                                            });
                                            var questions = linkResult.questions.sort((a, b) => (a.category_id < b.category_id) ? -1 : 1);
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
                                                } else if (question.question_type == "freetext") {
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
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

    });

    //------------------------Compare tool--------------------------------//
    app.get('/compare', isLoggedIn, (req, res) => {
        if (req.user.sa == 0 || req.user.sa == 2) {
            Assignments.find((req.user.sa == 0) ? { 'dealers.id': req.user._id } : { 'admin_email': req.user.local.email }, null, { sort: { 'test_name': 1 } }, (err, assignments) => {
                if (err) {
                    res.sendStatus(502);
                } else {
                    Codes.find({ 'dealer': req.user.local.user, 'assignment_id': { $ne: 0 } }, null, { sort: { 'code': 1 } }, (err, codes) => {
                        if (err) {
                            res.sendStatus(502);
                        } else {
                            console.log(codes);
                            var datasets = [];
                            var index = -1;
                            assignments.forEach(assignment => {
                                first_flag = true;
                                codes.filter(doc => doc.assignment_id == assignment._id).forEach(code => {
                                    if (first_flag) {
                                        datasets.push({
                                            assignment_id: code.assignment_id,
                                            codes: [code.code],
                                            test_name: assignment.test_name
                                        });
                                        first_flag = false;
                                        index++;
                                    } else {
                                        datasets[index].codes.push(code.code);
                                    }
                                });
                            });
                            res.render('compare', {
                                user: req.user,
                                datasets: datasets
                            });
                        }
                    });
                }
            });

        }
    });

    app.post('/compare', isLoggedIn, (req, res) => {
        var codes = []
        for (var property in req.body) {
            codes.push(property);
        }

        LinkResults.find({ 'access_code_used': { $in: codes } }, null, { sort: { 'access_code_used': 1 } }, (err, results) => {
            if (err) {
                res.sendStatus(502);
            } else {
                var first = true;
                var data = {
                    labels: [],
                    percentages: [],
                    duration: [],
                    points_scored: [],
                    points_available: [],
                    categories: [],
                    common_categories: {
                        labels: [],
                        percentage: []
                    }
                };
                results.forEach(result => {
                    data.percentages.push(result.knowledge_test_average);
                    data.labels.push(result.access_code_used);
                    /* var time = result.duration.split(':');
                    data.duration.push(Number(time[0]) * 60 + Number(time[1])); */
                    data.points_scored.push(result.knowledge_points_scored);
                    data.points_available.push(result.knowledge_points_available)
                    var categories_labels = [];
                    var categories_percentage = [];
                    result.category_results.forEach(category => {
                        if (category.id > 83 && category.id < 91) {
                            categories_labels.push(category.name.replace("&amp;", "&"));
                            categories_percentage.push(category.percentage);
                            if (first) {
                                data.common_categories.labels.push(category.name.replace("&amp;", "&"));
                                data.common_categories.percentage.push([category.percentage])
                            }
                        }
                    });
                    if (first) {
                        first = false;
                    } else {
                        for (index = 0; index < data.common_categories.labels.length; index++) {
                            var label = data.common_categories.labels[index];
                            var i = categories_labels.findIndex(category => category == label);
                            if (i > -1) {
                                data.common_categories.percentage[index].push(categories_percentage[i]);
                            } else {
                                data.common_categories.percentage.splice(index, 1);
                                data.common_categories.labels.splice(index, 1);
                                index -= 1;
                            }
                        }
                    }
                    data.categories.push({
                        labels: categories_labels,
                        percentage: categories_percentage
                    });
                });
                for (i = 0; i < data.categories.length; i++) {
                    for (j = 0; j < data.common_categories.labels.length; j++) {
                        var k = data.categories[i].labels.findIndex(value => value == data.common_categories.labels[j]);
                        data.categories[i].labels.splice(k, 1);
                        data.categories[i].percentage.splice(k, 1);
                    }
                    if (data.categories[i].labels.length == 0) {
                        data.categories.splice(i, 1);
                        i--;
                    }
                }
                res.render('compare_results', {
                    user: req.user,
                    data: data,
                    dataset: [{
                        label: 'test',
                        data: '[100,50,10,12,85,45,14,23]',
                        backgroundColor: 'rgba(51, 88, 153, 1)',
                    }]
                });
            }
        });

    });
}