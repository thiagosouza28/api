const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public Routes (No Authentication)
router.post('/inscricao', participantController.createParticipantUnAuth);

// Protected Routes (Authentication Required)
router.use(authMiddleware);

router.post('/', participantController.createParticipantAuth);
router.get('/', participantController.getAllParticipants);
router.get('/:id_participante', participantController.getParticipantById);
router.put('/:id_participante', participantController.updateParticipant);
router.put('/:id_participante/confirmar-pagamento', participantController.confirmarPagamento);
router.put('/:id_participante/cancelar-confirmacao', participantController.unconfirmPayment);
router.delete('/:id_participante', participantController.deleteParticipant);
router.get('/pdf', participantController.generatePdf);

// 405 Method Not Allowed Handler (for unsupported HTTP methods)
router.all('*', (req, res) => {
    res.status(405).json({ message: `Método ${req.method} não permitido para esta rota.` });
});

module.exports = router;
