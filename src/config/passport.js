const LocalStrategy = require('passport-local').Strategy;
const User = require('../app/models/user');
const Assignments = require('../app/models/Assignments');



module.exports = function (passport) {
    passport.serializeUser(function (user, done) { // NOTA: done kes el callbac
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    /*------------- Registro ------------------*/

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
        function (req, email, password, done) {
            if (req.body.validatePwd != password) { return done(null, false, req.flash('signupMessage', 'Las contraseñas no coinciden')); }
            User.findOne({ 'local.email': email }, function (err, user) {
                if (err) { return done(err); }
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'Email ya registrado'));
                } else {
                    var newUser = new User();
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    if (req.user.sa == 1) {
                        if (req.body.userType == 'Administrador')
                            newUser.sa = '2';
                        else
                            newUser.sa = '0';
                    } else if (req.user.sa == 2) {
                        newUser.sa = '0';
                        newUser.admin_email = req.user.local.email
                    }
                    newUser.save(function (err) {
                        if (err) { res.sendStatus(502); }


                        //////////////////////////////////////////////////
                        Assignments.updateMany({ 'admin_email': req.user.local.email }, {
                            $push: {
                                'users': {
                                    id: newUser._id,
                                    email: newUser.local.email,
                                    codes_max: 0,
                                    codes_created: 0,
                                    codes_used: 0,
                                    created_by: req.user.local.email
                                }
                            }
                        }, err => {
                            if (err) {
                                res.sendStatus(502);
                            } else {
                                return done(null, newUser);
                            }
                        });

                        ////////////////////////////////////////////////

                    });
                }
            })
        }));

    /*--------------- Login ------------------*/

    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
        function (req, email, password, done) {
            User.findOne({ 'local.email': email }, function (err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, req.flash('loginMessage', 'User not found'));
                }
                if (!user.validatePassword(password)) {
                    return done(null, false, req.flash('loginMessage', 'Incorrect password'));
                }
                return done(null, user);
            })
        }));

}