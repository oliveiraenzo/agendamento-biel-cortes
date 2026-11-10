const mongoose = require('mongoose');

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bielbarber';
  
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✓ MongoDB Atlas conectado com sucesso.');
  } catch (error) {
    console.warn('! Aviso MongoDB: Operando em fallback local/sem banco.', error.message);
  }
};

module.exports = connectDatabase;

