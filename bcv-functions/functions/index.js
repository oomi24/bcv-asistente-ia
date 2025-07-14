const functions = require('firebase-functions');
const axios = require('axios'); // Asegúrate de tener axios instalado en la carpeta de funciones (npm install axios)

// La función HTTP que tu frontend llamará
exports.searchNews = functions.https.onRequest(async (req, res) => {
  // Configurar CORS para permitir peticiones desde tu frontend
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Envía la respuesta a las peticiones OPTIONS (preflight requests)
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  const query = req.query.q; // Obtiene el parámetro 'q' de la URL
  if (!query) {
    return res.status(400).send('El parámetro de consulta "q" es requerido.');
  }

  try {
    // Obtiene la clave API de GNews desde la configuración de Firebase Functions
    // Asegúrate de que esta variable de configuración esté establecida en Firebase
    const gnewsApiKey = functions.config().gnews.api_key;
    if (!gnewsApiKey) {
      return res.status(500).send('La clave API de GNews no está configurada en Firebase Functions.');
    }

    // Construye la URL de la API de GNews
    // lang=es para noticias en español, max=5 para 5 resultados
    const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=es&max=5&apikey=${gnewsApiKey}`;

    // Realiza la petición a la API de GNews
    const response = await axios.get(gnewsUrl);

    if (response.data && response.data.articles) {
      // Devuelve los artículos de noticias
      return res.status(200).json({ results: response.data.articles });
    } else {
      return res.status(500).send('No se pudieron obtener artículos de GNews.');
    }
  } catch (error) {
    console.error('Error al obtener noticias de GNews:', error.message);
    // Devuelve un mensaje de error detallado
    return res.status(500).send(`Error al obtener noticias: ${error.message}`);
  }
});