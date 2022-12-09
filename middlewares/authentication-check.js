module.exports = {
    loginchecked: (req, res, next) => {
        if (req.session.loggedIn) {
            res.redirect('/');
        } else {
            next()
        }
    },

    userChecked: (req, res, next) => {
        if (req.session.loggedIn) {
            next()
        } else {
            res.redirect('/login');
        }
    },

    AdminLoginCheck : (req,res,next)=>{
        if (req.session.AdminloggedIn) {
            res.render('Admin/admin-home',{admin: true})
        } else {
            next()
        }
    },

    AdminFunActionCheck : (req,res,next)=>{
        console.log(req.session.AdminloggedIn,"---------------req.session.AdminloggedIn");
        if (req.session.AdminloggedIn) {
            next()
        } else {
            res.render('Admin/admin-login',{not: true});
        }
    }
}