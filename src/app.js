const express = require('express');
const cors = require('cors'); // <-- importar cors
const gtfsRoutes = require('./routes/gtfsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // <-- habilitar CORS para todas las rutas
app.use('/api', gtfsRoutes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});