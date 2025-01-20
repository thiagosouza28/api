const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const authMiddleware = require('../middlewares/authMiddleware'); // Import authMiddleware

// Routes without authentication
router.post('/inscricao', participantController.createParticipantUnAuth);

// Apply authentication middleware to the routes below
router.use(authMiddleware);

// Routes requiring authentication
router.post('/', participantController.createParticipantAuth);
router.get('/', participantController.getAllParticipants);
router.get('/:id_participante', participantController.getParticipantById);
router.put('/:id_participante', participantController.updateParticipant);
router.put('/:id_participante/confirmar-pagamento', participantController.confirmarPagamento);
router.put('/:id_participante/cancelar-confirmacao', participantController.unconfirmPayment);
router.delete('/:id_participante', participantController.deleteParticipant);
router.get('/pdf', participantController.generatePdf); //Assuming this is for generating PDF


module.exports = router;
