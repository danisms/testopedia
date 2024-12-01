// IMPORT REQUIRED MODULES
const mongodb = require('../models/db/connect-db');
const chunks = require('../utilities/chunks');
const { logError } = require('../error-handling/errorHandler');


// CREATE question CONTROLLER OBJECT HOLDER
const questionController = {};

// Get all questions
questionController.getAllQuestions = async function(req, res) {
    //#swagger.tags=['question routes']
    try {
        const dataResult = await mongodb.getDb().db('testopidia').collection('questions').find();
        dataResult.toArray((err)=> {
            if (err) {
                logError(err);
                return res.status(400).json({message: err});
            }
        }).then((questions) => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(questions);
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err}) || "Error occured while trying to fetch all questions";
    }
}

// Get a question by question id
questionController.getAQuestion = async function(req, res) {
    //#swagger.tags=['question routes']
    // check if id is valid (i.e a 24 character hex string, 12 byte Uint8Array, or an integer).
    if (!chunks.isValidObjectId(req.params.id)) {
        let invalidIdError = "invalid id. Question id must be valid to get question";
        logError({message: invalidIdError})
        return res.status(400).json({message: invalidIdError});
    }

    const questionId = chunks.validObjectId(req.params.id, true, true);
    console.log(`questionId: ${questionId}`); // for debugging purpose
    try {
        const dataResult = await mongodb.getDb().db('testopidia').collection('questions').find({_id: questionId});
        dataResult.toArray((err)=> {
            if (err) {
                logError(err);
                return res.status(400).json({message: err});
            }
        }).then((questions) => {
            // check if array is empty
            console.log(`Questions: ${questions}`);  // for debugging purpose
            if (questions == null || questions == [] || questions == '') {
                return res.status(404).json({message: `question with id: ${questionId}; Not found, or is empty`});
            }
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(questions);
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err}) || `Error occured while trying to fetch question with id: ${questionId}`;
    }
}

// Create a question
questionController.addNewQuestion = async function(req, res) {
    //#swagger.tags=['question routes']
    // check if req.body is not empty
    if (!req.body) {
        return res.status(400).send({
          message: 'question fileds cannot be empty.',
        });
    }

    // check question id and convert it to integer if an integer string was provided
    if (chunks.isValidObjectId(req.body._id) == 'integer') {
        req.body._id = parseInt(req.body._id);
        console.log(`_id: ${req.body._id} was converted to a propert integer value`);  // for debugging purpose
    }
    const questionObject = {
        _id : req.body._id,
        subject : req.body.subject,
        level : req.body.level,
        type : req.body.type,
        questionInfo : req.body.questionInfo,
        question : req.body.question,
        answer : req.body.answer,
        author_id : req.session.user._id,  // - (get and store the current user id that is performing the operation)
        author_name: req.session.user.displayName,
        timestamp : Date.now()
    };

    try {
        const response = await mongodb.getDb().db('testopidia').collection('questions').insertOne(questionObject);
        console.log(response);  // for visualizing and testing purpose
        if (response.acknowledged) {
            const msg = "new question added successfully";
            console.log(msg);  // testing purpose
            res.status(200).send({ message: msg });
        } else {
            const msg = "fail to insert new question";
            console.log(msg);  // for testing purpose
            res.status(500).send({ message: msg });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err}) || "Error occured while inserting new question";
    }
}

