const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware'); // Import auth middleware

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes - requires authentication
router.get('/profile', auth, authController.getProfile); // Get logged user info

module.exports = router;
