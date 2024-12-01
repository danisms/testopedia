// IMPORT REQUIRED MODULES
const express = require('express');
// const validateUser = require('../middleware/validation/user-validation');
// const authenticate = require('../middleware/authenticate');

// IMPORT CONTROLLER
const logOutController = require('../controllers/logout');


// SETUP EXPRESS ROUTER
const router = express.Router();

router.get('/', logOutController.logOutUser);


// EXPORT MODULES
module.exports = router;