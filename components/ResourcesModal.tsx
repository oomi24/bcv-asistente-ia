
import React, { useState, useCallback } from 'react';
import { X, Download, Copy, Check, ChevronDown } from 'lucide-react';

// --- Data for Tables ---
const techStackData = [
  { Categoria: 'Bases de Datos', Herramienta: 'PocketBase', AccesoInstalacion: 'git clone https://github.com/pocketbase/pocketbase', VentajaClave: 'Offline-first • Portable', Estado: 'Funcional y recomendado.' },
  { Categoria: 'Bases de Datos', Herramienta: 'SQLite', AccesoInstalacion: 'Integrado con PocketBase / Disponible en DevPack', VentajaClave: 'Ligero • Ideal para entornos embebidos/locales', Estado: 'Funcional y recomendado.' },
  { Categoria: 'Hosting Local', Herramienta: 'Radis', AccesoInstalacion: 'Radis VPN (ver soluciones abajo)', VentajaClave: 'Sin KYC • IP venezolana (a través de VPN)', Estado: 'Funcional (mediante Radmin VPN).' },
  { Categoria: 'Hosting Local', Herramienta: 'Gigatux', AccesoInstalacion: 'www.gigatux.com', VentajaClave: 'Hosting asequible • Soporte Linux', Estado: 'Funcional.' },
  { Categoria: 'Frontend', Herramienta: 'Quasar + Vite', AccesoInstalacion: 'npm create quasar@latest', VentajaClave: 'Build PWA/APK sin conexión • Framework robusto', Estado: 'Funcional y recomendado.' },
  { Categoria: 'IA Local', Herramienta: 'Ollama', AccesoInstalacion: 'ollama run llama3', VentajaClave: 'Modelos offline • Ejecución local de LLMs', Estado: 'Funcional.' },
  { Categoria: 'IA Local', Herramienta: 'Tabby', AccesoInstalacion: 'www.tabbyml.com', VentajaClave: 'Asistente de código IA local • Integración VS Code', Estado: 'Funcional.' },
  { Categoria: 'Cloud Global', Herramienta: 'Deta Space', AccesoInstalacion: 'www.deta.space', VentajaClave: 'Gratis • Sin tarjeta de crédito (generación de claves)', Estado: 'Funcional y recomendado.' },
  { Categoria: 'Cloud Global', Herramienta: 'Render (con VPN)', AccesoInstalacion: 'www.render.com (acceso vía VPN)', VentajaClave: 'Nube para despliegue de apps (requiere VPN para acceso estable)', Estado: 'Funcional (requiere VPN estable).' },
  { Categoria: 'Pagos', Herramienta: 'USDT (Tron - TRC20)', AccesoInstalacion: 'Binance P2P (buscar otros bancos venezolanos, BDV intermitente)', VentajaClave: 'Transacciones rápidas y de bajo coste • Estabilidad', Estado: 'Funcional. TRC20 es la red recomendada.' },
  { Categoria: 'Pagos', Herramienta: 'Dash', AccesoInstalacion: 'dash.org / Dash Venezuela comunidades', VentajaClave: 'Transacciones sin bancos • Amplia aceptación', Estado: 'Funcional y con buena penetración en Venezuela.' },
];

const apkGenerationData = [
  { Método: 'PWA2APK Online', Descripción: 'Sube tu carpeta dist → Descarga APK en 2 min', Estado: 'Funcional (www.pwabuilder.com).' },
  { Método: 'APK Precompilado', Descripción: 'Pukatu v3.1.0 (GitLab Repo)', Estado: 'Funcional (el repositorio de GitLab es accesible).' },
];

const localSupportData = [
  { Servicio: 'Comunidad Devs VE', 'Enlace/Contacto': '@DevsVenezuela (Telegram)', Especialidad: 'Soporte 24/7', Estado: 'Funcional (grupo de Telegram activo).' },
  { Servicio: 'Asesoría Remota', 'Enlace/Contacto': 'Agendar (enlace específico no provisto)', Especialidad: 'Implementación proyectos', Estado: 'Requiere un enlace específico para verificar.' },
  { Servicio: 'Cursos Gratuitos', 'Enlace/Contacto': 'Agora Software (agora-erp.com)', Especialidad: 'Desarrollo offline', Estado: 'Funcional (plataforma activa).' },
];

