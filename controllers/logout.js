const logoutController = {};

logoutController.logOutUser = function(req, res, next) {
    //#swagger.tags=['Logout']
    req.logout(function(err) {
        if (err) { return next(err); }
        // clear jwt cookie
        try {
            if (process.env.NODE_ENV === 'development') {
                res.clearCookie("jwt", {
                    httpOnly: true,  // To prevent client-side javascript access
                    sameSite: true,  // For Protecting against CSRF attacks
                })
            } else {
                res.clearCookie("jwt", {
                    httpOnly: true,  // To prevent client-side javascript access
                    secure: true,  // Make Sure Cookie is only sent through HTTPS
                    sameSite: true,  // For Protecting against CSRF attacks
                })
            }
            return res.redirect("/")  // redirect to homepage
        } catch (error) {
            console.error(`Logout Error: ${error}`)
            return res.status(500).json({ message: error });
        }
    });
}


// EXPORT MODULE
module.exports = logoutController;