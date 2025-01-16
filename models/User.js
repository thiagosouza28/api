const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  cargo: {
    type: String,
    enum: ['administrador geral', 'tesoureiro do catre', 'diretor jovem', 'ancião'],
    required: true
  },
  id_distrito: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  id_igreja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Church',
    required: true
  },
  nascimento: {
    type: Date,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  senha: {
    type: String,
    required: true
  },
  data_cadastro: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
