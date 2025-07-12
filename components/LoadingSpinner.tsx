
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  inline?: boolean; // New prop for inline display
  message?: string; // Optional message next to spinner
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-bcv-blue', inline = false, message }) => {
  let dimension = 'h-8 w-8';
  if (size === 'sm') dimension = 'h-5 w-5';
  if (size === 'lg') dimension = 'h-12 w-12';

  const spinner = (
    <div 
      className={`animate-spin rounded-full ${dimension} border-t-2 border-b-2 
      ${color === 'text-bcv-blue' ? 'border-t-bcv-blue border-b-bcv-blue border-transparent' : 
      `${color.replace('text-', 'border-t-').replace('text-', 'border-b-')} border-transparent`}`}
      role="status" 
      aria-live="polite"
      aria-label={message || "Cargando"}
    >
      <span className="sr-only">{message || "Cargando..."}</span>
    </div>
  );

  if (inline) {
    return (
      <div className="flex items-center">
        {spinner}
        {message && <span className={`ml-2 ${color}`}>{message}</span>}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
