
import React from 'react';

interface ReportSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ReportSection: React.FC<ReportSectionProps> = ({ title, icon, children, className = '' }) => {
  return (
    <section className={`bg-white p-6 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center mb-4">
        {icon && <span className="mr-3">{icon}</span>}
        <h3 className="text-xl font-semibold text-bcv-blue">{title}</h3>
      </div>
      <div className="prose prose-sm sm:prose-base max-w-none text-slate-700">
        {children}
      </div>
    </section>
  );
};

export default ReportSection;
