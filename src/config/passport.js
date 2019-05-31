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
            if (req.body.validatePwd != password) { return done(null, false, req.flash('signupMessage', 'Passwords do not match')); }
            User.findOne({ 'local.user': email }, function (err, user) {
                if (err) { return done(err); }
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'Email already registered'));
                } else {
                    var newUser = new User();
                    newUser.local.user = email;
                    newUser.local.password = newUser.generateHash(password);
                    if (req.user.sa == 1) {
                        if (req.body.userType == 'Administrador')
                            newUser.sa = '2';
                        else
                            newUser.sa = '0';
                    } else if (req.user.sa == 2) {
                        newUser.sa = '0';
                        newUser.NSC = req.user.local.user
                    }
                    newUser.save(function (err) {
                        if (err) { res.sendStatus(502); }


                        //////////////////////////////////////////////////
                        Assignments.updateMany({ 'NSC': req.user.local.user }, {
                            $push: {
                                'dealers': {
                                    id: newUser._id,
                                    dealer: newUser.local.user
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
        usernameField: 'user',
        passwordField: 'password',
        passReqToCallback: true
    },
        function (req, user, password, done) {
            User.findOne({ 'local.user': user }, function (err, user) {
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