'use client';

/**
 * Modal de Alerta de Pánico en Tiempo Real
 * Se superpone en toda la aplicación con animación parpadeante roja
 * y sonido de emergencia cuando se recibe una alerta vía WebSocket
 * 
 * La alerta persiste hasta que:
 * - El usuario presiona "HE SIDO NOTIFICADO"
 * - O la alerta expira por tiempo
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket, PanicAlert } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useAlarmSound } from '@/lib/alarmSound';
import { AlertTriangle, X, MapPin, Clock, User, Phone, CheckCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import EmergencyLocationMap from './EmergencyLocationMap';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PanicAlertModal: React.FC = () => {
  const { socket, isConnected, acknowledgePanicAlert } = useWebSocket();
  const { user, securityPlan } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Para detectar la ruta actual
  const { startAlarm, stopAlarm, isPlaying } = useAlarmSound();
  
  const [currentAlert, setCurrentAlert] = useState<PanicAlert | null>(null);
  const [alertQueue, setAlertQueue] = useState<PanicAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hasShownAlert = useRef(new Set<string>());
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Verificar si el usuario tiene acceso al sistema de notificaciones
  const hasSecurityAccess = React.useMemo(() => {
    if (!user) return false;
    const isEnrolledAndActive = securityPlan !== null && securityPlan.status === 'active';
    return isEnrolledAndActive;
  }, [user, securityPlan]);

  // Cargar configuración de sonido
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panic_sound_enabled');
      if (stored !== null) {
        setSoundEnabled(stored === 'true');
      }
    }
  }, []);

  // Verificar periódicamente si hay alertas activas no confirmadas
  useEffect(() => {
    if (!user || !hasSecurityAccess || !db) return;

    const checkUnacknowledgedAlerts = async () => {
      try {
        const now = new Date();
        const reportsRef = collection(db, 'panicReports');
        
        // Buscar alertas activas donde el usuario está notificado
        const q = query(
          reportsRef,
          where('status', '==', 'active'),
          where('notifiedUsers', 'array-contains', user.uid)
        );

        const querySnapshot = await getDocs(q);
        
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          const alertId = docSnapshot.id;
          
          // Verificar que el usuario NO sea el emisor de la alerta
          if (data.userId === user.uid) {
            continue; // Es el emisor, no mostrar
          }
          
          // Verificar si el usuario ya confirmó esta alerta
          const acknowledgedBy = data.acknowledgedBy || [];
          const hasAcknowledged = acknowledgedBy.includes(user.uid) || acknowledgedAlerts.has(alertId);
          
          if (hasAcknowledged) {
            continue; // Ya confirmada, siguiente
          }
          
          // Verificar si la alerta ha expirado
          const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : (data.expiresAt ? new Date(data.expiresAt) : null);
          if (expiresAt && now >= expiresAt) {
            continue; // Ya expiró, siguiente
          }
          
          // Si la alerta no está confirmada y no ha expirado, mostrarla
          if (!currentAlert || currentAlert.id !== alertId) {
            // ✅ CORRECCIÓN: NO redirigir si ya estamos en la página de esta alerta
            const isAlreadyOnAlertPage = pathname === `/residentes/panico/activa/${alertId}`;
            
            if (isAlreadyOnAlertPage) {
              console.log(`ℹ️ Usuario ya está en la página de la alerta ${alertId}, no redirigir`);
              // Marcar como mostrada para evitar que siga intentando
              hasShownAlert.current.add(alertId);
              continue; // Pasar a la siguiente alerta
            }
            
            const panicAlert: PanicAlert = {
              id: alertId,
              userId: data.userId,
              userName: data.userName,
              userEmail: data.userEmail,
              location: data.location,
              description: data.description,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
              status: data.status || 'active',
              notifiedUsers: data.notifiedUsers || [],
              acknowledgedBy: data.acknowledgedBy || [],
              alertDurationMinutes: data.alertDurationMinutes,
              expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
              extremeMode: data.extremeMode || false,
              hasVideo: data.hasVideo || false,
              activatedFrom: data.activatedFrom,
              gpsLatitude: data.gpsLatitude,
              gpsLongitude: data.gpsLongitude
            };
            
            // Redirigir a la página de emergencia activa
            console.log(`🔄 Redirigiendo a alerta no confirmada: ${alertId}`);
            
            // Reproducir sonido si está habilitado
            if (soundEnabled && !isPlaying()) {
              console.log('🔊 Reproduciendo sonido de alarma...');
              startAlarm('emergency');
            }
            
            // Marcar como mostrada para evitar duplicados
            hasShownAlert.current.add(alertId);
            
            // Redirigir a la página
            router.push(`/residentes/panico/activa/${alertId}`);
            
            break; // Solo procesar una alerta a la vez
          }
        }
      } catch (error) {
        console.error('Error al verificar alertas no confirmadas:', error);
      }
    };

    // Verificar inmediatamente al cargar
    checkUnacknowledgedAlerts();

    // Verificar cada 15 segundos
    const interval = setInterval(() => {
      checkUnacknowledgedAlerts();
    }, 15000);

    return () => clearInterval(interval);
  }, [user, hasSecurityAccess, currentAlert, acknowledgedAlerts, soundEnabled, startAlarm, isPlaying, pathname]);

  // Guardar configuración de sonido
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panic_sound_enabled', soundEnabled.toString());
    }
  }, [soundEnabled]);

  // Actualizar tiempo restante cada segundo
  useEffect(() => {
    if (!currentAlert || !currentAlert.expiresAt) {
      setTimeRemaining('');
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(currentAlert.expiresAt!);
      const diffMs = expires.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Expirando...');
        return;
      }

      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')} min restantes`);
      } else {
        setTimeRemaining(`${seconds} seg restantes`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [currentAlert]);

  // Escuchar nuevas alertas de pánico vía WebSocket
  useEffect(() => {
    if (!socket || !hasSecurityAccess || !user) {
      return;
    }

    const handleNewAlert = (alert: PanicAlert) => {
      console.log('🚨 Nueva alerta de pánico recibida vía WebSocket:', alert);

      // Verificar que el usuario NO sea el emisor de la alerta
      if (alert.userId === user.uid) {
        console.log('⚠️ Usuario es el emisor de la alerta, no mostrar');
        return;
      }

      // Verificar que el usuario está en la lista de notificados
      if (!alert.notifiedUsers.includes(user.uid)) {
        console.log('⚠️ Usuario no está en la lista de notificados');
        return;
      }

      // Verificar que no sea una alerta duplicada
      if (hasShownAlert.current.has(alert.id)) {
        console.log('⚠️ Alerta duplicada, ignorando');
        return;
      }

      // ✅ CORRECCIÓN: NO redirigir si ya estamos en la página de esta alerta
      const isAlreadyOnAlertPage = pathname === `/residentes/panico/activa/${alert.id}`;
      if (isAlreadyOnAlertPage) {
        console.log(`ℹ️ Usuario ya está en la página de la alerta ${alert.id}, no redirigir`);
        hasShownAlert.current.add(alert.id);
        return;
      }

      // Marcar como mostrada
      hasShownAlert.current.add(alert.id);

      // Reproducir sonido de alarma
      if (soundEnabled && !isPlaying()) {
        console.log('🔊 Reproduciendo sonido de alarma...');
        startAlarm('emergency');
      }

      // Redirigir a la página de emergencia activa
      console.log('🔄 Redirigiendo a página de emergencia activa:', alert.id);
      router.push(`/residentes/panico/activa/${alert.id}`);

      // Toast de notificación
      toast.error(
        `🚨 ¡ALERTA DE PÁNICO! ${alert.userName} necesita ayuda urgente`,
        {
          duration: 10000,
          icon: '🚨',
          style: {
            background: '#DC2626',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '16px',
          },
        }
      );

      // Notificación del navegador si está disponible
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 ALERTA DE PÁNICO', {
          body: `${alert.userName} solicita ayuda urgente\nUbicación: ${alert.location}`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `panic-${alert.id}`,
          requireInteraction: true,
        });
      }
    };

    const handleAlertResolved = (data: { alertId: string; resolvedBy: string; timestamp: string }) => {
      console.log('✅ Alerta resuelta:', data);
      
      // Si es la alerta actual, cerrarla
      if (currentAlert && currentAlert.id === data.alertId) {
        setCurrentAlert(null);
        stopAlarm();
        toast.success('La alerta de pánico ha sido resuelta');
        
        // Mostrar siguiente alerta de la cola si existe
        if (alertQueue.length > 0) {
          const nextAlert = alertQueue[0];
          setAlertQueue(prev => prev.slice(1));
          setCurrentAlert(nextAlert);
          if (soundEnabled && !isPlaying()) {
            startAlarm('emergency');
          }
        }
      }
    };

    socket.on('panic:new_alert', handleNewAlert);
    socket.on('panic:resolved', handleAlertResolved);

    return () => {
      socket.off('panic:new_alert', handleNewAlert);
      socket.off('panic:resolved', handleAlertResolved);
    };
  }, [socket, hasSecurityAccess, user, currentAlert, alertQueue, soundEnabled, startAlarm, stopAlarm, isPlaying, pathname]);

  // Cerrar alerta actual y guardar confirmación en Firestore
  const handleCloseAlert = useCallback(async () => {
    if (!currentAlert || !user) return;

    try {
      // Confirmar recepción de la alerta
      acknowledgePanicAlert(currentAlert.id);
      
      // Guardar confirmación en Firestore
      if (db) {
        const alertRef = doc(db, 'panicReports', currentAlert.id);
        await updateDoc(alertRef, {
          acknowledgedBy: arrayUnion(user.uid)
        });
        console.log(`✅ Usuario ${user.uid} confirmó alerta ${currentAlert.id}`);
      }
      
      // Marcar como confirmada localmente
      setAcknowledgedAlerts(prev => {
        const newSet = new Set(prev);
        newSet.add(currentAlert.id);
        return newSet;
      });
      
      // Marcar como leída en localStorage
      if (typeof window !== 'undefined') {
        const key = `panic_notifications_read_${user.uid}`;
        const stored = localStorage.getItem(key);
        const readAlerts = stored ? JSON.parse(stored) : [];
        if (!readAlerts.includes(currentAlert.id)) {
          readAlerts.push(currentAlert.id);
          localStorage.setItem(key, JSON.stringify(readAlerts));
        }
      }

      // Detener sonido
      stopAlarm();

      // Mostrar confirmación
      toast.success('Confirmación registrada correctamente', {
        icon: '✅',
        duration: 3000
      });

      // Cerrar alerta
      setCurrentAlert(null);

      // Mostrar siguiente alerta de la cola si existe
      if (alertQueue.length > 0) {
        const nextAlert = alertQueue[0];
        setAlertQueue(prev => prev.slice(1));
        setTimeout(() => {
          setCurrentAlert(nextAlert);
          if (soundEnabled && !isPlaying()) {
            startAlarm('emergency');
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error al confirmar alerta:', error);
      toast.error('Error al registrar confirmación');
    }
  }, [currentAlert, alertQueue, acknowledgePanicAlert, stopAlarm, soundEnabled, startAlarm, isPlaying, user]);

  // Llamar al 911
  const handleCallEmergency = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = 'tel:911';
    }
  }, []);

  // Toggle sonido
  const toggleSound = useCallback(() => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    
    // Si se está desactivando el sonido y está reproduciéndose, detenerlo
    if (!newSoundEnabled && isPlaying()) {
      stopAlarm();
    }
    
    // Mostrar mensaje correcto
    toast.success(newSoundEnabled ? 'Sonido activado' : 'Sonido desactivado');
  }, [soundEnabled, isPlaying, stopAlarm]);

  // Formatear tiempo relativo
  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Hace unos segundos';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  };

  // No renderizar si no hay acceso o no hay alerta
  if (!hasSecurityAccess || !currentAlert) {
    return null;
  }

  return (
    <>
      {/* Overlay con efecto de parpadeo rojo */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm animate-red-pulse">
        {/* Modal centrado */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-scale-in border-4 border-red-600">
          {/* Header con animación de emergencia */}
          <div className="bg-red-600 text-white px-6 py-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-500 animate-pulse-fast"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="animate-bounce">
                  <AlertTriangle className="w-10 h-10 drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold drop-shadow-md">¡EMERGENCIA!</h2>
                  <p className="text-red-100 text-sm font-medium">Alerta de pánico activada</p>
                </div>
              </div>
              <button
                onClick={handleCloseAlert}
                className="text-white hover:bg-red-700 rounded-full p-2 transition-colors"
                aria-label="Cerrar alerta"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Indicador de tiempo */}
            <div className="relative mt-2 text-red-100 text-sm font-semibold">
              {formatTimeAgo(currentAlert.timestamp)}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Información del solicitante */}
            <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600 animate-pulse-slow">
              <div className="flex items-start space-x-3">
                <User className="w-7 h-7 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl">{currentAlert.userName}</h3>
                  <p className="text-gray-700 text-base">{currentAlert.userEmail}</p>
                  <p className="text-red-600 font-semibold mt-2 text-lg">NECESITA AYUDA URGENTE</p>
                </div>
              </div>
            </div>

            {/* Mapa de Ubicación de Emergencia - MUY PROMINENTE */}
            <EmergencyLocationMap
              latitude={currentAlert.gpsLatitude}
              longitude={currentAlert.gpsLongitude}
              location={currentAlert.location}
              userName={currentAlert.userName}
              className="animate-pulse-slow"
            />

            {/* Descripción */}
            {currentAlert.description && (
              <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Descripción:</h4>
                    <p className="text-gray-800 text-lg">{currentAlert.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600" />
              <span>
                {new Date(currentAlert.timestamp).toLocaleString('es-ES', {
                  dateStyle: 'full',
                  timeStyle: 'short'
                })}
              </span>
            </div>

            {/* Indicadores especiales */}
            {(currentAlert.extremeMode || currentAlert.hasVideo) && (
              <div className="flex flex-wrap items-center gap-2">
                {currentAlert.extremeMode && (
                  <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-bold flex items-center space-x-2 border-2 border-purple-600">
                    <Video className="w-5 h-5" />
                    <span>MODO EXTREMO ACTIVADO</span>
                  </span>
                )}
                {currentAlert.hasVideo && (
                  <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold border-2 border-blue-600">
                    📹 VIDEO DISPONIBLE
                  </span>
                )}
              </div>
            )}

            {/* Información de duración y persistencia */}
            {(currentAlert.alertDurationMinutes || currentAlert.expiresAt) && (
              <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 mb-2">⏱️ Alerta con Duración Configurada</h4>
                    {currentAlert.alertDurationMinutes && (
                      <p className="text-orange-800 text-sm mb-1">
                        <strong>Duración:</strong> {currentAlert.alertDurationMinutes} minuto{currentAlert.alertDurationMinutes !== 1 ? 's' : ''}
                      </p>
                    )}
                    {timeRemaining && (
                      <p className="text-orange-800 text-sm font-semibold mb-2">
                        ⏳ {timeRemaining}
                      </p>
                    )}
                    <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mt-2">
                      <p className="text-orange-900 text-sm font-medium">
                        ⚠️ <strong>Esta alerta persistirá hasta que:</strong>
                      </p>
                      <ul className="text-orange-800 text-xs mt-2 space-y-1 ml-4">
                        <li>✓ Presiones el botón "HE SIDO NOTIFICADO"</li>
                        <li>✓ O expire el tiempo configurado ({currentAlert.alertDurationMinutes || '?'} min)</li>
                      </ul>
                      <p className="text-orange-900 text-xs font-semibold mt-2 italic">
                        💡 La alerta se te volverá a mostrar cada 15 segundos si no la confirmas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alerta de cola */}
            {alertQueue.length > 0 && (
              <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-3">
                <p className="text-orange-800 font-semibold text-center">
                  ⚠️ {alertQueue.length} alerta{alertQueue.length !== 1 ? 's' : ''} más en cola
                </p>
              </div>
            )}
          </div>

          {/* Acciones - MUY PROMINENTES */}
          <div className="bg-gray-50 px-6 py-5 flex flex-col sm:flex-row gap-3 border-t-2">
            <button
              onClick={handleCallEmergency}
              className="flex-1 bg-red-600 text-white py-4 px-6 rounded-xl font-bold text-xl hover:bg-red-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-3 shadow-xl animate-pulse-button"
            >
              <Phone className="w-6 h-6" />
              <span>LLAMAR AL 911</span>
            </button>
            <button
              onClick={handleCloseAlert}
              className="flex-1 bg-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              <CheckCircle className="w-5 h-5" />
              <span>HE SIDO NOTIFICADO</span>
            </button>
          </div>

          {/* Control de sonido */}
          <div className="bg-gray-100 px-6 py-3 flex items-center justify-between border-t">
            <span className="text-sm text-gray-700 font-medium">Sonido de alarma:</span>
            <button
              onClick={toggleSound}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                soundEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
            >
              {soundEnabled ? '🔊 ACTIVADO' : '🔇 DESACTIVADO'}
            </button>
          </div>

          {/* Estado de conexión */}
          {!isConnected && (
            <div className="bg-yellow-100 border-t-2 border-yellow-500 px-6 py-2 text-center">
              <p className="text-yellow-800 text-sm font-semibold">
                ⚠️ Conexión inestable - Las notificaciones pueden retrasarse
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes red-pulse {
          0%, 100% {
            background-color: rgba(0, 0, 0, 0.8);
          }
          50% {
            background-color: rgba(127, 29, 29, 0.9);
          }
        }

        @keyframes pulse-fast {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }

        @keyframes pulse-button {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-red-pulse {
          animation: red-pulse 2s ease-in-out infinite;
        }

        .animate-pulse-fast {
          animation: pulse-fast 1s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-pulse-button {
          animation: pulse-button 1.5s ease-in-out infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default PanicAlertModal;

