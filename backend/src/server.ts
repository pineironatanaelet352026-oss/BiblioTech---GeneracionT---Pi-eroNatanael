import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[BiblioTech Server] Escuchando en el puerto ${PORT}`);
  console.log(`[Ambiente] ${process.env.NODE_ENV || 'development'}`);
});
