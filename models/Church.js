const mongoose = require('mongoose');

const churchSchema = new mongoose.Schema({
  igreja: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('Igreja', churchSchema);
