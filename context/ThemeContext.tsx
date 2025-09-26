'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'default' | 'nature' | 'elegant' | 'energetic' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: { id: Theme; name: string; description: string; preview: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const availableThemes = [
  {
    id: 'default' as Theme,
    name: 'Moderno Azul',
    description: 'Tema por defecto con colores azules profesionales',
    preview: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
  {
    id: 'nature' as Theme,
    name: 'Verde Naturaleza',
    description: 'Tema inspirado en la naturaleza con verdes y amarillos',
    preview: 'bg-gradient-to-r from-green-500 to-green-600'
  },
  {
    id: 'elegant' as Theme,
    name: 'Púrpura Elegante',
    description: 'Tema elegante con tonos púrpura y rosa',
    preview: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    id: 'energetic' as Theme,
    name: 'Naranja Energético',
    description: 'Tema vibrante con naranjas y amarillos',
    preview: 'bg-gradient-to-r from-orange-500 to-yellow-500'
  },
  {
    id: 'dark' as Theme,
    name: 'Oscuro Profesional',
    description: 'Tema oscuro para uso nocturno',
    preview: 'bg-gradient-to-r from-gray-800 to-gray-900'
  }
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('default');

  // Cargar tema guardado del localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('callejerusalen-theme') as Theme;
      if (savedTheme && availableThemes.some(t => t.id === savedTheme)) {
        setThemeState(savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
      } else {
        document.body.setAttribute('data-theme', 'default');
      }

      // Cargar colores personalizados si existen
      const savedColors = localStorage.getItem('callejerusalen-custom-colors');
      if (savedColors) {
        try {
          const customColors = JSON.parse(savedColors);
          applyCustomColors(customColors);
        } catch (error) {
          console.error('Error al cargar colores personalizados:', error);
        }
      }
    }
  }, []);

  // Función para aplicar colores personalizados
  const applyCustomColors = (colors: any) => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // Aplicar colores primarios
      Object.entries(colors.primary).forEach(([shade, color]) => {
        root.style.setProperty(`--primary-${shade}`, color as string);
      });
      
      // Aplicar colores secundarios
      Object.entries(colors.secondary).forEach(([shade, color]) => {
        root.style.setProperty(`--secondary-${shade}`, color as string);
      });
      
      // Actualizar gradientes
      root.style.setProperty('--gradient-primary', 
        `linear-gradient(135deg, ${colors.primary[600]}, ${colors.secondary[600]})`);
      root.style.setProperty('--gradient-secondary', 
        `linear-gradient(135deg, ${colors.secondary[500]}, ${colors.primary[500]})`);
      root.style.setProperty('--gradient-bg', 
        `linear-gradient(135deg, ${colors.primary[50]}, ${colors.secondary[50]})`);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    if (typeof window !== 'undefined') {
      // Guardar en localStorage
      localStorage.setItem('callejerusalen-theme', newTheme);
      
      // Aplicar al body
      document.body.setAttribute('data-theme', newTheme);
      
      // Agregar animación de transición
      document.body.style.transition = 'all 0.3s ease-in-out';
      
      // Remover la transición después de que termine
      setTimeout(() => {
        document.body.style.transition = '';
      }, 300);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


