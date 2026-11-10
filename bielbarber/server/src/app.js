const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Arquivos Estáticos da Aplicação Front-end
app.use(express.static(path.join(__dirname, '../../public')));

// Rotas da API
app.use('/api', apiRoutes);

// Fallback para rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

module.exports = app;

