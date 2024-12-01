// IMPORT MODULES
const mongodb = require('../models/db/connect-db');
const jwt = require("jsonwebtoken");
const chunks = require('../utilities/chunks');

// CONSTANTS
const accountTypes = ['user', 'contributor', 'admin', 'fullControl'];
const contributorRight = [accountTypes[1], accountTypes[2], accountTypes[3]];
const adminRight = [accountTypes[2], accountTypes[3]];
const fullControlRight = [accountTypes[3]];

const authenticate = {};

authenticate.checkLogin = (req, res, next) => {
    if (req.session.user) {
        next()
    } else {
        return res.status(401).json({ message: "You are not logged in. Please login to procceed." });
    }
}

// authenticate for a contributorRight
authenticate.isAuthenticatedContributor = async (req, res, next) => {
    // Using Session To Authenticate User Right
    // console.log(`Session User: ${req.session.user}`);  // for testing purpose
    // if (!contributorRight.includes(req.session.user.accountType)) {
    //     return res.status(401).json({ message: "You are not authorized to perform this action. You must be a contributor to do this." });
    // }

    // Using Data From DB to Authenticate User Right for real-time check incase of update of accountType (add async to the function)
    try {
        const userId = chunks.validObjectId(req.session.user._id, true, true);
        const usersDb = mongodb.getDb().db('testopidia').collection('users');
        const userData = await usersDb.findOne({ _id: userId });
        console.log(userData);  // for visualizing and testing purpose
        if (userData) {
            // authenticate using accountType
            if (!contributorRight.includes(userData.accountType)) {
                return res.status(401).json({ message: "You are not authorized to perform this action. You must be a contributor to do this." });
            }
        } else {
            return res.status(400).json({ message: 'unable to get user accountType' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err });
    }

    next();
}

// authenticate user adminRight
authenticate.isAuthenticatedAdmin = async (req, res, next) => {
    // console.log(req.session.user);  // for testing purpose
    // if (!adminRight.includes(req.session.user.accountType)) {
    //     return res.status(401).json({ message: "Require admin right: You don't have access." });
    // }
    // console.log(`Session User Plain: ${JSON.stringify(req.session.user)}`);

    // Using Data From DB to Authenticate User Right for real-time check incase of update of accountType (add async to the function)
    try {
        const userId = chunks.validObjectId(req.session.user._id, true, true);
        const usersDb = mongodb.getDb().db('testopidia').collection('users');
        const userData = await usersDb.findOne({ _id: userId });
        console.log(userData);  // for visualizing and testing purpose
        if (userData) {
            // authenticate using accountType
            if (!adminRight.includes(req.session.user.accountType)) {
                return res.status(401).json({ message: "Require admin right: You don't have access." });
            }
        } else {
            return res.status(400).json({ message: 'unable to get user accountType' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err });
    }

    next();
};

// authenticate for fullControlRight
// authenticate user admin right (accountType)
authenticate.isAuthenticatedFullControl = async (req, res, next) => {
    // console.log(req.session.user);  // for testing purpose
    // if (!fullControlRight.includes(req.session.user.accountType)) {
    //     return res.status(401).json({ message: "Require full-control right: You don't have access." });
    // }
    // console.log(`Session User Plain: ${JSON.stringify(req.session.user)}`);

    // Using Data From DB to Authenticate User Right for real-time check incase of update of accountType (add async to the function)
    try {
        const userId = chunks.validObjectId(req.session.user._id, true, true);
        const usersDb = mongodb.getDb().db('testopidia').collection('users');
        const userData = await usersDb.findOne({ _id: userId });
        console.log(userData);  // for visualizing and testing purpose
        if (userData) {
            // authenticate using accountType
            if (!fullControlRight.includes(req.session.user.accountType)) {
                return res.status(401).json({ message: "Require full-control right: You don't have access." });
            }
        } else {
            return res.status(400).json({ message: 'unable to get user accountType' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err });
    }

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
                    res.clearCookie("jwt")
                    return res.status(400).json({ message: "Please login to proceed." });
                }
                console.log(`JWT USER: ${JSON.stringify(user)}`);  // for testing purpose;
                req.session.user = user
                next()
            })
    } else {
        next()
    }
}

module.exports = authenticate;