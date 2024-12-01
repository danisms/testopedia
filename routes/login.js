// IMPORT REQUIRED MODULES
const express = require('express');
// const validateUser = require('../middleware/validation/user-validation');
// const authenticate = require('../middleware/authenticate');

// IMPORT CONTROLLER
const loginController = require('../controllers/login');
const passport = require('passport');


// SETUP EXPRESS ROUTER
const router = express.Router();

router.get('/', loginController.loginOptions);

router.get('/user', loginController.loginInstruction);

router.post('/user', loginController.loginUser);

router.get('/github', passport.authenticate('github'), loginController.authenticateGithub);

// github authenticator callback route
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/api-docs', session: false }), loginController.authenticateGithubCallBack);


// EXPORT ROUTE
module.exports = router;