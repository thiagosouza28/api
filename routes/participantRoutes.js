const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const authMiddleware = require('../middlewares/authMiddleware');


router.post('/inscricao', participantController.createParticipantUnAuth); // Sem autenticação

router.use(authMiddleware); // Aplica o middleware de autenticação para as rotas abaixo.

router.post('/', participantController.createParticipantAuth); // Com autenticação
router.get('/', participantController.getAllParticipants);  // Corrected
router.get('/:id_participante', participantController.getParticipantById); // Corrected
router.put('/:id_participante', participantController.updateParticipant); // Corrected
router.put('/:id_participante/confirmar-pagamento', participantController.confirmarPagamento); // Corrected
router.put('/:id_participante/cancelar-confirmacao', participantController.unconfirmPayment); // Corrected
router.delete('/:id_participante', participantController.deleteParticipant); // Corrected
router.get('/pdf', participantController.generatePdf); // Corrected


module.exports = router;
