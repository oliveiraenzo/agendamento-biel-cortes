const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const connectDatabase = require('./src/config/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos do front-end (index.html, admin.html, cancelar.html, assets)
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api', apiRoutes);

// Fallback SPA: qualquer outra rota que não seja /api entrega o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
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
