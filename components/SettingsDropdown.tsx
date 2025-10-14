'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Settings, Palette, Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import ThemeConfigModal from './ThemeConfigModal';

const SettingsDropdown: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const currentTheme = availableThemes.find(t => t.id === theme);

  const getThemeIcon = (themeId: string) => {
    switch (themeId) {
      case 'nature':
        return <Sun className="w-4 h-4 text-white" />;
      case 'elegant':
        return <Palette className="w-4 h-4 text-white" />;
      case 'energetic':
        return <Sun className="w-4 h-4 text-white" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-white" />;
      default:
        return <Monitor className="w-4 h-4 text-white" />;
    }
  };

  const getThemeColors = (themeId: string) => {
    const colors = {
      default: {
        primary: '#3b82f6',
        secondary: '#0ea5e9',
        accent: '#2563eb'
      },
      nature: {
        primary: '#22c55e',
        secondary: '#84cc16',
        accent: '#16a34a'
      },
      elegant: {
        primary: '#a855f7',
        secondary: '#d946ef',
        accent: '#9333ea'
      },
      energetic: {
        primary: '#f97316',
        secondary: '#eab308',
        accent: '#ea580c'
      },
      dark: {
        primary: '#cbd5e1',
        secondary: '#94a3b8',
        accent: '#e2e8f0'
      }
    };
    
    return colors[themeId as keyof typeof colors] || colors.default;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-primary-300 transition-all duration-200 shadow-sm hover:shadow-md"
        title="Configuración"
      >
        <Settings className="w-5 h-5 text-primary-600" />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el menú */}
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menú de configuración */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[101] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
              <p className="text-sm text-gray-600">Personaliza tu experiencia</p>
            </div>
            
            {/* Sección de Tema */}
            <div className="p-2">
              <div className="px-3 py-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Palette className="w-4 h-4 text-primary-600" />
                  <span>Tema de la aplicación</span>
                </div>
                
                <button
                  onClick={() => {
                    setIsThemeModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 border-2 border-transparent"
                >
                  {/* Icono del tema actual */}
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: getThemeColors(theme).primary }}
                  >
                    {getThemeIcon(theme)}
                  </div>
                  
                  {/* Información del tema actual */}
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900">{currentTheme?.name}</h4>
                    <p className="text-sm text-gray-600">Configurar tema y colores</p>
                  </div>
                  
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Sección de otras configuraciones (para futuras implementaciones) */}
            <div className="p-2 border-t border-gray-100">
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Próximamente
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-sm text-gray-600">Notificaciones</div>
                    <div className="text-xs text-gray-500">Configurar alertas y notificaciones</div>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-sm text-gray-600">Idioma</div>
                    <div className="text-xs text-gray-500">Seleccionar idioma de la aplicación</div>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-sm text-gray-600">Privacidad</div>
                    <div className="text-xs text-gray-500">Configurar opciones de privacidad</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Las configuraciones se guardan automáticamente
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* Modal de configuración de tema */}
      <ThemeConfigModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
};

export default SettingsDropdown;
