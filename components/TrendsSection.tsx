
import React from 'react';
import { Trend } from '../types'; // This type would need to be updated or removed from types.ts
import { TrendingUp, ExternalLink, BarChart, Smile, Meh, Frown } from 'lucide-react';

interface TrendsSectionProps {
  trends: Trend[]; // Trend type would need to align with new data or be removed
}

const SentimentIcon: React.FC<{ sentiment: Trend['sentimiento']}> = ({ sentiment }) => {
  switch (sentiment?.toLowerCase()) {
    case 'positivo': return <Smile className="h-5 w-5 text-green-500" />;
    case 'neutral': return <Meh className="h-5 w-5 text-yellow-500" />;
    case 'negativo': return <Frown className="h-5 w-5 text-red-500" />;
    default: return <BarChart className="h-5 w-5 text-slate-400" />;
  }
};

const TrendsSection: React.FC<TrendsSectionProps> = ({ trends }) => {
  if (!trends || trends.length === 0) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
                <TrendingUp className="h-6 w-6 text-bcv-blue mr-3" />
                <h3 className="text-xl font-semibold text-bcv-blue">Tendencias Principales</h3>
            </div>
            <p className="text-slate-600">No hay tendencias destacadas para mostrar.</p>
        </div>
    );
  }
  return (
    <section className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center mb-4">
        <TrendingUp className="h-6 w-6 text-bcv-blue mr-3" />
        <h3 className="text-xl font-semibold text-bcv-blue">Tendencias Principales</h3>
      </div>
      <div className="space-y-4">
        {trends.map((trend, index) => (
          <div key={index} className="p-4 border border-slate-200 rounded-md hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-slate-800 flex-1 pr-2">{trend.tema}</h4>
              {trend.url && (
                <a
                  href={trend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bcv-blue hover:text-blue-700 transition-colors text-sm flex items-center"
                  title={`Leer más en ${trend.fuente || 'fuente original'}`}
                >
                  <ExternalLink size={16} className="mr-1" />
                  Fuente
                </a>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-1 text-slate-400" />
                <span>Frecuencia: {trend.frecuencia}</span>
                 {trend.fuente && <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded">Fuente: {trend.fuente}</span>}
              </div>
              <div className="flex items-center">
                <SentimentIcon sentiment={trend.sentimiento} />
                <span className="ml-1 capitalize">{trend.sentimiento}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendsSection;
