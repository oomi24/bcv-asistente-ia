// api/news.js
// Esta es una Vercel Serverless Function que ahora solo usará feeds RSS para la búsqueda de noticias.

const fetch = require('node-fetch'); // node-fetch es necesario para fetch en Node.js
const { URL } = require('url'); // Para parsear URLs
const RSSParser = require('rss-parser'); // Asegúrate de tener rss-parser instalado

// Función para obtener noticias de feeds RSS de medios venezolanos
async function getNewsFromRSS(query) {
  const parser = new RSSParser();
  const results = [];

  // Lista de feeds RSS verificados (2025)
  const venezuelaNewsFeeds = [
    'https://www.ultimasnoticias.com.ve/feed/',
	'https://www.ministeriodelopublico.gob.ve/',
    'https://www.ministeriodelopublico.gob.ve/',
    'https://www.me.gob.ve/',
    'http://www.tves.gob.ve/', 
    'https://www.conatel.gob.ve/',
    'http://www.correodelorinoco.gob.ve/',
    'https://www.presidencia.gob.ve/', 
    'https://www.avn.info.ve/',
    'https://albaciudad.org/',
    'http://www.vtv.gob.ve/',
	'https://www.mindefensa.gob.ve/',
    'https://www.eluniversal.com/feed/',
    'https://efectococuyo.com/feed/',
    'https://www.bancaynegocios.com/feed/',
    'https://www.bcv.org.ve/rss' // El BCV tiene un feed RSS
  ];

  for (const feedUrl of venezuelaNewsFeeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const matches = feed.items.filter(item =>
        item.title && item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.contentSnippet && item.contentSnippet.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // Limita a 5 resultados por feed para no sobrecargar

      results.push(...matches.map(item => ({
        title: item.title || 'Sin título',
        link: item.link || '#',
        snippet: item.contentSnippet || item.summary || item.content || 'No hay un resumen disponible.',
        source: new URL(feedUrl).hostname
      })));
    } catch (rssError) {
      console.warn(`Error al parsear RSS de ${feedUrl}:`, rssError.message);
      // Continúa con el siguiente feed si uno falla
    }
  }
  return results;
}

// Función principal de la Serverless Function
module.exports = async (req, res) => {
  // Configurar CORS para permitir peticiones desde tu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const query = req.query.query; // Obtiene el parámetro 'query' de la URL

  if (!query) {
    return res.status(400).json({ error: 'El parámetro de consulta "query" es requerido.' });
  }

  try {
    const results = await getNewsFromRSS(query);
    
    // Devuelve los resultados en formato JSON
    res.status(200).json({ results });
  } catch (error) {
    console.error('Error en la función news.js (RSS):', error.message);
    res.status(500).json({ error: `Error al procesar la búsqueda RSS: ${error.message}` });
  }
};
