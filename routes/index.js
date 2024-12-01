// IMPORT REQUIRED MODULES
const express = require('express');
const questionRoute = require('./question');
const swaggerRoute = require('./swagger');
const userRoutes = require('./user');
const loginRoutes = require('./login');
const logoutRoute = require('./logout');

// IMPORT CONTROLLER
const baseController = require('../controllers')


// SETUP EXPRESS ROUTER
const router = express.Router();
// home route
router.get('/', baseController.displayHome);

// api-docs route
router.use('/', swaggerRoute);

// api-questions route
router.use('/questions', questionRoute);

// users route
router.use('/users', userRoutes);

// Login Routes
router.use('/login', loginRoutes);

// Logout
router.use('/logout', logoutRoute);



// EXPORT
module.exports = router;