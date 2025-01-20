const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota de inscrição (sem autenticação)
router.post('/inscricao', async (req, res) => {
  try {
    const participant = await participantController.createParticipant(req.body);
    res.status(201).json(participant);
  } catch (error) {
    console.error("Erro ao criar participante:", error);
    res.status(500).json({ error: 'Erro ao criar participante' });
  }
});


// Middleware de autenticação para as rotas abaixo
router.use(authMiddleware);


// Rotas protegidas (requerem autenticação)
router.get('/', async (req, res) => {
  try {
    const participants = await participantController.getAllParticipants();
    res.json(participants);
  } catch (error) {
    console.error("Erro ao obter participantes:", error);
    res.status(500).json({ error: 'Erro ao obter participantes' });
  }
});

router.get('/:id_participante', async (req, res) => {
  try {
    const participant = await participantController.getParticipantById(req.params.id_participante);
    if (!participant) {
      return res.status(404).json({ error: 'Participante não encontrado' });
    }
    res.json(participant);
  } catch (error) {
    console.error("Erro ao obter participante:", error);
    res.status(500).json({ error: 'Erro ao obter participante' });
  }
});

router.put('/:id_participante', async (req, res) => {
    // ... (implementação semelhante com tratamento de erros)
});

router.put('/:id_participante/confirmar-pagamento', async (req, res) => {
    // ... (implementação semelhante com tratamento de erros)
});

router.put('/:id_participante/cancelar-confirmacao', async (req, res) => {
    // ... (implementação semelhante com tratamento de erros)
});

router.delete('/:id_participante', async (req, res) => {
    // ... (implementação semelhante com tratamento de erros)
});

module.exports = router;
