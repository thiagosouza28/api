const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');

//Rotas para participantes
router.post('/', participantController.createParticipant); // Rota para criar um novo participante
router.post('/public', participantController.createPublicParticipant); // Rota pública para criar participantes
router.get('/', participantController.getAllParticipants); // Rota para obter todos os participantes
router.get('/:id_participante', participantController.getParticipantById); // Rota para obter um participante pelo ID
router.put('/:id_participante', participantController.updateParticipant); //Rota para atualizar um participante
router.put('/:id_participante/confirmar-pagamento', participantController.confirmarPagamento); //Confirmar pagamento
router.put('/:id_participante/cancelar-confirmacao', participantController.unconfirmPayment); //Cancelar confirmação
router.delete('/:id_participante', participantController.deleteParticipant); //Rota para deletar um participante
router.get('/pdf', participantController.generatePdf); //Rota para gerar PDF

module.exports = router;
