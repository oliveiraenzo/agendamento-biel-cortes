const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');
const connectDatabase = require('./src/config/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', apiRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Biel Cortes API',
    status: 'online',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDatabase();
    console.log('✅ Banco de dados MongoDB conectado.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

startServer();