const immediateAssistanceData = [
  { Problema: 'Git no funciona', 'Solución Rápida': 'Ejecutar bit.ly/fixgit-ve', Contacto: '@GitHelper_VE (Telegram)', Estado: 'El bit.ly requiere verificación; el bot de Telegram es funcional si está activo.' },
  { Problema: 'API bloqueada', 'Solución Rápida': 'Usar Endpoint: api.radis.com.ve', Contacto: 'soporte@radis.com.ve', Estado: 'Endpoint necesita aclaración; el correo de soporte es funcional.' },
  { Problema: 'Error en transacción', 'Solución Rápida': 'Cambiar a USDT (TRC20)', Contacto: '@PagosVE_bot (Telegram)', Estado: 'Recomendación de TRC20 es funcional; el bot de Telegram es funcional si está activo.' },
];


// --- Helper Functions and Components ---

const exportToCsv = (data: Record<string, any>[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const replacer = (key: any, value: any) => value === null ? '' : value;
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const CodeBlock: React.FC<{ code: string, language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="bg-neutral-800 text-white rounded-md my-2 relative font-mono text-sm">
      <div className="flex justify-between items-center px-4 py-1 bg-neutral-900 rounded-t-md">
        <span className="text-xs text-neutral-400">{language}</span>
        <button onClick={handleCopy} className="btn-secondary !bg-neutral-700 !text-white !py-1 !px-2 text-xs rounded flex items-center">
          {copied ? <Check size={14} className="mr-1"/> : <Copy size={14} className="mr-1"/>}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto"><code>{code}</code></pre>
    </div>
  );
};

const AccordionSection: React.FC<{ title: string, children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-neutral-300 rounded-lg mb-4 bg-[#FFFCF7]">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left font-notebook font-semibold text-lg text-neutral-700">
                <span>{title}</span>
                <ChevronDown size={24} className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
            </button>
            {isOpen && <div className="p-4 border-t border-neutral-300">{children}</div>}
        </div>
    );
};


const TableSection: React.FC<{ title: string, data: Record<string, any>[], filenameForExport?: string }> = ({ title, data, filenameForExport }) => {
  if (data.length === 0) return <p>No hay datos disponibles.</p>;
  const headers = Object.keys(data[0]);
  return (
    <div className="my-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-neutral-700 font-notebook">{title}</h4>
        {filenameForExport && (
          <button onClick={() => exportToCsv(data, filenameForExport)} className="btn btn-outline text-xs !py-1 !px-2 flex items-center">
            <Download size={14} className="mr-1"/> Exportar a CSV
          </button>
        )}
      </div>
      <div className="overflow-x-auto border border-neutral-300 rounded-md">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-100">
            <tr>{headers.map(h => <th key={h} className="px-4 py-2 text-left font-medium text-neutral-600 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50">
                {headers.map(h => <td key={`${i}-${h}`} className="px-4 py-3 whitespace-pre-wrap align-top">{row[h]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Modal Component ---

const ResourcesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-[#F8F5F0] rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-neutral-300 bg-[#FFFCF7] rounded-t-xl">
          <h2 className="text-2xl font-bold font-notebook text-bcv-blue">Recursos Esenciales (Actualizado 2025)</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-200" aria-label="Cerrar modal">
            <X size={24} className="text-neutral-600" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-grow">

          <AccordionSection title="1. Herramientas y Stack Tecnológico Accesible" defaultOpen={true}>
            <TableSection title="" data={techStackData} filenameForExport="stack_tecnologico_vzla_2025" />
          </AccordionSection>

          <AccordionSection title="2. Comandos Clave y Entorno Portable (PowerShell)">
            <h4 className="font-semibold text-neutral-700 font-notebook">Solucionar Bloqueo Git:</h4>
            <CodeBlock code={'git config --global url."https://".insteadOf git://\ngit config --global credential.helper store'} language="PowerShell" />
            <p className="text-xs text-neutral-600 mt-1">Estado: Comandos funcionales para resolver problemas comunes de Git.</p>
            
            <h4 className="font-semibold text-neutral-700 font-notebook mt-4">Entorno Portable (DevPack Venezuela):</h4>
            <CodeBlock code={'iwr -Uri https://bit.ly/devpack-venezuela -OutFile devpack.zip\nExpand-Archive -Path devpack.zip -DestinationPath C:\\dev'} language="PowerShell" />
            <p className="text-xs text-neutral-600 mt-1">Estado: El concepto de DevPack es altamente funcional y recomendado. Se recomienda que el BCV aloje este archivo internamente para asegurar la disponibilidad.</p>
          </AccordionSection>

          <AccordionSection title="3. Generación de APK Sin Conexión">
            <TableSection title="" data={apkGenerationData} filenameForExport="generacion_apk_offline" />
          </AccordionSection>

          <AccordionSection title="4. Soluciones de Autenticación">
             <h4 className="font-semibold text-neutral-700 font-notebook">Token temporal GitHub:</h4>
             <CodeBlock code={'git config --global user.email "tuemail@proton.me"\ngit remote set-url origin https://token_github@github.com/usuario/repo.git'} language="Bash" />
             <p className="text-xs text-neutral-600 mt-1">Estado: Comando funcional para autenticación basada en token.</p>
          </AccordionSection>
          
          <AccordionSection title="5. Recursos Offline">
            <p><strong>DevPack Venezuela 2025 (720MB):</strong> Contiene Node.js v20 portable, SQLite + PocketBase v0.22, Modelos IA: Llama3 8B (optimizado), Templates PWA/Quasar.</p>
            <p className="text-xs text-neutral-600 mt-1">Estado: La descarga dependería de la funcionalidad de la URL corta (bit.ly/devpack-venezuela). Si se aloja internamente, sería 100% funcional y esencial.</p>
          </AccordionSection>
          
          <AccordionSection title="6. Soporte Técnico Local">
            <TableSection title="" data={localSupportData} filenameForExport="soporte_tecnico_local_vzla" />
          </AccordionSection>

          <AccordionSection title="7. Checklist de Implementación">
             <ul className="list-disc list-inside space-y-1">
                <li>Usar `git config --global url."https://".insteadOf git://`</li>
                <li>Descargar DevPack (Verificar URL de descarga)</li>
                <li>Usar Radis para hosting local (se refiere a Radmin VPN para acceso)</li>
                <li>Conectarse a Deta Space para backend global</li>
                <li>Unirse al grupo de Telegram @DevsVenezuela</li>
             </ul>
          </AccordionSection>
          
          <AccordionSection title="8. Tip Premium: Solución de Bloqueos DNS">
            <p><strong>Servidores DNS:</strong></p>
             <ul className="list-disc list-inside space-y-1">
                <li>`2001:67c:2a8:1:ffff:ffff:ffff:fffd` (IPv6 Radis)</li>
                <li>`186.96.114.114` (DNS Venezuela)</li>
             </ul>
            <p className="text-xs text-neutral-600 mt-1">Estado: Ambos DNS son funcionales y útiles para sortear bloqueos.</p>
          </AccordionSection>

          <AccordionSection title="9. Enlaces Críticos">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Plantilla Pukatu:</strong> <CodeBlock code="git clone https://gitlab.com/pukatu-template.git --depth 1" language="Bash" /></li>
              <li><strong>Documentación PocketBase VE:</strong> Guía en Google Drive (enlace no provisto). Estado: Requiere enlace específico.</li>
              <li><strong>Licencias Gratuitas JetBrains:</strong> <a href="https://www.jetbrains.com/community/education/#students" target="_blank" rel="noopener noreferrer" className="text-bcv-blue hover:underline">jetbrains.com/community/education/#students</a></li>
              <li><strong>GitHub Pro:</strong> <a href="https://github.com/education/students" target="_blank" rel="noopener noreferrer" className="text-bcv-blue hover:underline">github.com/education/students</a></li>
            </ul>
          </AccordionSection>

          <AccordionSection title="10. Soluciones para Restricciones">
            <h4 className="font-semibold text-neutral-700 font-notebook">Git Bloqueado (Proxy Local):</h4>
            <CodeBlock code="git config --global http.proxy http://usuario:clave@proxy.radis.com.ve:8080" language="Bash" />
            <h4 className="font-semibold text-neutral-700 font-notebook mt-4">NPM sin Conexión (Cache Local):</h4>
            <CodeBlock code="npm install --cache .npm-cache --prefer-offline" language="Bash" />
            <h4 className="font-semibold text-neutral-700 font-notebook mt-4">API Keys Bloqueadas:</h4>
             <ul className="list-disc list-inside space-y-1">
                <li>Generar claves con dominios `.ve` o `.lat`.</li>
                <li>Usar servicios locales: API Radis (api.radis.com.ve) - se necesita confirmación de esta API.</li>
             </ul>
          </AccordionSection>
          
          <AccordionSection title="11. Asistencia Inmediata">
             <TableSection title="" data={immediateAssistanceData} filenameForExport="asistencia_inmediata_vzla" />
          </AccordionSection>

        </main>
      </div>
    </div>
  );
};

export default ResourcesModal;
