// IMPORT REQUIRED MODULES
const express = require('express');
const validateQuestion = require('../middleware/validation/question-validation');
const authenticate = require('../middleware/authenticate');

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
    authenticate.isAuthenticated,
    validateQuestion.addNewQuestionRules(),
    validateQuestion.checkNewQuestion,
    questionController.addNewQuestion
);

// Route to update a question
router.put('/:id',
    authenticate.isAuthenticated,
    validateQuestion.updateQuestionRules(),
    validateQuestion.checkUpdateQuestion,
    questionController.updateAQuestion,
);

// Route to delete a question
router.delete('/:id',
    authenticate.isAuthenticated,
    questionController.deleteAQuestion
);


// EXPORT
module.exports = router;