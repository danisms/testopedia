// IMPORT REQUIRED MODULES
const mongodb = require('../models/db/connect-db');
// const chunks = require('../utilities/chunks');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { logError } = require('../error-handling/errorHandler');
const { updateAQuestion } = require('./question');


// CREATE question CONTROLLER OBJECT HOLDER
const loginController = {};


// login options
loginController.loginOptions = async function (req, res) {
    //#swagger.tags=['Login/Signup']
    const options = [
        {
            headerTitle:'Login Menu',
            instruction: 'Please select one from the login options',
            userOption : {
                user: `http://${process.env.SERVER_HOST}/${process.env.SERVER_PORT}/login/user`,
                github: 'http://login/github'
            }
        },
        {
            headerTitle:'Sign-up Menu',
            instruction: 'Please select one from the sign-up options',
            userOption : {
                user: `http://${process.env.SERVER_HOST}/${process.env.SERVER_PORT}/api-docs`,
                github: 'http://login/github'
            }
        }
    ];

    res.send(options);
}

// login user instruction
loginController.loginInstruction = async function (req, res) {
    const instructionObject = {
        instruction: "Goto the url below and find the post: login/user section in the Api Document. Input your username and password to login.",
        url: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api-docs`
    }
    return res.send(instructionObject);
}


// traditional login (username and password)
loginController.loginUser = async function (req, res) {
    //#swagger.tags=['Login/Signup']
    // get values
    const username = req.body.username;
    const password = req.body.password;

    // get account with username or email
    try {
        const usersDb = mongodb.getDb().db('testopidia').collection('users');
        // check for username
        const findUsername = await usersDb.findOne({ username: username});
        console.log(`Username Found - User: ${JSON.stringify(findUsername)}`);  // for testing purpose
        if (findUsername) {
            // login user
            return loginUser(password, findUsername);
        }

        // check if email was entered instead
        const findEmail = await usersDb.findOne({ email: username});
        console.log(`Email Found - User: ${JSON.stringify(findEmail)}`);  // for testing purpose
        if (findEmail) {
            // login user
           return loginUser(password, findEmail);
        }

        // if username is not found
        return res.status(404).json({ message: 'username/email you entered does not correspond with any user. Please, enter a valid username.' });

    } catch (err) {
        logError(err);
        return res.status(500).json(err);
    }

    // compare password and set jwt cookie as needed
    async function loginUser(password, userData) {
        try {
            if (await bcrypt.compare(password, userData.password)) {
                delete userData.password;  // remove password returned data -- for security reasons
                userData.displayName = `${userData.firstname.slice(0, 1).toUpperCase()}${userData.firstname.slice(1)} ${userData.lastname.slice(0, 1).toUpperCase()}${userData.lastname.slice(1)}`;  // add display name;
                const accessToken = jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 });
                // set cookie
                if (process.env.NODE_ENV == 'development') {
                    res.cookie("jwt", accessToken, {httpOnly: true, maxAge: 3600 * 1000 });
                } else {
                    res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 });
                }
                console.log(`USER DATA: ${JSON.stringify(userData)}`);  // for testing purpose
                req.session.user = userData;
                return res.redirect("/");
            } else {
                return res.status(400).json({message: 'Invalid Password. Please check your passoword and try again.'});
            }
        } catch (err) {
            logError(err);
            return res.status(500).json(err);
        }
    }
}


// github authenticator login
loginController.authenticateGithub = (req, res) => {
    //#swagger.tags=['Login/Signup']
    // NOT IN USE FOR NOW.
}

// github callback authenticate login
loginController.authenticateGithubCallBack = (req, res) => {
    //#swagger.tags=['Login/Signup']
    // set JWT cookie
    const accessToken = jwt.sign(req.user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 });
    if (process.env.NODE_ENV == 'development') {
        res.cookie("jwt", accessToken, {httpOnly: true, maxAge: 3600 * 1000 });
    } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 });
    }

    console.log(`CURRENT USER OBJECT: ${JSON.stringify(req.user)}`);
    req.session.user = req.user;
    res.redirect('/');
}


// EXPORT CONTROLLER
module.exports = loginController;