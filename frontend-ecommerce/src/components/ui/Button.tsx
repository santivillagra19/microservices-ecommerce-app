import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-5 py-2.5 text-sm font-bold uppercase tracking-wide rounded-none flex items-center justify-center gap-2 transition-colors";
  
  const variants = {
    primary: "bg-[#f26522] hover:bg-[#d95316] text-white",
    secondary: "bg-black hover:bg-gray-800 text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
};
