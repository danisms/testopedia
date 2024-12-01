// IMPORT MODULES
const mongodb = require('../../models/db/connect-db');

const { body, validationResult } = require('express-validator');

const validate = {};

// VALIDATE NEW User VALUES
validate.addNewUserRules = () => {
    // Enum checks
    const accountType = ['user', 'contributor'];
    return [
        body('firstname')
        .trim()
        .escape()
        .isString()
        .notEmpty()
        .isLength({min: 2})
        .withMessage("firstname should not be empty"),

        body('lastname')
        .trim()
        .isString()
        .notEmpty()
        .isLength({min: 2})
        .withMessage("firstname should not be empty"),

        body('email')
        .custom( async (value, { req }) => {
            const emailValue = value.trim();
            if (emailValue == null || emailValue == '') {
                throw new Error('Email should not be empty');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                throw new Error("invalid email format: please enter a valid email address e.g 'example@example.com'");
            }

            // check if email doesn't already exist in db
            try {
                const usersDb = mongodb.getDb().db('testopidia').collection('users');
                const userData = await usersDb.findOne({ email: emailValue });
                console.log(userData);  // for visualizing and testing purpose
                if (userData) {
                    // authenticate using accountType
                    throw new Error("email already exist");
                }
            } catch (err) {
                throw new Error(err);
            }

            return true;
        }),

        body('username')
        .custom( async (value, { req }) => {
            const usernameValue = value.trim();
            if (usernameValue == null || usernameValue == '') {
                throw new Error('Username should not empty');
            }

            if (usernameValue.length < 6) {
                throw new Error("username should not be less than 6 characters");
            }

            // check if username doesn't already exist in db
            try {
                const usersDb = mongodb.getDb().db('testopidia').collection('users');
                const userData = await usersDb.findOne({ username: usernameValue });
                console.log(userData);  // for visualizing and testing purpose
                if (userData) {
                    // authenticate using accountType
                    throw new Error("username already exist");
                }
            } catch (err) {
                throw new Error(err);
            }

            return true;
        }),

        body('bio')
        .trim()
        .isString(),

        body('password')
        .trim()
        .notEmpty()
        .isLength({min: 7})
        .isAlphanumeric()
        .withMessage('password is required, with a minimum of 7 alpha-numeric characters'),

        body('accountType')
        .trim()
        .notEmpty()
        .isIn(accountType)
        .withMessage(`account type must be at least one of the two ${accountType[0]} or ${accountType[1]}`)

    ]
}
// CHECK NEW User VALIDATION
validate.checkNewUser = (req, res, next) => {
    let errors = [];
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}

// VALIDATE UPDATE User
validate.updateUserRules = () => {
    return [
        body('firstname')
        .trim()
        .escape()
        .isString()
        .notEmpty()
        .isLength({min: 2})
        .withMessage("firstname should not be empty"),

        body('lastname')
        .trim()
        .isString()
        .notEmpty()
        .isLength({min: 2})
        .withMessage("firstname should not be empty"),

        body('email')
        .custom( async (value, { req }) => {
            const emailValue = value.trim();
            if (emailValue != null) {
                if (emailValue == '') {
                    req.body.email = null;  // set email to null;
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(emailValue)) {
                        throw new Error("invalid email format: please enter a valid email address e.g 'example@example.com'");
                    }

                    // check if email was changed
                    if (req.session.user.email != emailValue) {
                        // check if email doesn't already exist in db
                        try {
                            const usersDb = mongodb.getDb().db('testopidia').collection('users');
                            const userData = await usersDb.findOne({ email: emailValue });
                            console.log(userData);  // for visualizing and testing purpose
                            if (userData) {
                                // authenticate using accountType
                                throw new Error("email already exist");
                            }
                        } catch (err) {
                            throw new Error(err);
                        }
                    }
                }
            }

            return true;
        }),

        body('username')
        .custom( async (value, { req }) => {
            const usernameValue = value.trim();
            if (usernameValue != null) {
                if (usernameValue == '') {
                    req.body.username = null;  // set username to null;
                } else {
                    if (usernameValue.length < 6) {
                        throw new Error("username should not be less than 6 characters");
                    }

                    // check if username was changed
                    if (req.session.user.username != usernameValue) {
                        // check if username doesn't already exist in db
                        try {
                            const usersDb = mongodb.getDb().db('testopidia').collection('users');
                            const userData = await usersDb.findOne({ username: usernameValue });
                            console.log(userData);  // for visualizing and testing purpose
                            if (userData) {
                                // authenticate using accountType
                                throw new Error("username already exist");
                            }
                        } catch (err) {
                            throw new Error(err);
                        }
                    }
                }
            }

            return true;
        }),

        body('profilePhotoUrl')
        .custom((value, { req }) => {
            const imageUrlValue = value.trim();
            if (imageUrlValue != null) {
                if (imageUrlValue == '') {
                    req.body.profilePhotoUrl = null;  // set email to null;
                } else {
                    try {
                        new URL(imageUrlValue);
                    } catch(err) {
                        throw new Error('invalid url format: please provide a valid url for your profile picture');
                    }
                }
            }
            return true;
        }),

        body('password')
        .custom((value, { req }) => {
            const passwordValue = value.trim();
            if (passwordValue != null) {
                if (passwordValue == '') {
                    req.body.password = null;  // set email to null;
                } else {
                    const passwordRegex = /^[a-zA-Z0-9]{7,}$/;
                    if (!passwordRegex.test(passwordValue)) {
                        throw new Error("password must be at least 7 characters long and aplphanumeric.");
                    }
                }
            }

            return true;
        }),

        body('bio')
        .trim(),
    ]
}

validate.checkUpdateUser = (req, res, next) => {
    let errors = [];
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}


module.exports = validate;