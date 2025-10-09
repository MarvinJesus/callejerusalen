'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalAlert } from '@/context/GlobalAlertContext';
import { X, AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';

const GlobalAlertBanner: React.FC = () => {
  const { alerts, hideAlert } = useGlobalAlert();
  const [visibleAlerts, setVisibleAlerts] = useState<string[]>([]);

  // Log solo cuando hay cambios importantes
  if (alerts.length > 0) {
    console.log('🎨 GlobalAlertBanner - Alertas:', alerts.length, '| Visibles:', visibleAlerts.length);
  }

  useEffect(() => {
    // Agregar animación de entrada para nuevas alertas
    alerts.forEach(alert => {
      if (!visibleAlerts.includes(alert.id)) {
        console.log('➕ Mostrando alerta:', alert.id, '|', alert.message.substring(0, 50) + '...');
        setTimeout(() => {
          setVisibleAlerts(prev => [...prev, alert.id]);
        }, 10);
      }
    });
  }, [alerts, visibleAlerts]);

  const handleClose = (id: string) => {
    console.log('❌ Cerrando alerta:', id);
    // Animación de salida
    setVisibleAlerts(prev => prev.filter(alertId => alertId !== id));
    setTimeout(() => {
      hideAlert(id);
    }, 300);
  };

  if (alerts.length === 0) {
    console.log('👻 No hay alertas, no renderizando nada');
    return null;
  }

  console.log('✨ Renderizando', alerts.length, 'alertas');

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999]" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div className="flex flex-col gap-2 p-4" style={{ pointerEvents: 'auto' }}>
        {alerts.map((alert) => {
          const isVisible = visibleAlerts.includes(alert.id);
          
          // Colores según el tipo
          const colors = {
            warning: {
              bg: 'bg-yellow-50 border-yellow-400',
              text: 'text-yellow-800',
              icon: 'text-yellow-600',
              iconBg: 'bg-yellow-100',
            },
            error: {
              bg: 'bg-red-50 border-red-400',
              text: 'text-red-800',
              icon: 'text-red-600',
              iconBg: 'bg-red-100',
            },
            info: {
              bg: 'bg-blue-50 border-blue-400',
              text: 'text-blue-800',
              icon: 'text-blue-600',
              iconBg: 'bg-blue-100',
            },
            success: {
              bg: 'bg-green-50 border-green-400',
              text: 'text-green-800',
              icon: 'text-green-600',
              iconBg: 'bg-green-100',
            },
          };

          const colorScheme = colors[alert.type];

          // Iconos según el tipo
          const icons = {
            warning: AlertTriangle,
            error: XCircle,
            info: Info,
            success: CheckCircle,
          };

          const Icon = icons[alert.type];

          return (
            <div
              key={alert.id}
              className={`
                ${colorScheme.bg}
                border-l-4 ${colorScheme.text}
                rounded-lg shadow-lg
                transform transition-all duration-300 ease-out
                ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
              `}
              role="alert"
            >
              <div className="flex items-start p-4">
                {/* Icono */}
                <div className={`flex-shrink-0 ${colorScheme.iconBg} rounded-full p-2 mr-3`}>
                  <Icon className={`h-5 w-5 ${colorScheme.icon}`} />
                </div>

                {/* Mensaje */}
                <div className="flex-1 pt-0.5">
                  <p className="font-medium text-sm leading-relaxed">
                    {alert.message}
                  </p>
                </div>

                {/* Botón de cerrar */}
                <button
                  onClick={() => handleClose(alert.id)}
                  className={`
                    flex-shrink-0 ml-4 inline-flex
                    ${colorScheme.text} hover:${colorScheme.icon}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600
                    rounded-md transition-colors
                  `}
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Barra de progreso (opcional) */}
              {alert.duration && alert.duration > 0 && (
                <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                  <div
                    className={`h-full ${alert.type === 'warning' ? 'bg-yellow-600' : 
                              alert.type === 'error' ? 'bg-red-600' : 
                              alert.type === 'info' ? 'bg-blue-600' : 
                              'bg-green-600'}`}
                    style={{
                      animation: `progress-bar ${alert.duration}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Estilos CSS para la animación de la barra de progreso */}
      <style jsx>{`
        @keyframes progress-bar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalAlertBanner;

