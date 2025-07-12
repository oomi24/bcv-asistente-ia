
import React from 'react';
// import { GeneratedVisualization } from '../types'; // This type would be removed
import { Image as ImageIcon } from 'lucide-react'; 

interface VisualizationsSectionProps {
  visualizations: { title: string; url: string }[]; // Simplified for placeholder
}

const VisualizationsSection: React.FC<VisualizationsSectionProps> = ({ visualizations }) => {
  if (!visualizations || visualizations.length === 0) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
                <ImageIcon className="h-6 w-6 text-bcv-blue mr-3" />
                <h3 className="text-xl font-semibold text-bcv-blue">Visualizaciones</h3>
            </div>
            <p className="text-slate-600">No hay visualizaciones disponibles.</p>
        </div>
    );
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <ImageIcon className="h-6 w-6 text-bcv-blue mr-3" />
        <h3 className="text-xl font-semibold text-bcv-blue">Visualizaciones Clave</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visualizations.map((vis, index) => (
          <div key={index} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
            <h4 className="text-md font-medium text-slate-700 p-3 bg-slate-50 border-b border-slate-200">{vis.title}</h4>
            {vis.url.startsWith('data:image') ? (
               <img 
                src={vis.url} 
                alt={vis.title} 
                className="w-full h-auto object-contain bg-slate-100"
              />
            ) : (
              <div className="w-full h-[315px] flex items-center justify-center bg-slate-100"> 
                <img 
                  src={vis.url} 
                  alt={`Placeholder: ${vis.title}`} 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
                <a 
                    href={vis.url} 
                    download={`${vis.title.replace(/\s+/g, '_').toLowerCase()}.png`}
                    className="text-sm text-bcv-blue hover:underline"
                >
                    Descargar imagen
                </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VisualizationsSection;
