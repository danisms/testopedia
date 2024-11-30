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
        .trim()
        .isString()
        .isEmail()
        .withMessage('please enter a valid email address e.g "example@example.com"'),
        // .custom((value, { req }) => {
        //     return true;
        // }),

        body('bio')
        .trim()
        .isString(),
        
        body('username')
        .trim()
        .isString()
        .isnot

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
    // Enum checks
    const levels = ['basic', 'intermediate', 'advance', 'expert'];
    const types = ['mc', 'text', 'file', 'verbal'];
    const mcUserRegex = /^.+mc\[(.*?)]$/;  // mc User format
    return [
        body('subject')
        .trim()
        .escape()
        .isString()
        .notEmpty()
        .isLength({min: 3})
        .withMessage("subject should not be empty"),

        body('level')
        .trim()
        .isIn(levels)
        .withMessage(`level must be of one of: ${levels.join(', ')};`),

        body('type')
        .trim()
        .isIn(types)
        .withMessage(`type must be of type: ${types.join(', ')}; Note: mc stands for multiple-choice`),

        body('UserInfo')
        .trim()
        .escape()
        .isString()
        .notEmpty()
        .isLength({min: 1})
        .withMessage("User info should not be empty"),

        body('User')
        .trim()
        .isString()
        .notEmpty()
        .isLength({min: 3})
        .withMessage("User is required!")
        .custom((value, { req }) => {
            // A Custom Check to Check Type Inorder to Validate The User field
            console.log(`User Value: ${value}\nUser Data-type: ${typeof(value)}`);  // for testing purpose

            const { type } = req.body;  // get the request 'type' field value from the body
            // appling extral check to make sure type is passed, becaused it's required for the validation
            if (!type) {
                throw new Error('Type is required for User validation.');
            }

            // Validate Based On 'type'
            // check for 'mc' type
            if (type == types[0]){
                console.log('Mc User Type Detected');  // for debugging purpose
                try {
                    const UserFormat = value.split('mc[')
                    console.log(`UserFormat: ${UserFormat}`);  // for debugging purpose
                    // using a regular expression to match the User format "User ms[v1, v2, ...]" with nothing else after the closed square bracket
                    const matchMcUserFormat = value.match(mcUserRegex);
                    console.log(`Match Format: ${matchMcUserFormat}`);  // for debugging purpose

                    if (!matchMcUserFormat || UserFormat.length != 2) {
                        throw new Error(`invalid User format for type: ${types[0]}\nformat must be of: "User mc['multiple-choice', 'multiple-choice'...]"`);
                    }
                    
                    if (UserFormat[1].split(',').length < 2) {
                        throw new Error(`invalid User format for type: ${types[0]}\nUser must have at least two multiple choice answers in User`);
                    }
                } catch (err) {
                    throw new Error(err);
                }
            }

            return true;
        }),

        body('answer')
        .custom((value, { req }) => {
            // A Custom Check to Check Type Inorder to Validate The answer field

            const { type } = req.body;  // get the request 'type' field value from the body
            // appling extral check to make sure type is passed, becaused it's required for the validation
            if (!type) {
                throw new Error('Type is required for value validation.');
            }

            // Validate Based On 'type'
            switch (type) {
                // validate 'mc' type
                // multiple-choice User must be an answer of dataType "int" or "array"
                // the character cannot be more than the length of the multiple-choice answers suplied in the array of answers provided in the User.
                case types[0]:
                    // validate User format for type 'mc'
                    const { User } = req.body;  // get User
                    let UserFormat;
                    try {
                        UserFormat = User.split('mc[');  // for performing check
                        // using a regular expression to match the User format "User ms[v1, v2, ...]" with nothing else after the closed square bracket
                        const matchMcUserFormat = User.match(mcUserRegex);
                        if (!matchMcUserFormat || UserFormat.length != 2) {
                            throw new Error(`invalid User format for type: ${types[0]}\nformat must be of: "User mc['multiple-choice', 'multiple-choice'...]"`);
                        }
                        // confirm the choice answers is more than two(2) values in the array
                        if (UserFormat[1].split(',').length < 2) {
                            throw new Error(`invalid User format for type: ${types[0]}\nUser must have at least two multiple choice answers in User`);
                        }
                    } catch (err) {
                        throw new Error(err);
                    }
                    // use validated User format to validate answer
                    try {
                        // checks
                        if (!Number.isInteger(parseInt(value)) && !Array.isArray(value)) {
                            throw new Error(`answer must be a number or array (with character/s not greater than the multiple choice answer/s provided) for type ${types[0]}`);
                        } 
                        if (Number.isInteger(parseInt(value))) {
                            // number cannot be more than the provided multiple-choice answer given in the User
                            if (parseInt(value) >= UserFormat[1].split(',').length) {
                                throw new Error(`invalid answer for type: ${types[0]}: answer must be an index value of the provided multiple-choice answers`);
                            }
                        }
                        if (Array.isArray(value)) {
                            // the length of the array cannot be more than the length of multiple-choice answer array
                            if (value.length >= UserFormat[1].split(',').length) {
                                throw new Error(`invalid answer for type: ${types[0]}: list answers must not be more than the provided multiple-choice answers`);
                            }

                            // each number in the array can not be more than the length of the multiple-choice array
                            value.forEach((item) => {
                                if (!Number.isInteger(parseInt(item)) || (parseInt(item) >= UserFormat[1].split(',').length)) {
                                    throw new Error(`invalid answer for type '${types[0]}': list answers must be a number and the number must be a list index value of the provided multiple-choice answers`);
                                }
                            })
                                
                            // numbers in the array cannot repeat (Set make sure that every value in the value array is unique)
                            if (new Set(value).size !== value.length) {
                                throw new Error(`invalid answer for type: ${types[0]}: list answers must not repeat`);
                            }
                        }
                    } catch (err) {
                        throw new Error(err);
                    }
                    break;
                // validate 'text' type
                // text Users must be an answer of string and not empty
                case types[1]:
                    if (typeof value != 'string' && value.trim().length < 1) {
                        throw new Error(`Answer must be a string and should not be empty for type ${types[1]}`);
                    }
                    break;
                // validate 'file' type
                // file User requires the answer to be link to the uploaded file
                case types[2]:
                    try {
                        new URL(value);
                    } catch(err) {
                        throw new Error(`Invalid url format. Answer must be a valid url to the uploaded file (IMAGE/PDF) for type ${types[2]}`);
                    }
                    break;
                // validate verbal type
                // varbal User requires the answer to be a link to the uploaded audio file.
                case types[3]:
                    try {
                        new URL(value);
                    } catch(err) {
                        throw new Error(`Invalid url format. Answer must be a valid url to the uploaded audio file (MP3/WAV) for type ${types[3]}`);
                    }
                    break;
                // a default response error when no type was used
                default:
                    throw new Error('Invalid type provided');
            }

            return true;
        }),
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