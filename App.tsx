
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'; // Importar auth
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx'; // Para la descarga de DOCX
import { Download, Printer } from 'lucide-react'; // Para los iconos

// Cargar la fuente 'Courier Prime' de Google Fonts
const loadFonts = () => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};

// Llamar a la función para cargar las fuentes cuando el componente se monte
loadFonts();

// Definición de tipo para el contenido generado por IA
interface AiGeneratedContentItem {
  type: string;
  content: string;
  timestamp: string;
  userId?: string; // Para almacenar el ID del usuario que generó el contenido
}

// Componente LoadingSpinner
const LoadingSpinner = ({ size = 'md', message = 'Cargando...' }) => {
  const spinnerSize = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${spinnerSize} border-2 border-t-2 border-white rounded-full animate-spin`}></div>
      {message && <p className="text-white text-sm mt-2">{message}</p>}
    </div>
  );
};

// Función para llamar a la API de Gemini (adaptada para usar la API Key de .env)
const generateTextGemini = async (prompt: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("API Key de Gemini no configurada. Por favor, añádela al archivo .env como VITE_API_KEY.");
  }

  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: prompt }] });
  const payload = { contents: chatHistory };
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (result.candidates && result.candidates.length > 0 &&
      result.candidates[0].content && result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0) {
    return result.candidates[0].content.parts[0].text;
  } else {
    throw new Error('No se pudo generar contenido. La estructura de la respuesta de la IA es inesperada.');
  }
};

// Función para simular búsqueda de noticias (puedes reemplazarla con una API real si es necesario)
const searchNewsWithGemini = async (query: string) => {
  const simulatedResults = [
    { title: `Noticia sobre ${query} 1`, link: `https://ejemplo.com/noticia1-${query}`, snippet: `Un breve resumen de la noticia 1 sobre ${query}.` },
    { title: `Noticia sobre ${query} 2`, link: `https://ejemplo.com/noticia2-${query}`, snippet: `Un breve resumen de la noticia 2 sobre ${query}.` },
  ];
  const simulatedTextResponse = `Se han encontrado varios artículos recientes relacionados con "${query}". Los temas principales incluyen... (Este texto sería generado por Gemini resumiendo los resultados de búsqueda reales).`;
  return { textResponse: simulatedTextResponse, searchResults: simulatedResults };
};


