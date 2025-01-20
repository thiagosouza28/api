const mongoose = require('mongoose');

const churchSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('Church', churchSchema);
