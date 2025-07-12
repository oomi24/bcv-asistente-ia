
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { AiGeneratedContentItem } from './types';
import { searchNewsWithGemini, generateTextGemini } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import { Search, Download, Printer } from 'lucide-react';

const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [webSearchQuery, setWebSearchQuery] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [externalText, setExternalText] = useState<string>('');
  const [aiGeneratedContent, setAiGeneratedContent] = useState<AiGeneratedContentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>('');
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("La variable de entorno API_KEY no está configurada.");
      }
      setAi(new GoogleGenAI({ apiKey }));
    } catch (e: any) {
      setError(`Error inicializando Gemini SDK: ${e.message}`);
    }
  }, []);
  
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

  const callGeminiAndSetContent = async (prompt: string, type: string, loadingMsg: string) => {
    if (!ai) {
      setError("Gemini SDK no está inicializado.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage(loadingMsg);
    setError(null);
    try {
      const resultText = await generateTextGemini(ai, prompt);
      setAiGeneratedContent(prev => [...prev, { type, content: resultText, timestamp: new Date().toLocaleString() }]);
    } catch (err: any) {
      setError(err.message || `Error al comunicarse con la IA`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const processContext = async () => {
    if (!fileContent && !webSearchQuery && !externalText) {
      setError('Por favor, proporcione al menos una fuente de contexto (archivo, búsqueda web o texto externo).');
      return;
    }
    
    let fullContext = '';
    if (fileContent) fullContext += `Contenido del archivo subido:\n${fileContent}\n\n`;
    if (externalText) fullContext += `Texto externo para analizar:\n${externalText}\n\n`;

    if (webSearchQuery) {
        if (!ai) {
          setError("Gemini SDK no está inicializado.");
          return;
        }
        setIsLoading(true);
        setLoadingMessage(`Buscando en la web sobre: "${webSearchQuery}"`);
        setError(null);
        try {
            const { textResponse, searchResults } = await searchNewsWithGemini(ai, webSearchQuery);
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
      const analysisPrompt = `Analiza y resume el siguiente contenido, extrayendo los puntos clave relevantes para un contexto económico-financiero institucional. Sé conciso y objetivo:\n\n${fullContext}`;
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

  const generatePressNote = async () => {
    const context = getLatestContext();
    if (!context) return;
    const prompt = `Genera un borrador de Nota de Prensa oficial para el Banco Central de Venezuela, basándote en el siguiente contexto. El borrador debe ser formal, objetivo, y estar alineado con la comunicación institucional:\n\n${context}`;
    await callGeminiAndSetContent(prompt, 'Borrador de Nota de Prensa', 'Generando nota de prensa...');
  };

  const generateNewsSummary = async () => {
    const context = getLatestContext();
    if (!context) return;
    const prompt = `Elabora un resumen noticioso conciso y objetivo a partir del siguiente contexto. Céntrate en los hechos verificables y las acciones institucionales:\n\n${context}`;
    await callGeminiAndSetContent(prompt, 'Resumen Noticioso', 'Generando resumen noticioso...');
  };

  const generateResponseSuggestions = async () => {
    const context = getLatestContext();
    if (!context) return;
    const prompt = `Proporciona puntos clave y líneas de mensaje para abordar temas sensibles en comunicaciones públicas, basándote en el siguiente contexto. Las sugerencias deben ser institucionales, neutrales y constructivas, en formato de lista:\n\n${context}`;
    await callGeminiAndSetContent(prompt, 'Sugerencias de Respuesta', 'Generando sugerencias...');
  };
  
  const handleDownloadDocx = (content: string, title: string) => {
    const filename = `${title.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}`;
    const doc = new Document({
      creator: "BCV Asistente de Contenido IA",
      title: title,
      styles: {
        paragraphStyles: [ { id: "normalPara", name: "Normal Para", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 22 }, }, { id: "heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri Light", size: 32, bold: true, color: "004B87" }, paragraph: { spacing: {after: 120, before: 240} } } ]
      },
      sections: [{
        children: [
          new Paragraph({ text: title, style: "heading1", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "" }), 
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

  const printContent = (content: string) => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`<html><head><title>Imprimir Contenido BCV</title><style>body { font-family: 'Courier Prime', monospace; margin: 20px; color: #333; } pre { white-space: pre-wrap; word-wrap: break-word; }</style></head><body><pre>${content}</pre></body></html>`);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#333] font-notebook p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl bg-[#004B87] text-white p-4 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
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
      
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8">
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

          <button onClick={processContext} disabled={isLoading} className="w-full bg-[#004B87] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center">
            {isLoading ? <><LoadingSpinner size="sm" color="text-white"/> <span className="ml-2">{loadingMessage || 'Procesando...'}</span></> : 'Procesar Contexto'}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </section>

        <section className="lg:w-1/2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-[#004B87] mb-4">Generación de Contenido con IA (Salidas)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button onClick={generatePressNote} disabled={isLoading || aiGeneratedContent.length === 0} className="bg-gray-200 text-[#004B87] py-2 rounded-lg font-bold hover:bg-gray-300 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Nota de Prensa</button>
            <button onClick={generateNewsSummary} disabled={isLoading || aiGeneratedContent.length === 0} className="bg-gray-200 text-[#004B87] py-2 rounded-lg font-bold hover:bg-gray-300 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Resumen Noticioso</button>
            <button onClick={generateResponseSuggestions} disabled={isLoading || aiGeneratedContent.length === 0} className="bg-gray-200 text-[#004B87] py-2 rounded-lg font-bold hover:bg-gray-300 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Sugerencias</button>
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
