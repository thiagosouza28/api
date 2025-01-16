const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Participant = require('./models/Participant');
const Church = require('./models/Church');

// Conecte ao seu banco de dados MongoDB
mongoose.connect('mongodb+srv://inscricaoipitinga:3KblDsUkHlYsQfZr@cluster0.ba3hz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar ao MongoDB', err));

async function migrarDados() {
  try {
    // Migrar Transações
    const transacoes = await Transaction.find();
    for (const transacao of transacoes) {
      if (transacao.igreja) {
        const igreja = await Church.findOne({ nome: transacao.igreja });
        if (igreja) {
          transacao.id_igreja = igreja._id;
          await transacao.save();
          console.log(`Transação ${transacao._id} atualizada com id_igreja ${igreja._id}`);
        } else {
          console.log(`Igreja não encontrada para a transação ${transacao._id}`);
        }
      }
    }

    // Migrar Participantes
    const participantes = await Participant.find();
    for (const participante of participantes) {
      if (participante.igreja) {
        const igreja = await Church.findOne({ nome: participante.igreja });
        if (igreja) {
          participante.id_igreja = igreja._id;
          await participante.save();
          console.log(`Participante ${participante._id} atualizado com id_igreja ${igreja._id}`);
        } else {
          console.log(`Igreja não encontrada para o participante ${participante._id}`);
        }
      }
    }

    console.log('Migração concluída.');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    mongoose.disconnect();
  }
}

migrarDados();