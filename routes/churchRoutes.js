const express = require('express');
const router = express.Router();
const churchController = require('../controllers/churchController');

router.post('/', churchController.createChurch);
router.get('/', churchController.getAllChurches);
router.get('/:id', churchController.getChurchById);
router.put('/:id', churchController.updateChurch);
router.delete('/:id', churchController.deleteChurch);

module.exports = router;