// IMPORT REQUIRED MODULES
const express = require('express');
const validateUser = require('../middleware/validation/user-validation');
const authenticate = require('../middleware/authenticate');

// IMPORT CONTROLLER
const userController = require('../controllers/user');


// SETUP EXPRESS ROUTER
const router = express.Router();

// Route to get all Users
router.get('/',
    authenticate.checkLogin,  // check if user is logged in
    authenticate.isAuthenticatedAdmin,  // check if user is at least an admin
    userController.getAllUsers
);

// Route to get User by id
router.get('/:id',
    authenticate.checkLogin,  // check if user is logged in
    authenticate.isAuthenticatedAdmin,  // check if user is at least an admin
    userController.getAUser
);

// Route to add new User (i.e create account/signup)
router.post('/',
    validateUser.addNewUserRules(),
    validateUser.checkNewUser,
    userController.addNewUser
);

// Route to update a User
router.put('/update-profile',
    authenticate.checkLogin,  // check if user is logged in
    validateUser.updateUserRules(),
    validateUser.checkUpdateUser,
    userController.updateAUser,
);

// Route to delete a User
router.delete('/:id',
    authenticate.checkLogin,  // check if user is logged in
    authenticate.isAuthenticatedFullControl,  // check if user is at least an admin
    userController.deleteAUser
);


// EXPORT
module.exports = router;