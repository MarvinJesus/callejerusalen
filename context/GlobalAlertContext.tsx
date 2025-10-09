'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type AlertType = 'warning' | 'error' | 'info' | 'success';

interface AlertMessage {
  id: string;
  message: string;
  type: AlertType;
  duration?: number;
}

interface GlobalAlertContextType {
  showAlert: (message: string, type?: AlertType, duration?: number, persist?: boolean) => void;
  hideAlert: (id: string) => void;
  alerts: AlertMessage[];
}

const GlobalAlertContext = createContext<GlobalAlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
  alerts: [],
});

export const useGlobalAlert = () => {
  const context = useContext(GlobalAlertContext);
  if (!context) {
    throw new Error('useGlobalAlert debe ser usado dentro de un GlobalAlertProvider');
  }
  return context;
};

interface GlobalAlertProviderProps {
  children: React.ReactNode;
}

export const GlobalAlertProvider: React.FC<GlobalAlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [storageVersion, setStorageVersion] = useState(0); // Para forzar re-carga
  const loadedIdsRef = React.useRef<Set<string>>(new Set()); // Trackear IDs cargados

  const hideAlert = useCallback((id: string) => {
    console.log('🗑️ hideAlert llamado para:', id);
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    // También remover del set de IDs cargados para permitir re-carga si es necesario
    loadedIdsRef.current.delete(id);
  }, []);

  // Cargar alertas persistentes desde sessionStorage
  // Este efecto se ejecuta cada vez que cambian las dependencias
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const persistedAlerts = sessionStorage.getItem('globalAlerts');
      if (persistedAlerts) {
        try {
          const parsed = JSON.parse(persistedAlerts);
          console.log('📦 Verificando alertas en sessionStorage:', parsed.length);
          
          // Filtrar solo las alertas que NO hemos cargado antes
          const newAlerts = parsed.filter((alert: AlertMessage) => 
            !loadedIdsRef.current.has(alert.id)
          );
          
          if (newAlerts.length === 0) {
            console.log('ℹ️ No hay alertas nuevas para cargar');
            return;
          }
          
          console.log('📋 Alertas nuevas encontradas:', newAlerts.length);
          
          // Marcar estos IDs como cargados
          newAlerts.forEach((alert: AlertMessage) => {
            loadedIdsRef.current.add(alert.id);
          });
          
          setAlerts(prev => {
            // Solo agregar alertas que no estén ya en el estado
            const newAlerts = parsed.filter((newAlert: AlertMessage) => 
              !prev.some(existingAlert => existingAlert.id === newAlert.id)
            );
            
            if (newAlerts.length > 0) {
              console.log('➕ Agregando', newAlerts.length, 'alertas nuevas al estado');
              return [...prev, ...newAlerts];
            }
            
            console.log('ℹ️ Todas las alertas ya están en el estado');
            return prev;
          });
          
          // ⚠️ NO limpiar sessionStorage aquí
          // Se limpiará cuando cada alerta se cierre automáticamente (en el timeout de showAlert)
          // Esto permite que si hay múltiples re-mounts rápidos, la alerta siga disponible
          
          // Auto-hide para alertas cargadas
          parsed.forEach((alert: AlertMessage) => {
            if (alert.duration && alert.duration > 0) {
              setTimeout(() => {
                console.log('⏰ Auto-cerrando alerta cargada:', alert.id);
                hideAlert(alert.id);
                
                // Limpiar esta alerta específica del sessionStorage
                try {
                  const currentAlertsStr = sessionStorage.getItem('globalAlerts');
                  if (currentAlertsStr) {
                    const currentAlerts = JSON.parse(currentAlertsStr);
                    const filtered = currentAlerts.filter((a: AlertMessage) => a.id !== alert.id);
                    if (filtered.length > 0) {
                      sessionStorage.setItem('globalAlerts', JSON.stringify(filtered));
                    } else {
                      sessionStorage.removeItem('globalAlerts');
                      console.log('🗑️ SessionStorage limpiado (todas las alertas cerradas)');
                    }
                  }
                } catch (error) {
                  console.error('❌ Error al limpiar alerta del sessionStorage:', error);
                }
              }, alert.duration);
            }
          });
        } catch (error) {
          console.error('Error al cargar alertas persistidas:', error);
          // En caso de error, limpiar el sessionStorage corrupto
          sessionStorage.removeItem('globalAlerts');
        }
      }
    }
  }, [hideAlert, storageVersion]); // Incluir storageVersion para re-ejecutar cuando cambien las alertas

  const showAlert = useCallback((message: string, type: AlertType = 'warning', duration: number = 5000, persist: boolean = false) => {
    console.log('🔔🔔🔔 showAlert LLAMADO 🔔🔔🔔');
    console.log('📝 Mensaje:', message);
    console.log('🎨 Tipo:', type);
    console.log('⏱️ Duración:', duration);
    console.log('💾 Persistir:', persist);
    
    const id = Math.random().toString(36).substring(7);
    const newAlert: AlertMessage = {
      id,
      message,
      type,
      duration
    };

    console.log('📦 Nueva alerta creada:', newAlert);

    // SIEMPRE agregar al estado inmediatamente para que aparezca sin demora
    setAlerts(prev => {
      console.log('📋 Alertas anteriores:', prev.length);
      const updated = [...prev, newAlert];
      console.log('📋 Alertas actualizadas:', updated.length, updated);
      return updated;
    });

    // Si persist es true, TAMBIÉN guardar en sessionStorage
    if (persist && typeof window !== 'undefined') {
      try {
        // Obtener alertas existentes del sessionStorage (si las hay)
        const existingAlertsStr = sessionStorage.getItem('globalAlerts');
        const existingAlerts = existingAlertsStr ? JSON.parse(existingAlertsStr) : [];
        
        // Agregar la nueva alerta
        const updatedAlerts = [...existingAlerts, newAlert];
        
        sessionStorage.setItem('globalAlerts', JSON.stringify(updatedAlerts));
        console.log('💾 ✅ Guardado en sessionStorage:', updatedAlerts.length, 'alertas');
        console.log('💾 ✅ Contenido guardado:', updatedAlerts);
        
        // Marcar como cargado para evitar duplicados
        loadedIdsRef.current.add(id);
      } catch (error) {
        console.error('❌ Error al guardar en sessionStorage:', error);
      }
    }

    // Auto-hide con timeout
    if (duration > 0) {
      console.log('⏰ Programando auto-cierre en', duration, 'ms');
      setTimeout(() => {
        console.log('⏰ Ejecutando auto-cierre para', id);
        hideAlert(id);
        
        // Limpiar del sessionStorage si existe
        if (persist && typeof window !== 'undefined') {
          try {
            const currentAlertsStr = sessionStorage.getItem('globalAlerts');
            if (currentAlertsStr) {
              const currentAlerts = JSON.parse(currentAlertsStr);
              const filtered = currentAlerts.filter((a: AlertMessage) => a.id !== id);
              if (filtered.length > 0) {
                sessionStorage.setItem('globalAlerts', JSON.stringify(filtered));
              } else {
                sessionStorage.removeItem('globalAlerts');
                console.log('🗑️ SessionStorage limpiado (todas las alertas cerradas)');
              }
            }
          } catch (error) {
            console.error('❌ Error al limpiar alerta del sessionStorage:', error);
          }
        }
      }, duration);
    }
  }, [hideAlert]);

  const value: GlobalAlertContextType = {
    showAlert,
    hideAlert,
    alerts,
  };

  return (
    <GlobalAlertContext.Provider value={value}>
      {children}
    </GlobalAlertContext.Provider>
  );
};

