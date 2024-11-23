// IMPORT REQUIRED MODULE
const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');  // an api documentation
const swaggerDocument = require('../swagger.json');

// CREATE ROUTES
router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));

// EXPORT ROUTE
module.exports = router;