module.exports = (app, passport) => {

    app.get('/', (req, res) => {
        res.render('index');
    });

    /*------------- Login View ------------------*/
    app.get('/login', (req, res) => {
        res.render('login', {
            message: req.flash('loginMessage')
        });
    });

    /*----------------- LOGIN ------------------*/
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }));

    /*------------- Registro View ------------------*/
    app.get('/signup', (req, res) => {
        res.render('signup', {
            message: req.flash('signupMessage')
        });
    });

    /*----------------- REGISTRO POST---------------*/
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    /*--------------- Despligue Perfil -------------*/
    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile', {
            user: req.user
        });
    });

    /*--------------- Cerrar Sesión ---------------*/
    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    /*--------------- Validación Login -------------*/
    function isLoggedIn(req, res, next) {
        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect('/');
    }
    
};