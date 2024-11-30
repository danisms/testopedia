// IMPORT REQUIRED MODULES
const express = require('express');
const validateUser = require('../middleware/validation/user-validation');
const authenticate = require('../middleware/authenticate');

// IMPORT CONTROLLER
const userController = require('../controllers/user');


// SETUP EXPRESS ROUTER
const router = express.Router();

// Route to get all Users
router.get('/', userController.getAllUsers);

// Route to get User by id
router.get('/:id', userController.getAUser);

// Route to add new User (i.e create account/signup)
router.post('/',
    validateUser.addNewUserRules(),
    validateUser.checkNewUser,
    userController.addNewUser
);

// Route to update a User
router.put('/:id',
    authenticate.isAuthenticated,
    validateUser.updateUserRules(),
    validateUser.checkUpdateUser,
    userController.updateAUser,
);

// Route to delete a User
router.delete('/:id',
    authenticate.isAuthenticated,
    userController.deleteAUser
);


// EXPORT
module.exports = router;