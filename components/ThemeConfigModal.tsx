'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { 
  X, 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Check, 
  RotateCcw, 
  Save,
  Download,
  Upload
} from 'lucide-react';

interface ThemeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThemeColors {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

// Obtener icono del tema
const getThemeIcon = (themeId: string, textColorClass: string = '') => {
  switch (themeId) {
    case 'default':
      return <Monitor className={`w-5 h-5 ${textColorClass}`} />;
    case 'nature':
      return <Sun className={`w-5 h-5 ${textColorClass}`} />;
    case 'elegant':
      return <Palette className={`w-5 h-5 ${textColorClass}`} />;
    case 'energetic':
      return <Sun className={`w-5 h-5 ${textColorClass}`} />;
    case 'dark':
      return <Moon className={`w-5 h-5 ${textColorClass}`} />;
    default:
      return <Palette className={`w-5 h-5 ${textColorClass}`} />;
  }
};

// Obtener colores de cada tema (para vista previa)
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

// Obtener todos los tonos de colores de cada tema (para personalización)
const getFullThemeColors = (themeId: string): ThemeColors => {
  const themeColors = {
    default: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },
      secondary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e'
      }
    },
    nature: {
      primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
      },
      secondary: {
        50: '#f7fee7',
        100: '#ecfccb',
        200: '#d9f99d',
        300: '#bef264',
        400: '#a3e635',
        500: '#84cc16',
        600: '#65a30d',
        700: '#4d7c0f',
        800: '#3f6212',
        900: '#365314'
      }
    },
    elegant: {
      primary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87'
      },
      secondary: {
        50: '#fdf4ff',
        100: '#fae8ff',
        200: '#f5d0fe',
        300: '#f0abfc',
        400: '#e879f9',
        500: '#d946ef',
        600: '#c026d3',
        700: '#a21caf',
        800: '#86198f',
        900: '#701a75'
      }
    },
    energetic: {
      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12'
      },
      secondary: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12'
      }
    },
    dark: {
      primary: {
        50: '#1e293b',
        100: '#334155',
        200: '#475569',
        300: '#64748b',
        400: '#94a3b8',
        500: '#cbd5e1',
        600: '#e2e8f0',
        700: '#f1f5f9',
        800: '#f8fafc',
        900: '#ffffff'
      },
      secondary: {
        50: '#0f172a',
        100: '#1e293b',
        200: '#334155',
        300: '#475569',
        400: '#64748b',
        500: '#94a3b8',
        600: '#cbd5e1',
        700: '#e2e8f0',
        800: '#f1f5f9',
        900: '#f8fafc'
      }
    }
  };
  
  return themeColors[themeId as keyof typeof themeColors] || themeColors.default;
};

