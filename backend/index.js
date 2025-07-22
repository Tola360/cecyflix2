const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('API KEY cargada:', !!process.env.OPENROUTER_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Importa y usa rutas para películas
const peliculasRouter = require('./routers/peliculas');
app.use('/api/peliculas', peliculasRouter);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('✅ Backend Cecyflix funcionando correctamente');
});

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB conectado'))
    .catch(err => console.error('❌ Error al conectar MongoDB:', err));

// Ruta de recomendación con manejo de errores mejorado
app.post('/api/recomendaciones', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt requerido' });
    }

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

        const recomendacion = response.data.choices[0]?.message?.content;
        if (!recomendacion) {
            throw new Error('Respuesta inesperada de OpenRouter');
        }

        res.json({ recomendacion });

    } catch (error) {
        console.error('❌ Error al consultar OpenRouter:', error.message);

        if (error.response) {
            console.error('Código de estado:', error.response.status);
            console.error('Respuesta del servidor:', error.response.data);
        }

        res.status(500).json({ error: 'Error al generar recomendación con IA' });
    }
});

// Puerto dinámico para Render
const PORT = process.env.PORT;
if (!PORT) {
    console.error("❌ Error: no se definió el puerto en env.PORT");
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
