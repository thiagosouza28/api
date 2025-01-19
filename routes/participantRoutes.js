const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota pública para criar um novo participante (sem autenticação)
router.post('/inscricao', participantController.createPublicParticipant);

// Middleware de autenticação para as rotas abaixo
router.use(authMiddleware);

// Outras rotas protegidas (que exigem autenticação)
router.post('/', participantController.createParticipant);
router.get('/', participantController.getAllParticipants);
router.get('/:id_participante', participantController.getParticipantById);
router.put('/:id_participante', participantController.updateParticipant);
router.put('/:id_participante/confirmar-pagamento', participantController.confirmarPagamento);
router.put('/:id_participante/cancelar-confirmacao', participantController.unconfirmPayment);
router.delete('/:id_participante', participantController.deleteParticipant);

module.exports = router;
