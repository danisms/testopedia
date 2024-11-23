// IMPORT REQUIRED MODULES
const express = require('express');
const validateContact = require('../validation/question-validation');

// IMPORT CONTROLLER
const questionController = require('../controllers/question');


// SETUP EXPRESS ROUTER
const router = express.Router();

// Route to get all questions
router.get('/', questionController.getAllQuestions);

// Route to get question by id
router.get('/:id', questionController.getAQuestion)

// Route to add new question
router.post('/', 
    validateContact.addNewQuestionRules(),
    validateContact.checkNewQuestion,
    questionController.addNewQuestion
);

// Route to update a question
router.put('/:id',
    validateContact.updateQuestionRules(),
    validateContact.checkUpdateQuestion,
    questionController.updateAQuestion,
);

// Route to delete a question
router.delete('/:id', questionController.deleteAQuestion);


// EXPORT
module.exports = router;