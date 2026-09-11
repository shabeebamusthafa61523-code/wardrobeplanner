import React from 'react';

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    neutral: 'bg-sand-200 text-sand-800 border-sand-300',
    primary: 'bg-slate-900 text-white',
    warning: 'bg-amber-100 text-amber-900 border-amber-300',
    success: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accent: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
        variants[variant] || variants.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
};