// Update a question
questionController.updateAQuestion = async function(req, res) {
    //#swagger.tags=['question routes']

    // check if id is valid (i.e a 24 character hex string, 12 byte Uint8Array, or an integer).
    if (!chunks.isValidObjectId(req.params.id, true, true)) {
        let invalidIdError = "invalid id. Question id must be valid to update question";
            logError({message: invalidIdError})
            return res.status(400).json({message: invalidIdError});
    };
    // set id
    const questionId = chunks.validObjectId(req.params.id);
    console.log(`questionId: ${questionId}`);

    // check if req.body object is present
    if (!req.body) {
        return res.status(400).send({
          message: 'question details cannot be empty.\nPlease Include the required question details to be updated!',
        });
    }

    let questionObject = {
        subject : req.body.subject,
        level : req.body.level,
        type : req.body.type,
        questionInfo : req.body.questionInfo,
        question : req.body.question,
        answer : req.body.answer,
    };

    try {
        // get the previouse user timestamp and add to updateTimestamp list, to be used for the update
        const dataResult = await mongodb.getDb().db('testopidia').collection('questions').find({ _id: questionId });
        dataResult.toArray((err)=> {
            if (err) {
                logError(err);
                return res.status(400).json({message: err});
            }
        }).then(async (question) => {
            // check if array is empty
            console.log(`Question: ${JSON.stringify(question)}`);  // for debugging purpose
            if (question == null || question == [] || question == '') {
                return res.status(404).json({message: `question with id: ${questionId}; Not found, or is empty`});
            }
            // Add timestamp and updateTimestamp to Update questionObject
            // adding author_id and timestamp
            questionObject.author_id = question[0].author_id != undefined ? question[0].author_id : req.session.user._id;
            questionObject.timestamp = question[0].timestamp == undefined || question[0].timestamp == null ? Date.now() : question[0].timestamp;
            // adding updateInfo
            questionObject.updateInfo = question[0].updateInfo != undefined ? [...question[0].updateInfo, { author_id: req.session.user._id, author_name: req.session.user.displayName, updateTimestamp: Date.now() }] : [{ author_id: req.session.user._id, author_name: req.session.user.displayName, updateTimestamp: Date.now() }];
            console.log(`updateQuestionObject: ${JSON.stringify(questionObject)}`);  // for debugging purpose

            // update db with questionObject
            const response = await mongodb.getDb().db('testopidia').collection('questions').replaceOne({_id: questionId}, questionObject);
            console.log(response);  // for visualizing and testing purpose
            if (response.acknowledged && response.modifiedCount > 0) {
                const msg = `question with question-id: ${questionId}; has been updated successfully`;
                console.log(msg);  // testing purpose
                res.status(200).send({message: msg});
            } else {
                const msg = `fail to update question with question-id: ${questionId};\nPosible Error: Provided question id not found: ${questionId}`;
                console.log(msg);  // for testing purpose
                res.status(404).send({message: msg});
            }
        })
    } catch (err) {
        console.error(err);
        res.status(500).json(err) || "Error occured while updating question";
    }
}

// Delete a question
questionController.deleteAQuestion = async function(req, res) {
    //#swagger.tags=['question routes']

    // check if id is valid (i.e a 24 character hex string, 12 byte Uint8Array, or an integer).
    if (!chunks.isValidObjectId(req.params.id)) {
        let invalidIdError = "invalid id. Question id must be valid to delete question";
        logError(invalidIdError);
        return res.status(400).json({message: invalidIdError});
    }
    
    const questionId = chunks.validObjectId(req.params.id);
    console.log(`questionId: ${questionId}`);  // for testing purpose

    try {
        const response = await mongodb.getDb().db('testopidia').collection('questions').deleteOne({_id: questionId});
        console.log(response);  // for visualizing and testing purpose
        if (response.acknowledged && response.deletedCount > 0) {
            const msg = `question with question-id: ${questionId}; has been deleted successfully`;
            console.log(msg);  // testing purpose
            res.status(200).send({message: msg});
        } else {
            const msg = `fail to delete question with question-id: ${questionId};\nPosible Error: Provided question id not found: ${questionId}`;
            console.log(msg);  // for testing purpose
            res.status(404).send({message: msg});
        }
        
    } catch (err) {
        console.error(err);
        res.status(500).json(err) || "Error occured while deleting question";
    }
}

// EXPORT CONTROLLER

module.exports = questionController;