require('dotenv').config();
const app = require('./src/app');
const connectDatabase = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Inicializa Conexão com MongoDB
connectDatabase();

// Inicia Servidor HTTP
app.listen(PORT, () => {
  console.log(`💈 Biel Cortes API rodando com sucesso na porta ${PORT}`);
  console.log(`👉 Rotas ativas:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/slots?date=YYYY-MM-DD&duration=MINUTES`);
  console.log(`   - POST /api/appointments`);
});
