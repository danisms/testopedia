const authenticate = {};

authenticate.isAuthenticated = (req, res, next) => {
    console.log(`Session User: ${req.session.user}`);
    if (req.session.user === undefined) {
        return res.status(401).json("You don't have access.");
    }
    console.log(`Session User Plain: ${JSON.stringify(req.session.user)}`);
    next();
};

/* ****************************************************
* Middleware to check token validity
**************************************************** */
authenticate.checkJWTToken = (req, res, next) => {
    if (req.cookies.jwt) {
        jwt.verify (
            req.cookies.jwt,
            process.env.ACCESS_TOKEN_SECRET,
            function (err, user) {
                if (err) {
                    req.flash("Please login")
                    res.clearCookie("jwt")
                    return res.redirect("/account/login")
                }
                res.session.user = user
                next()
            })
    } else {
        next()
    }
}

module.exports = authenticate;