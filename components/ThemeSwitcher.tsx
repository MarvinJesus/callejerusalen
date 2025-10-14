'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Palette, Check, ChevronDown } from 'lucide-react';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = availableThemes.find(t => t.id === theme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-primary-300 transition-all duration-200 shadow-sm hover:shadow-md"
        title="Cambiar tema"
      >
        <Palette className="w-4 h-4 text-primary-600" />
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {currentTheme?.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el menú */}
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menú de temas */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[101] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Seleccionar Tema</h3>
              <p className="text-sm text-gray-600">Elige el estilo que más te guste</p>
            </div>
            
            <div className="p-2">
              {availableThemes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    setTheme(themeOption.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    theme === themeOption.id
                      ? 'bg-primary-50 border-2 border-primary-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  {/* Preview del tema */}
                  <div className={`w-8 h-8 rounded-lg ${themeOption.preview} shadow-sm`} />
                  
                  {/* Información del tema */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{themeOption.name}</h4>
                      {theme === themeOption.id && (
                        <Check className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{themeOption.description}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                El tema se guardará automáticamente
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;










