const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    id_usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    igreja: { type: String, required: true }, // Alterado para armazenar o nome da igreja
    data: { type: Date, required: true },
    descricao: { type: String, required: true },
    tipo: { type: String, enum: ['entrada', 'saida'], required: true },
    valor: { type: Number, required: true }
});

module.exports = mongoose.model('Transaction', TransactionSchema);