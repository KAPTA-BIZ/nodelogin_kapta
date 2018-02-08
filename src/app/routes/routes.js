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
var GroupSchema = require('../models/group.js');
var get_all_available = require('../../classmarker/all');
var get_links = require('../../classmarker/links');
var get_groups = require('../../classmarker/groups');
var storageLinkTest = require('./storage/StorageLinkTest');
var storageTest = require('./storage/StorageTest');
var storageHook = require('./storage/StorageHook');
var storageTestHook = require('./storage/StorageTestHook');

mongoose.Promise = global.Promise;

module.exports = (app, passport) => {



    /*------------ JOIN PROJECT START---------------*/ 

    app.get('/', (req,res,next) => {
        //res.render('home/index.jsx', {foo: 'bar'});
        res.render('index');
      });


    app.post('/', (req,res,next) => {
        var jsonData = req.body;
        var secret = 'Yu92voJl59q4Bwp';
        var hash = crypto.createHmac('sha256', secret).update('X-Classmarker-Hmac-Sha256').digest('hex');

        if(hash){
            res.sendStatus(200);
            storageTestHook(jsonData);
            storageHook(jsonData);
          }else{
            res.sendStatus(500);
          }
    });

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


    app.get ('/get_all_available', function (req, res) {
        request (get_all_available, function (error, response, body) {
            if (!error && response.statusCode === 200) {
              var cleanBody = JSON.parse(body);
              res.json(cleanBody);
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


    /*------------ JOIN PROJECT END ----------------*/ 

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


    /*----------------- REGISTRO POST---------------*/
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    /*--------------- VIEW PERFIL -------------*/
    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile', {
            user: req.user
        });
    });

    /*---------------- LOGOUT -----------------*/
    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    /*----------- LOGIN VALIDATION -------------*/
    function isLoggedIn(req, res, next) {
        if(req.isAuthenticated()){
            return next(); 
        }
        return  res.send('Debe estar autenticado');
        //Next: Crear View para decir que debe estar autenticado
        //return res.redirect('/');
    }

    /* ----------- LOGIN SUPER ADMIN ------------*/
    //Autentica a SuperAdmin comprobando que req.user.sa exista
    
    app.get('/signup', isLoggedIn, (req, res) => {
            if(req.user.sa){
            res.render('signup', {
                user: req.user,
                message: req.flash('signupMessage')
            });
            console.log("Si es super");
            }else{
            res.send("NO");
            console.log("No autorizado");
        }
    });
};