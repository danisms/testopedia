const { body, validationResult } = require('express-validator');

const validate = {};

// VALIDATE NEW QUESTION VALUES
validate.addNewQuestionRules = () => {
    // Enum checks
    const levels = ['basic', 'intermediate', 'advance', 'expert'];
    const types = ['mc', 'text', 'file', 'verbal'];
    const mcQuestionRegex = /^.+mc\[(.*?)]$/;  // mc question format
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

        body('questionInfo')
        .trim()
        .escape()
        .isString()
        .notEmpty()
        .isLength({min: 1})
        .withMessage("question info should not be empty"),

        body('question')
        .trim()
        .isString()
        .notEmpty()
        .isLength({min: 3})
        .withMessage("question is required!")
        .custom((value, { req }) => {
            // A Custom Check to Check Type Inorder to Validate The question field
            console.log(`Question Value: ${value}\nQuestion Data-type: ${typeof(value)}`);  // for testing purpose

            const { type } = req.body;  // get the request 'type' field value from the body
            // appling extral check to make sure type is passed, becaused it's required for the validation
            if (!type) {
                throw new Error('Type is required for question validation.');
            }

            // Validate Based On 'type'
            // check for 'mc' type
            if (type == types[0]){
                console.log('Mc Question Type Detected');  // for debugging purpose
                try {
                    const questionFormat = value.split('mc[')
                    console.log(`QuestionFormat: ${questionFormat}`);  // for debugging purpose
                    // using a regular expression to match the question format "question ms[v1, v2, ...]" with nothing else after the closed square bracket
                    const matchMcQuestionFormat = value.match(mcQuestionRegex);
                    console.log(`Match Format: ${matchMcQuestionFormat}`);  // for debugging purpose

                    if (!matchMcQuestionFormat || questionFormat.length != 2) {
                        throw new Error(`invalid question format for type: ${types[0]}\nformat must be of: "question mc['multiple-choice', 'multiple-choice'...]"`);
                    }
                    
                    if (questionFormat[1].split(',').length < 2) {
                        throw new Error(`invalid question format for type: ${types[0]}\nquestion must have at least two multiple choice answers in question`);
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
                // multiple-choice question must be an answer of dataType "int" or "array"
                // the character cannot be more than the length of the multiple-choice answers suplied in the array of answers provided in the question.
                case types[0]:
                    // validate question format for type 'mc'
                    const { question } = req.body;  // get question
                    let questionFormat;
                    try {
                        questionFormat = question.split('mc[');  // for performing check
                        // using a regular expression to match the question format "question ms[v1, v2, ...]" with nothing else after the closed square bracket
                        const matchMcQuestionFormat = question.match(mcQuestionRegex);
                        if (!matchMcQuestionFormat || questionFormat.length != 2) {
                            throw new Error(`invalid question format for type: ${types[0]}\nformat must be of: "question mc['multiple-choice', 'multiple-choice'...]"`);
                        }
                        // confirm the choice answers is more than two(2) values in the array
                        if (questionFormat[1].split(',').length < 2) {
                            throw new Error(`invalid question format for type: ${types[0]}\nquestion must have at least two multiple choice answers in question`);
                        }
                    } catch (err) {
                        throw new Error(err);
                    }
                    // use validated question format to validate answer
                    try {
                        // checks
                        if (!Number.isInteger(parseInt(value)) && !Array.isArray(value)) {
                            throw new Error(`answer must be a number or array (with character/s not greater than the multiple choice answer/s provided) for type ${types[0]}`);
                        } 
                        if (Number.isInteger(parseInt(value))) {
                            // number cannot be more than the provided multiple-choice answer given in the question
                            if (parseInt(value) >= questionFormat[1].split(',').length) {
                                throw new Error(`invalid answer for type: ${types[0]}: answer must be an index value of the provided multiple-choice answers`);
                            }
                        }
                        if (Array.isArray(value)) {
                            // the length of the array cannot be more than the length of multiple-choice answer array
                            if (value.length >= questionFormat[1].split(',').length) {
                                throw new Error(`invalid answer for type: ${types[0]}: list answers must not be more than the provided multiple-choice answers`);
                            }

                            // each number in the array can not be more than the length of the multiple-choice array
                            value.forEach((item) => {
                                if (!Number.isInteger(parseInt(item)) || (parseInt(item) >= questionFormat[1].split(',').length)) {
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
                // text questions must be an answer of string and not empty
                case types[1]:
                    if (typeof value != 'string' && value.trim().length < 1) {
                        throw new Error(`Answer must be a string and should not be empty for type ${types[1]}`);
                    }
                    break;
                // validate 'file' type
                // file question requires the answer to be link to the uploaded file
                case types[2]:
                    try {
                        new URL(value);
                    } catch(err) {
                        throw new Error(`Invalid url format. Answer must be a valid url to the uploaded file (IMAGE/PDF) for type ${types[2]}`);
                    }
                    break;
                // validate verbal type
                // varbal question requires the answer to be a link to the uploaded audio file.
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
// CHECK NEW QUESTION VALIDATION
validate.checkNewQuestion = (req, res, next) => {
    let errors = [];
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}

// VALIDATE UPDATE QUESTION
validate.updateQuestionRules = () => {
    // Enum checks
    const levels = ['basic', 'intermediate', 'advance', 'expert'];
    const types = ['mc', 'text', 'file', 'verbal'];
    const mcQuestionRegex = /^.+mc\[(.*?)]$/;  // mc question format
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

        body('questionInfo')
        .trim()
        .escape()
        .isString()
        .notEmpty()
        .isLength({min: 1})
        .withMessage("question info should not be empty"),

        body('question')
        .trim()
        .isString()
        .notEmpty()
        .isLength({min: 3})
        .withMessage("question is required!")
        .custom((value, { req }) => {
            // A Custom Check to Check Type Inorder to Validate The question field
            console.log(`Question Value: ${value}\nQuestion Data-type: ${typeof(value)}`);  // for testing purpose

            const { type } = req.body;  // get the request 'type' field value from the body
            // appling extral check to make sure type is passed, becaused it's required for the validation
            if (!type) {
                throw new Error('Type is required for question validation.');
            }

            // Validate Based On 'type'
            // check for 'mc' type
            if (type == types[0]){
                console.log('Mc Question Type Detected');  // for debugging purpose
                try {
                    const questionFormat = value.split('mc[')
                    console.log(`QuestionFormat: ${questionFormat}`);  // for debugging purpose
                    // using a regular expression to match the question format "question ms[v1, v2, ...]" with nothing else after the closed square bracket
                    const matchMcQuestionFormat = value.match(mcQuestionRegex);
                    console.log(`Match Format: ${matchMcQuestionFormat}`);  // for debugging purpose

                    if (!matchMcQuestionFormat || questionFormat.length != 2) {
                        throw new Error(`invalid question format for type: ${types[0]}\nformat must be of: "question mc['multiple-choice', 'multiple-choice'...]"`);
                    }
                    
                    if (questionFormat[1].split(',').length < 2) {
                        throw new Error(`invalid question format for type: ${types[0]}\nquestion must have at least two multiple choice answers in question`);
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
                // multiple-choice question must be an answer of dataType "int" or "array"
                // the character cannot be more than the length of the multiple-choice answers suplied in the array of answers provided in the question.
                case types[0]:
                    // validate question format for type 'mc'
                    const { question } = req.body;  // get question
                    let questionFormat;
                    try {
                        questionFormat = question.split('mc[');  // for performing check
                        // using a regular expression to match the question format "question ms[v1, v2, ...]" with nothing else after the closed square bracket
                        const matchMcQuestionFormat = question.match(mcQuestionRegex);
                        if (!matchMcQuestionFormat || questionFormat.length != 2) {
                            throw new Error(`invalid question format for type: ${types[0]}\nformat must be of: "question mc['multiple-choice', 'multiple-choice'...]"`);
                        }
                        // confirm the choice answers is more than two(2) values in the array
                        if (questionFormat[1].split(',').length < 2) {
                            throw new Error(`invalid question format for type: ${types[0]}\nquestion must have at least two multiple choice answers in question`);
                        }
                    } catch (err) {
                        throw new Error(err);
                    }
                    // use validated question format to validate answer
                    try {
                        // checks
                        if (!Number.isInteger(parseInt(value)) && !Array.isArray(value)) {
                            throw new Error(`answer must be a number or array (with character/s not greater than the multiple choice answer/s provided) for type ${types[0]}`);
                        } 
                        if (Number.isInteger(parseInt(value))) {
                            // number cannot be more than the provided multiple-choice answer given in the question
                            if (parseInt(value) >= questionFormat[1].split(',').length) {
                                throw new Error(`invalid answer for type: ${types[0]}: answer must be an index value of the provided multiple-choice answers`);
                            }
                        }
                        if (Array.isArray(value)) {
                            // the length of the array cannot be more than the length of multiple-choice answer array
                            if (value.length >= questionFormat[1].split(',').length) {
                                throw new Error(`invalid answer for type: ${types[0]}: list answers must not be more than the provided multiple-choice answers`);
                            }

                            // each number in the array can not be more than the length of the multiple-choice array
                            value.forEach((item) => {
                                if (!Number.isInteger(parseInt(item)) || (parseInt(item) >= questionFormat[1].split(',').length)) {
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
                // text questions must be an answer of string and not empty
                case types[1]:
                    if (typeof value != 'string' && value.trim().length < 1) {
                        throw new Error(`Answer must be a string and should not be empty for type ${types[1]}`);
                    }
                    break;
                // validate 'file' type
                // file question requires the answer to be link to the uploaded file
                case types[2]:
                    try {
                        new URL(value);
                    } catch(err) {
                        throw new Error(`Invalid url format. Answer must be a valid url to the uploaded file (IMAGE/PDF) for type ${types[2]}`);
                    }
                    break;
                // validate verbal type
                // varbal question requires the answer to be a link to the uploaded audio file.
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

validate.checkUpdateQuestion = (req, res, next) => {
    let errors = [];
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}


module.exports = validate;