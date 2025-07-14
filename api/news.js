// api/news.js
// Esta es una Vercel Serverless Function que actuará como un proxy para las APIs de noticias.

const fetch = require('node-fetch'); // node-fetch es necesario para fetch en Node.js
const { URL } = require('url'); // Para parsear URLs
const RSSParser = require('rss-parser'); // Asegúrate de instalar 'rss-parser' en el package.json de la función

// Función para buscar noticias usando Google Programmable Search Engine (PSE)
// Requiere GOOGLE_CSE_ID y GOOGLE_API_KEY en las variables de entorno de Vercel
async function searchNewsGooglePSE(query) {
  const cx = process.env.GOOGLE_CSE_ID; // ID del Motor de Búsqueda Personalizado
  const apiKey = process.env.GOOGLE_API_KEY; // Clave API de Google Cloud para Custom Search

  if (!cx || !apiKey) {
    throw new Error('Las variables de entorno GOOGLE_CSE_ID o GOOGLE_API_KEY no están configuradas para la función.');
  }

  // URL para la API de Google Custom Search
  // num=5 para 5 resultados, lr=lang_es para idioma español
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&num=5&lr=lang_es`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    console.error('Error de Google Custom Search API:', data.error);
    throw new Error(`Error de la API de Google Custom Search: ${data.error.message || 'Desconocido'}`);
  }

  // Mapea los resultados al formato esperado por el frontend
  return (data.items || []).map(item => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    source: new URL(item.link).hostname // Extrae el hostname como fuente
  }));
}

// Función para obtener noticias de feeds RSS de medios venezolanos
async function getNewsFromRSS(query) {
  const parser = new RSSParser();
  const results = [];

  // Lista de feeds RSS verificados (2025)
  const venezuelaNewsFeeds = [
    'https://www.ultimasnoticias.com.ve/feed/',
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
      ).slice(0, 3); // Limita a 3 resultados por feed para no sobrecargar

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

  const { query, method = 'google' } = req.query; // 'method' puede ser 'google' o 'rss'

  if (!query) {
    return res.status(400).json({ error: 'El parámetro de consulta "query" es requerido.' });
  }

  try {
    let results;
    if (method === 'rss') {
      results = await getNewsFromRSS(query);
    } else { // Por defecto, usa Google PSE
      results = await searchNewsGooglePSE(query);
    }
    
    // Devuelve los resultados en formato JSON
    res.status(200).json({ results });
  } catch (error) {
    console.error('Error en la función news.js:', error.message);
    res.status(500).json({ error: `Error al procesar la búsqueda: ${error.message}` });
  }
};