// Componente principal de la aplicación
const App = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [webSearchQuery, setWebSearchQuery] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [externalText, setExternalText] = useState<string>('');
  const [aiGeneratedContent, setAiGeneratedContent] = useState<AiGeneratedContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>('');
  const [db, setDb] = useState<any | null>(null); // Instancia de Firestore
  const [auth, setAuth] = useState<any | null>(null); // Instancia de Auth
  const [userId, setUserId] = useState<string | null>(null); // ID del usuario autenticado

  // Inicializar Firebase y autenticar al usuario
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      // Validar que todas las variables de Firebase estén presentes
      const requiredFirebaseVars = [
        'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID'
      ];
      const missingVars = requiredFirebaseVars.filter(envVar => !import.meta.env[envVar]);
      if (missingVars.length > 0) {
        throw new Error(`Faltan variables de entorno de Firebase: ${missingVars.join(', ')}. Por favor, añádelas a tu archivo .env.`);
      }

      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);

      // Iniciar sesión anónimamente si no hay usuario o escuchar cambios de autenticación
      onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("Usuario autenticado anónimamente:", user.uid);
        } else {
          // Si no hay usuario, intenta iniciar sesión anónimamente
          signInAnonymously(firebaseAuth)
            .then((userCredential) => {
              setUserId(userCredential.user.uid);
              console.log("Inicio de sesión anónimo exitoso:", userCredential.user.uid);
            })
            .catch((authError) => {
              setError(`Error en autenticación anónima: ${authError.message}`);
              console.error("Firebase Auth error:", authError);
            });
        }
      });

    } catch (e: any) {
      setError(`Error inicializando Firebase: ${e.message}`);
      console.error("Firebase init error:", e);
    }
  }, []);

  // Prompt base para la IA, incorporando el tono y la identidad del BCV
  const systemPrompt = `
    Eres la inteligencia artificial central del "BCV Asistente de Contenido IA", una herramienta oficial del Banco Central de Venezuela (BCV). Tu función principal es analizar información y generar contenido para comunicaciones institucionales, económicas y financieras.

    **Identidad Institucional (Comunicación y Estilo):**
    1.  **Tono:** Siempre adopta un tono formal, objetivo, neutro y constructivo. Evita cualquier lenguaje coloquial, sensacionalista, amarillista, adulante o subjetivo.
    2.  **Enfoque Institucional:** Tus respuestas deben reflejar y defender las acciones, políticas y marcos legales de las instituciones del Estado venezolano, en particular el Banco Central de Venezuela (BCV). Presenta sus roles y decisiones de manera clara y basada en hechos.
    3.  **Precisión y Verificabilidad:** Toda la información generada debe ser precisa, basada en los datos y el contexto proporcionado. Prioriza los hechos verificables sobre las opiniones o especulaciones.
    4.  **Terminología:** Utiliza la terminología económica y financiera oficial y estandarizada.
    5.  **Audiencia:** Dirígete a una audiencia profesional y técnica, así como al público general interesado en la economía y finanzas, manteniendo siempre la claridad y la seriedad.

    **Estilo Visual Implícito (para Formato y Estructura de Salida):**
    Aunque no puedes generar imágenes directamente, tus respuestas deben evocar la profesionalidad y seriedad visual de la marca BCV. Considera los siguientes elementos al estructurar tus respuestas:
    1.  **Limpieza y Claridad:** Estructura el texto con párrafos definidos, viñetas si son apropiadas para listas de puntos clave, y títulos claros. Evita la sobrecarga de información en un solo bloque de texto.
    2.  **Jerarquía Visual del Texto:** Utiliza negritas (Markdown: **texto**) para destacar títulos, subtítulos o puntos clave, simulando la organización visual de un documento oficial.
    3.  **Consistencia:** Mantén una estructura y formato consistentes en todos los tipos de contenido generados.

    **Restricciones Clave:**
    * No Opinar: No emitas juicios de valor, opiniones personales ni predicciones no fundamentadas.
    * No Especular: Limítate a los datos y el contexto proporcionado.
    * No Usar Lenguaje Emocional: Evita cualquier adjetivo o frase que pueda interpretarse como emoción (positiva o negativa).
    * No Crear Contenido Ficticio: Si la información no está en el contexto, indica que no puedes generarla o pídela.

    **Directriz Final:** Actúa como un asistente experto y confiable, cuya producción es indistinguible de la comunicación oficial de una entidad tan prestigiosa como el Banco Central de Venezuela.
  `;

  // Manejador de carga de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target?.result as string);
      };
      reader.onerror = () => {
        setError('Error al leer el archivo.');
      };
      reader.readAsText(file);
    }
  };

  // Función para guardar contenido en Firestore
  const saveContentToFirestore = async (item: AiGeneratedContentItem) => {
    if (!db || !userId) {
      console.error("Firestore o User ID no están inicializados, no se puede guardar el contenido.");
      setError("Error: No se pudo guardar el contenido. Asegúrate de que Firebase esté inicializado y autenticado.");
      return;
    }
    try {
      // Añadir el userId al item antes de guardar
      const itemToSave = { ...item, userId: userId };
      const docRef = await addDoc(collection(db, 'ai_generated_content'), itemToSave);
      console.log("Contenido guardado en Firestore con ID:", docRef.id);
    } catch (fsError: any) {
      console.error("Error al guardar en Firestore:", fsError);
      setError(`Error al guardar en la base de datos: ${fsError.message}`);
    }
  };

  // Función para llamar a la API de Gemini y establecer el contenido
  const callGeminiAndSetContent = async (prompt: string, type: string, loadingMsg: string) => {
    setIsLoading(true);
    setLoadingMessage(loadingMsg);
    setError(null);
    try {
      const resultText = await generateTextGemini(prompt);
      const newItem: AiGeneratedContentItem = { type, content: resultText, timestamp: new Date().toLocaleString() };
      setAiGeneratedContent(prev => [...prev, newItem]);
      await saveContentToFirestore(newItem); // Guarda el contenido en Firestore
    } catch (err: any) {
      setError(err.message || `Error al comunicarse con la IA`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Función para procesar el contexto
  const processContext = async () => {
    if (!fileContent && !webSearchQuery && !externalText) {
      setError('Por favor, proporcione al menos una fuente de contexto (archivo, búsqueda web o texto externo).');
      return;
    }
    
    let fullContext = '';
    if (fileContent) fullContext += `Contenido del archivo subido:\n${fileContent}\n\n`;
    if (externalText) fullContext += `Texto externo para analizar:\n${externalText}\n\n`;

    if (webSearchQuery) {
        setIsLoading(true);
        setLoadingMessage(`Buscando en la web sobre: "${webSearchQuery}"`);
        setError(null);
        try {
            const { textResponse, searchResults } = await searchNewsWithGemini(webSearchQuery);
            let newsContext = `Resumen de IA sobre la búsqueda "${webSearchQuery}":\n${textResponse}\n\n`;
            if (searchResults.length > 0) {
                newsContext += "Fuentes encontradas:\n";
                searchResults.forEach(item => {
                    newsContext += `Título: ${item.title}\nEnlace: ${item.link}\n\n`;
                });
            }
            fullContext += newsContext;
        } catch (err: any) {
            setError(err.message || 'Error al realizar la búsqueda web.');
            setIsLoading(false);
            return;
        } finally {
            setIsLoading(false);
        }
    }
    
    if (fullContext) {
      const analysisPrompt = `${systemPrompt}\n\nAnaliza y resume el siguiente contenido, extrayendo los puntos clave relevantes para un contexto económico-financiero institucional. Sé conciso y objetivo:\n\n${fullContext}`;
      await callGeminiAndSetContent(analysisPrompt, 'Análisis de Contexto General', 'Analizando y resumiendo el contexto...');
    }
  };

  const getLatestContext = (): string => {
    if (aiGeneratedContent.length === 0) {
        setError('Primero procese el contexto para poder generar contenido.');
        return '';
    }
    return aiGeneratedContent.map(item => `Contexto previo (${item.type}):\n${item.content}`).join('\n\n---\n\n');
  };

  // Generar Borrador de Nota de Prensa
  const generatePressNote = async () => {
    const context = getLatestContext();
    if (!context) return;
    const prompt = `${systemPrompt}\n\nGenera un borrador de Nota de Prensa oficial para el Banco Central de Venezuela, basándote en el siguiente contexto. El borrador debe ser formal, objetivo, y defender la institucionalidad del Estado venezolano, evitando sensacionalismos y adulaciones:\n\n${context}`;
    await callGeminiAndSetContent(prompt, 'Borrador de Nota de Prensa', 'Generando nota de prensa...');
  };

  // Generar Resumen Noticioso
  const generateNewsSummary = async () => {
    const context = getLatestContext();
    if (!context) return;
    const prompt = `${systemPrompt}\n\nElabora un resumen noticioso conciso y objetivo a partir del siguiente contexto. Céntrate en los hechos verificables y las acciones de las instituciones del Estado venezolano, sin calificaciones subjetivas:\n\n${context}`;
    await callGeminiAndSetContent(prompt, 'Resumen Noticioso', 'Generando resumen noticioso...');
  };

  // Generar Sugerencias de Respuesta
  const generateResponseSuggestions = async () => {
    const context = getLatestContext();
    if (!context) return;
    const prompt = `${systemPrompt}\n\nProporciona puntos clave y líneas de mensaje para abordar temas sensibles en comunicaciones públicas, basándote en el siguiente contexto. Las sugerencias deben ser institucionales, neutrales y constructivas, en formato de lista:\n\n${context}`;
    await callGeminiAndSetContent(prompt, 'Sugerencias de Respuesta', 'Generando sugerencias...');
  };
  
  // Función para descargar contenido como archivo .docx (usando la librería docx)
  const handleDownloadDocx = (content: string, title: string) => {
    const filename = `${title.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}`;
    const doc = new Document({
      creator: "BCV Asistente de Contenido IA",
      title: title,
      styles: {
        paragraphStyles: [
          { id: "normalPara", name: "Normal Para", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 22 }, },
          { id: "heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri Light", size: 32, bold: true, color: "004B87" }, paragraph: { spacing: {after: 120, before: 240} } }
        ]
      },
      sections: [{
        children: [
          new Paragraph({ text: title, style: "heading1", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "" }), 
          // Dividir el contenido por saltos de línea y crear un párrafo para cada uno
          ...content.split('\n').map(line => new Paragraph({ text: line, style: "normalPara" })),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }).catch(err => {
      setError(`Error generando DOCX: ${err.message}`);
    });
  };

  // Función para imprimir contenido
  const printContent = (content: string) => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`<html><head><title>Imprimir Contenido BCV</title><style>body { font-family: 'Courier Prime', monospace; margin: 20px; color: #333; } pre { white-space: pre-wrap; word-wrap: break-word; }</style></head><body><pre>${content}</pre></body></html>`);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#333] font-notebook p-4 sm:p-8 flex flex-col items-center">
      {/* Encabezado */}
      <header className="w-full max-w-6xl bg-[#004B87] text-white p-4 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          {/* Placeholder para el logo del BCV - idealmente una SVG */}
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-3">
            <span className="text-[#004B87] font-bold text-xl">BCV</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">BCV Asistente de Contenido IA</h1>
        </div>
        <nav className="text-sm sm:text-base">
          <ul className="flex space-x-4">
            <li><a href="#" className="hover:underline">Inicio</a></li>
            <li><a href="#" className="hover:underline">Acerca de</a></li>
            <li><a href="#" className="hover:underline">Contacto</a></li>
          </ul>
        </nav>
      </header>
      
      {/* Contenido principal: Dos columnas */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8">
        {/* Columna de Entrada de Datos (Izquierda) */}
        <section className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-[#004B87] mb-4">Agregación de Contexto (Entradas)</h2>

          <div className="mb-6">
            <label htmlFor="file-upload" className="block text-gray-700 text-sm font-bold mb-2">Carga de Documentos (.TXT, .MD, .CSV, .JSON)</label>
            <input type="file" id="file-upload" accept=".txt,.md,.csv,.json" onChange={handleFileUpload} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" />
            {fileContent && <p className="text-xs text-gray-500 mt-2">Archivo cargado exitosamente.</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="web-search" className="block text-gray-700 text-sm font-bold mb-2">Búsqueda de Noticias en la Web</label>
            <div className="flex rounded-md shadow-sm">
              <input type="text" id="web-search" value={webSearchQuery} onChange={(e) => setWebSearchQuery(e.target.value)} placeholder="Ej: Inflación en Venezuela 2025" className="flex-1 block w-full rounded-l-lg border-gray-300 focus:ring-[#004B87] focus:border-[#004B87] p-2.5" />
            </div>
            <p className="text-xs text-gray-500 mt-1">La IA buscará en la web y resumirá la información.</p>
          </div>
          
          <div className="mb-6 opacity-50 cursor-not-allowed">
            <label htmlFor="youtube-url" className="block text-gray-700 text-sm font-bold mb-2">Transcripción de Vídeos (YouTube URL)</label>
            <input type="text" id="youtube-url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="Ej: https://www.youtube.com/watch?v=..." className="block w-full rounded-lg border-gray-300 bg-gray-100 p-2.5" disabled />
            <p className="text-xs text-gray-500 mt-1">Esta función requiere un servicio de backend no implementado.</p>
          </div>

          <div className="mb-6">
            <label htmlFor="external-text" className="block text-gray-700 text-sm font-bold mb-2">Análisis de Texto Externo</label>
            <textarea id="external-text" rows={6} value={externalText} onChange={(e) => setExternalText(e.target.value)} placeholder="Pegue aquí cualquier artículo o documento para que la IA lo analice." className="block w-full rounded-lg border-gray-300 focus:ring-[#004B87] focus:border-[#004B87] p-2.5"></textarea>
          </div>

          <button onClick={processContext} disabled={isLoading || !db || !userId} className="w-full bg-[#004B87] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center">
            {isLoading ? <><LoadingSpinner size="sm" color="text-white"/> <span className="ml-2">{loadingMessage || 'Procesando...'}</span></> : 'Procesar Contexto'}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {!db || !userId && <p className="text-yellow-600 text-sm mt-2">Esperando inicialización de Firebase y autenticación de usuario...</p>}
        </section>

        {/* Columna de Generación de Contenido (Derecha) */}
        <section className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-[#004B87] mb-4">Generación de Contenido con IA (Salidas)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button onClick={generatePressNote} disabled={isLoading || aiGeneratedContent.length === 0 || !db || !userId} className="bg-gray-200 text-[#004B87] py-2 rounded-lg font-bold hover:bg-gray-300 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Nota de Prensa</button>
            <button onClick={generateNewsSummary} disabled={isLoading || aiGeneratedContent.length === 0 || !db || !userId} className="bg-gray-200 text-[#004B87] py-2 rounded-lg font-bold hover:bg-gray-300 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Resumen Noticioso</button>
            <button onClick={generateResponseSuggestions} disabled={isLoading || aiGeneratedContent.length === 0 || !db || !userId} className="bg-gray-200 text-[#004B87] py-2 rounded-lg font-bold hover:bg-gray-300 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Sugerencias</button>
          </div>

          <div className="space-y-4 h-[60vh] max-h-[700px] overflow-y-auto pr-2">
            {aiGeneratedContent.length === 0 && !isLoading ? (
              <p className="text-gray-500 text-center py-10">El contenido generado por la IA aparecerá aquí.</p>
            ) : null}
            {isLoading && aiGeneratedContent.length === 0 ? (
                 <div className="flex items-center justify-center py-10">
                    <LoadingSpinner size="md" message={loadingMessage}/>
                 </div>
            ): null}
            {aiGeneratedContent.map((item, index) => (
              <div key={index} className="bg-[#F8F5F0] p-4 rounded-lg border border-gray-300 shadow-sm">
                <h3 className="text-lg font-bold text-[#004B87] mb-2">{item.type} <span className="text-gray-500 text-sm font-normal">({item.timestamp})</span></h3>
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">{item.content}</pre>
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => handleDownloadDocx(item.content, item.type)} className="bg-gray-300 text-[#004B87] px-3 py-1 rounded-md text-xs hover:bg-gray-400 transition duration-300 flex items-center" title="Descargar como DOCX"><Download size={14} className="mr-1"/> Descargar</button>
                  <button onClick={() => printContent(item.content)} className="bg-gray-300 text-[#004B87] px-3 py-1 rounded-md text-xs hover:bg-gray-400 transition duration-300 flex items-center" title="Imprimir contenido"><Printer size={14} className="mr-1"/> Imprimir</button>
                </div>
              </div>
            )).reverse()}
          </div>
        </section>
      </main>

      <footer className="w-full max-w-6xl bg-[#004B87] text-white text-center p-4 rounded-lg shadow-md mt-8 text-sm">
        <p>&copy; {new Date().getFullYear()} Banco Central de Venezuela. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default App;