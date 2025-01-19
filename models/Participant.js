const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Importe a biblioteca UUID

const participantSchema = new mongoose.Schema({
    id_participante: { type: String, required: true, unique: true }, // Mantenha este campo, mesmo com o uniqueId
    nome: { type: String, required: true },
    email: { type: String, required: true }, // Remova unique: true
    nascimento: { type: Date, required: true },
    idade: { type: Number, required: true },
    igreja: { type: mongoose.Schema.Types.ObjectId, ref: 'Igreja', required: true },
    data_inscricao: { type: Date, default: Date.now },
    data_confirmacao: Date,
    uniqueId: { type: String, required: true, unique: true, default: uuidv4 }, // Adiciona o campo uniqueId
    id_usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
});

module.exports = mongoose.model('Participant', participantSchema);
