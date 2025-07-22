const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('API KEY:', process.env.OPENROUTER_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const peliculasRouter = require('./routers/peliculas');
app.use('/api/peliculas', peliculasRouter);

// Ruta raíz para verificar que funciona:
app.get('/', (req, res) => {
    res.send('Backend Cecyflix funcionando correctamente 🚀');
});

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.error(err));

// Puerto dinámico para Render - obligatorio usar process.env.PORT
const PORT = process.env.PORT;

if (!PORT) {
  console.error("Error: no se definió el puerto en env.PORT");
  process.exit(1);
}

app.post('/api/recomendaciones', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'mistralai/mistral-7b-instruct:free',
                messages: [{ role: 'user', content: prompt }],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const recomendacion = response.data.choices[0].message.content;
        res.json({ recomendacion });
    } catch (error) {
        console.error('Error completo:', error);
        console.error('Respuesta del servidor:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error en el servidor proxy' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