const ThemeConfigModal: React.FC<ThemeConfigModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, availableThemes } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [customColors, setCustomColors] = useState<ThemeColors | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(true);

  // Efecto para inicializar el tema seleccionado y colores cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedTheme(theme);
      const themeColors = getFullThemeColors(theme);
      setCustomColors(themeColors);
    }
  }, [isOpen, theme]);

  // Efecto para actualizar colores personalizados cuando cambia el tema seleccionado
  useEffect(() => {
    if (isCustomizing && customColors) {
      const newThemeColors = getFullThemeColors(selectedTheme);
      setCustomColors(newThemeColors);
      applyCustomTheme(newThemeColors);
    }
  }, [selectedTheme, isCustomizing]);

  // Cargar colores personalizados del localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedColors = localStorage.getItem('callejerusalen-custom-colors');
      if (savedColors) {
        try {
          const parsedColors = JSON.parse(savedColors);
          setCustomColors(parsedColors);
        } catch (error) {
          console.error('Error al cargar colores personalizados:', error);
        }
      }
    }
  }, []);

  // Guardar colores personalizados en localStorage
  const saveCustomColors = (colors: ThemeColors) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('callejerusalen-custom-colors', JSON.stringify(colors));
      setCustomColors(colors);
    }
  };

  // Aplicar tema personalizado
  const applyCustomTheme = (colors: ThemeColors) => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      Object.entries(colors.primary).forEach(([shade, color]) => {
        root.style.setProperty(`--primary-${shade}`, color);
      });
      
      Object.entries(colors.secondary).forEach(([shade, color]) => {
        root.style.setProperty(`--secondary-${shade}`, color);
      });
      
      root.style.setProperty('--gradient-primary', 
        `linear-gradient(135deg, ${colors.primary[600]}, ${colors.secondary[600]})`);
      root.style.setProperty('--gradient-secondary', 
        `linear-gradient(135deg, ${colors.secondary[500]}, ${colors.primary[500]})`);
      root.style.setProperty('--gradient-bg', 
        `linear-gradient(135deg, ${colors.primary[50]}, ${colors.secondary[50]})`);
    }
  };

  // Restaurar tema por defecto
  const resetToDefault = () => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const defaultTheme = availableThemes.find(t => t.id === selectedTheme);
      
      if (defaultTheme) {
        Object.keys({ primary: {}, secondary: {} }).forEach(colorType => {
          for (let i = 50; i <= 900; i += 50) {
            root.style.removeProperty(`--${colorType}-${i}`);
          }
        });
        
        document.body.setAttribute('data-theme', selectedTheme);
        setCustomColors(null);
        localStorage.removeItem('callejerusalen-custom-colors');
      }
    }
  };

  // Exportar configuración de tema
  const exportTheme = () => {
    const themeData = {
      theme: selectedTheme,
      customColors: customColors,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `callejerusalen-theme-${selectedTheme}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Importar configuración de tema
  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const themeData = JSON.parse(e.target?.result as string);
          if (themeData.theme && themeData.customColors) {
            setSelectedTheme(themeData.theme);
            setCustomColors(themeData.customColors);
            saveCustomColors(themeData.customColors);
            applyCustomTheme(themeData.customColors);
          }
        } catch (error) {
          console.error('Error al importar tema:', error);
          alert('Error al importar el archivo de tema');
        }
      };
      reader.readAsText(file);
    }
  };

  // Actualizar color personalizado
  const updateCustomColor = (colorType: 'primary' | 'secondary', shade: string, value: string) => {
    if (customColors) {
      const updatedColors = {
        ...customColors,
        [colorType]: {
          ...customColors[colorType],
          [shade]: value
        }
      };
      setCustomColors(updatedColors);
      
      // Aplicar cambios automáticamente
      applyCustomTheme(updatedColors);
    }
  };

  // Aplicar tema seleccionado
  const applyTheme = () => {
    setTheme(selectedTheme);
    if (customColors && isCustomizing) {
      saveCustomColors(customColors);
    }
    onClose();
  };

  // Aplicar tema inmediatamente (sin cerrar el modal)
  const applyThemeNow = () => {
    setTheme(selectedTheme);
    if (customColors && isCustomizing) {
      saveCustomColors(customColors);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Configuración de Tema</h2>
              <p className="text-sm text-gray-600">
                {customColors && isCustomizing ? 'Tema personalizado' : `Tema: ${availableThemes.find(t => t.id === selectedTheme)?.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={applyTheme}
              className="btn-theme-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Aplicar Tema</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar - Selección de tema */}
          <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Temas Disponibles</h3>
            
            <div className="space-y-3 mb-6">
              {availableThemes.map((themeOption) => {
                const themeColors = getThemeColors(themeOption.id);
                return (
                  <button
                    key={themeOption.id}
                    onClick={() => setSelectedTheme(themeOption.id)}
                    className={`w-full p-4 rounded-lg transition-all duration-200 ${
                      selectedTheme === themeOption.id
                        ? 'bg-primary-50 border-2 border-primary-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="flex items-center justify-center w-10 h-10 rounded-lg shadow-sm"
                        style={{ backgroundColor: getThemeColors(themeOption.id).primary }}
                      >
                        {getThemeIcon(themeOption.id, 'text-white')}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{themeOption.name}</h4>
                          {themeOption.id === theme && (
                            <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                              Actual
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{themeOption.description}</p>
                      </div>
                      {selectedTheme === themeOption.id && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    
                    {/* Vista previa de colores */}
                    <div className="mt-3 flex items-center justify-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: themeColors.primary }}
                          title={`Primario: ${themeColors.primary}`}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: themeColors.secondary }}
                          title={`Secundario: ${themeColors.secondary}`}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: themeColors.accent }}
                          title={`Acento: ${themeColors.accent}`}
                        />
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <div 
                          className="w-6 h-3 rounded"
                          style={{ 
                            background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.secondary})` 
                          }}
                          title="Gradiente principal"
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Herramientas */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Herramientas</h4>
              
              <button
                onClick={() => {
                  const themeColors = getFullThemeColors(selectedTheme);
                  setCustomColors(themeColors);
                  setIsCustomizing(true);
                  applyCustomTheme(themeColors);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cargar Colores del Tema</span>
              </button>
              
              <button
                onClick={exportTheme}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Tema</span>
              </button>
              
              <label className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Importar Tema</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importTheme}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Personalizar Colores</h3>
              </div>

              {customColors ? (
                <>
                  {/* Colores Primarios */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Colores Primarios</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(customColors.primary).map(([shade, color]) => (
                        <div key={shade} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Primario {shade}
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => updateCustomColor('primary', shade, e.target.value)}
                              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={color}
                              onChange={(e) => updateCustomColor('primary', shade, e.target.value)}
                              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Colores Secundarios */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Colores Secundarios</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(customColors.secondary).map(([shade, color]) => (
                        <div key={shade} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Secundario {shade}
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => updateCustomColor('secondary', shade, e.target.value)}
                              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={color}
                              onChange={(e) => updateCustomColor('secondary', shade, e.target.value)}
                              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vista previa del tema */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Vista Previa</h4>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="h-4 rounded" style={{ backgroundColor: customColors.primary[500] }}></div>
                          <div className="h-3 rounded" style={{ backgroundColor: customColors.primary[300] }}></div>
                          <div className="h-2 rounded" style={{ backgroundColor: customColors.primary[100] }}></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 rounded" style={{ backgroundColor: customColors.secondary[500] }}></div>
                          <div className="h-3 rounded" style={{ backgroundColor: customColors.secondary[300] }}></div>
                          <div className="h-2 rounded" style={{ backgroundColor: customColors.secondary[100] }}></div>
                        </div>
                      </div>
                      <div className="mt-4 h-6 rounded" style={{ 
                        background: `linear-gradient(90deg, ${customColors.primary[500]}, ${customColors.secondary[500]})` 
                      }}></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Palette className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona un tema para comenzar a personalizar</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ThemeConfigModal;