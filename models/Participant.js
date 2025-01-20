const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const participantSchema = new mongoose.Schema({
    id_participante: {
        type: String,
        required: [true, 'O ID do participante é obrigatório'],
        unique: true
    },
    nome: {
        type: String,
        required: [true, 'O nome é obrigatório'],
        trim: true,
        minlength: [3, 'O nome deve ter pelo menos 3 caracteres'],
        maxlength: [100, 'O nome deve ter no máximo 100 caracteres']
    },
    nascimento: {
        type: Date,
        required: [true, 'A data de nascimento é obrigatória']
    },
    igreja: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'O email é obrigatório'],
        lowercase: true,
        trim: true,
        unique: false,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} não é um email válido!`
        }
    }, // <--- COMMA ADDED HERE
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
    }
    // id_usuario is removed as requested
});

module.exports = mongoose.model('Participant', participantSchema);
