const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const participantSchema = new mongoose.Schema({
    id_participante: {
        type: String,
        required: [true, 'O ID do participante é obrigatório'],
        unique: true // Manter único para cada participante
    },
    nome: {
        type: String,
        required: [true, 'O nome é obrigatório'],
        trim: true,
        maxlength: [100, 'O nome deve ter no máximo 100 caracteres']
    },
    nascimento: {
        type: Date,
        required: [true, 'A data de nascimento é obrigatória']
    },
    igreja: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Igreja',
        required: [true, 'A igreja é obrigatória']
    },
    email: {
        type: String,
        required: [true, 'O email é obrigatório'],
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, insira um email válido']
    },
    data_inscricao: {
        type: Date,
        default: Date.now
    },
    data_confirmacao: {
        type: Date,
        default: null
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true,
        default: uuidv4
    },
    id_usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null } // ID do usuário (se autenticado)
});

module.exports = mongoose.model('Participant', participantSchema);
