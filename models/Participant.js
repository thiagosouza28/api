const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    id_participante: { type: String, required: true, unique: true },
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    nascimento: { type: Date, required: true },
    idade: { type: Number, required: true },
    igreja: { type: mongoose.Schema.Types.ObjectId, ref: 'Igreja', required: true }, // Assuming you have an 'Igreja' model
    data_inscricao: { type: Date, default: Date.now },
    data_confirmacao: Date,
    id_usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' } // Assuming you have a 'Usuario' model
});

module.exports = mongoose.model('Participant', participantSchema);
