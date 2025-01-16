require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');

// Importação das rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const igrejaRoutes = require('./routes/churchRoutes');
const participanteRoutes = require('./routes/participantRoutes');
const transacaoRoutes = require('./routes/transactionRoutes');

const app = express();

// Conectar ao banco de dados
connectDB();

// Middlewares
app.use(cors()); // Permite requisições de diferentes origens
app.use(express.json()); // Para parsing de JSON
app.use(express.urlencoded({ extended: true })); // Para parsing de URL-encoded bodies
app.use(morgan('dev')); // Logging de requisições HTTP

// Tratamento de erros para JSON inválido
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'JSON inválido' });
  }
  next();
});

// Rota base da API
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API Financeira' });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/igrejas', igrejaRoutes);
app.use('/api/participantes', participanteRoutes);
app.use('/api/transacoes', transacaoRoutes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Configurações de segurança básicas
app.disable('x-powered-by'); // Remove o header X-Powered-By por segurança

// Configuração da porta
const PORT = process.env.PORT || 3000;

// Inicialização do servidor apenas se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
