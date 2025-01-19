const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const participantSchema = new Schema({
    id_participante: { // ID personalizado, por exemplo, DI20230001
        type: String,
        required: true,
        unique: true
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
    idade: {
        type: Number,
        required: [true, 'A idade é obrigatória'],
        min: [0, 'A idade deve ser maior ou igual a 0']
    },
    igreja: {
        type: String,
        trim: true,
        required: [true, 'O nome da igreja é obrigatório']
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
        default: null // Inicialmente, a data de confirmação é nula
    }
});

module.exports = mongoose.model('Participant', participantSchema);
