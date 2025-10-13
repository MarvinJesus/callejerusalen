'use client';

/**
 * Sistema de Notificaciones de Pánico
 * 
 * Componente que maneja las notificaciones en tiempo real de alertas de pánico:
 * - Sonido de alarma intermitente
 * - Notificaciones del navegador (Web Push API)
 * - Modal visual con información de la emergencia
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePanicNotifications, PanicNotification } from '@/hooks/usePanicNotifications';
import { useAlarmSound } from '@/lib/alarmSound';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, X, MapPin, Clock, User, Phone, Bell, BellOff, Video, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PanicNotificationSystemProps {
  /** Si se debe mostrar el componente */
  enabled?: boolean;
}

const PanicNotificationSystem: React.FC<PanicNotificationSystemProps> = ({ 
  enabled = true 
}) => {
  const { user, userProfile, securityPlan } = useAuth();
  const [activeAlert, setActiveAlert] = useState<PanicNotification | null>(null);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const hasRequestedPermission = useRef(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const { startAlarm, stopAlarm, isPlaying } = useAlarmSound();

  // Verificar si el usuario tiene acceso al sistema de notificaciones
  // SOLO usuarios inscritos Y aprobados en el Plan de Seguridad pueden recibir notificaciones
  const hasSecurityAccess = React.useMemo(() => {
    if (!user || !userProfile) return false;
    
    // Verificar inscripción y aprobación en el Plan de Seguridad
    const isEnrolledAndActive = securityPlan !== null && securityPlan.status === 'active';
    
    return isEnrolledAndActive;
  }, [user, userProfile, securityPlan]);

  // Callback cuando llega una nueva notificación
  const handleNewNotification = useCallback((notification: PanicNotification) => {
    console.log('🚨 Nueva alerta de pánico recibida:', notification);

    // Verificar que el usuario NO sea el emisor de la alerta
    if (notification.userId === user?.uid) {
      console.log('⚠️ Usuario es el emisor de la alerta, no mostrar');
      return;
    }

    // Mostrar modal
    setActiveAlert(notification);

    // Reproducir sonido de alarma si está habilitado
    if (soundEnabled && !isPlaying()) {
      console.log('🔊 Reproduciendo sonido de alarma...');
      startAlarm('emergency');
    }

    // Mostrar notificación del navegador
    if (browserNotificationsEnabled && notificationPermission === 'granted') {
      showBrowserNotification(notification);
    }

    // Toast de notificación
    toast.error(
      `🚨 ¡ALERTA DE PÁNICO! ${notification.userName} necesita ayuda urgente`,
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
  }, [soundEnabled, browserNotificationsEnabled, notificationPermission, startAlarm, isPlaying]);

  // Hook de notificaciones - solo activar si el usuario tiene acceso al plan de seguridad
  const { 
    activeNotifications, 
    unreadCount, 
    markAsRead 
  } = usePanicNotifications(hasSecurityAccess ? handleNewNotification : undefined);

  // Solicitar permisos de notificación al montar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && !hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      
      // Verificar permiso actual
      setNotificationPermission(Notification.permission);
      
      // Si aún no se ha solicitado permiso, pedirlo
      if (Notification.permission === 'default') {
        console.log('📢 Solicitando permisos de notificación...');
        
        // Esperar un poco para no ser intrusivo
        setTimeout(() => {
          Notification.requestPermission().then((permission) => {
            console.log('📢 Permiso de notificación:', permission);
            setNotificationPermission(permission);
            setBrowserNotificationsEnabled(permission === 'granted');
            
            if (permission === 'granted') {
              toast.success('Notificaciones de emergencia activadas');
            }
          });
        }, 3000);
      } else if (Notification.permission === 'granted') {
        setBrowserNotificationsEnabled(true);
      }
    }
  }, []);

  // Cargar configuración de sonido desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panic_sound_enabled');
      if (stored !== null) {
        setSoundEnabled(stored === 'true');
      }
    }
  }, []);

  // Guardar configuración de sonido
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panic_sound_enabled', soundEnabled.toString());
    }
  }, [soundEnabled]);

  // Mostrar notificación del navegador
  const showBrowserNotification = (notification: PanicNotification) => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('No hay permiso para mostrar notificaciones');
      return;
    }

    try {
      const browserNotification = new Notification('🚨 ALERTA DE PÁNICO', {
        body: `${notification.userName} solicita ayuda urgente\nUbicación: ${notification.location}`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `panic-${notification.id}`,
        requireInteraction: true, // La notificación no se cierra automáticamente
        silent: false,
      });

      browserNotification.onclick = () => {
        window.focus();
        setActiveAlert(notification);
        browserNotification.close();
      };

      console.log('📢 Notificación del navegador mostrada');
    } catch (error) {
      console.error('Error al mostrar notificación del navegador:', error);
    }
  };

  // Cerrar alerta y detener sonido
  const handleCloseAlert = async () => {
    if (!activeAlert || !user) return;

    try {
      // Marcar como leída
      markAsRead(activeAlert.id);
      
      // Guardar confirmación en Firestore
      if (db) {
        const alertRef = doc(db, 'panicReports', activeAlert.id);
        await updateDoc(alertRef, {
          acknowledgedBy: arrayUnion(user.uid)
        });
        console.log(`✅ Usuario ${user.uid} confirmó alerta ${activeAlert.id}`);
      }
      
      // Marcar como confirmada localmente
      setAcknowledgedAlerts(prev => {
        const newSet = new Set(prev);
        newSet.add(activeAlert.id);
        return newSet;
      });
      
      toast.success('Confirmación registrada correctamente', {
        icon: '✅',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al confirmar alerta:', error);
      toast.error('Error al registrar confirmación');
    }
    
    setActiveAlert(null);
    stopAlarm();
  };

  // Llamar al 911
  const handleCallEmergency = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'tel:911';
    }
  };

  // Toggle sonido
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
    toast.success(soundEnabled ? 'Sonido desactivado' : 'Sonido activado');
  };

  // Solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones');
      return;
    }

    // Si ya fueron denegados, mostrar guía manual
    if (Notification.permission === 'denied') {
      console.warn('⚠️ Permisos de notificación bloqueados por el navegador');
      setShowPermissionGuide(true);
      toast.error('Las notificaciones están bloqueadas. Sigue las instrucciones para habilitarlas.', {
        duration: 5000,
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setBrowserNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast.success('✅ Notificaciones de emergencia activadas correctamente');
      } else if (permission === 'denied') {
        console.warn('⚠️ Usuario denegó los permisos de notificación');
        setShowPermissionGuide(true);
        toast.error('Para recibir alertas de emergencia, debes habilitar las notificaciones manualmente.', {
          duration: 6000,
        });
      } else {
        toast('Permisos de notificación no otorgados', {
          icon: 'ℹ️',
        });
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      toast.error('Error al solicitar permisos de notificación');
    }
  };

  // Formatear tiempo relativo
  const formatTimeAgo = (date: Date): string => {
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

  // No renderizar si está deshabilitado o el usuario no tiene acceso al plan de seguridad
  if (!enabled || !hasSecurityAccess) {
    return null;
  }

  return (
    <>
      {/* Indicador de notificaciones pendientes */}
      {unreadCount > 0 && !activeAlert && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => {
              if (activeNotifications.length > 0) {
                setActiveAlert(activeNotifications[0]);
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse hover:bg-red-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="font-semibold">{unreadCount} alerta{unreadCount > 1 ? 's' : ''} de pánico</span>
          </button>
        </div>
      )}

      {/* Modal de Alerta de Pánico */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-scale-in">
            {/* Header con animación de emergencia */}
            <div className="bg-red-600 text-white px-6 py-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-500 animate-pulse"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-8 h-8 animate-bounce" />
                  <div>
                    <h2 className="text-2xl font-bold">¡ALERTA DE PÁNICO!</h2>
                    <p className="text-red-100 text-sm">{formatTimeAgo(activeAlert.timestamp)}</p>
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
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información del solicitante */}
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-600">
                <div className="flex items-start space-x-3">
                  <User className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{activeAlert.userName}</h3>
                    <p className="text-gray-600 text-sm">{activeAlert.userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="flex items-start space-x-3">
                <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Ubicación:</h4>
                  <p className="text-gray-700">{activeAlert.location}</p>
                </div>
              </div>

              {/* Descripción */}
              {activeAlert.description && (
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Descripción:</h4>
                    <p className="text-gray-700">{activeAlert.description}</p>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>
                  {activeAlert.timestamp.toLocaleString('es-ES', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </span>
              </div>

              {/* Indicadores especiales */}
              {(activeAlert.extremeMode || activeAlert.hasVideo) && (
                <div className="flex items-center space-x-2 text-sm">
                  {activeAlert.extremeMode && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium flex items-center space-x-1">
                      <Video className="w-4 h-4" />
                      <span>Modo Extremo Activado</span>
                    </span>
                  )}
                  {activeAlert.hasVideo && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                      📹 Video disponible
                    </span>
                  )}
                </div>
              )}

              {/* Activado desde */}
              {activeAlert.activatedFrom && (
                <p className="text-xs text-gray-500">
                  Activado desde: {activeAlert.activatedFrom === 'floating_button' ? 'Botón Flotante' : 'Página de Pánico'}
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCallEmergency}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                <Phone className="w-5 h-5" />
                <span>LLAMAR AL 911</span>
              </button>
              <button
                onClick={handleCloseAlert}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                He sido notificado
              </button>
            </div>

            {/* Controles de sonido */}
            <div className="bg-gray-100 px-6 py-3 flex items-center justify-between border-t">
              <span className="text-sm text-gray-700">Sonido de alarma:</span>
              <button
                onClick={toggleSound}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  soundEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-white hover:bg-gray-500'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Activado</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>Desactivado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control de notificaciones del navegador (solo si no están activadas) */}
      {notificationPermission !== 'granted' && (
        <button
          onClick={requestNotificationPermission}
          className="fixed bottom-24 left-24 z-40 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Bell className="w-4 h-4" />
          <span>Activar notificaciones de emergencia</span>
        </button>
      )}

      {/* Modal de Guía para Habilitar Notificaciones */}
      {showPermissionGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Cómo Habilitar Notificaciones</h2>
                    <p className="text-blue-100 text-sm">Sigue estos pasos según tu navegador</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPermissionGuide(false)}
                  className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
                  aria-label="Cerrar guía"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Instrucciones generales */}
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-2">⚠️ Notificaciones Bloqueadas</h3>
                    <p className="text-yellow-800 text-sm">
                      Los permisos de notificación están bloqueados en tu navegador. 
                      Para recibir alertas de emergencia, debes habilitarlas manualmente desde la configuración del navegador.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chrome / Edge */}
              <div className="mb-6 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-600 font-bold text-sm">1</span>
                  Google Chrome / Microsoft Edge
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 ml-11">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Haz clic en el <strong>icono de candado 🔒</strong> o <strong>información ℹ️</strong> a la izquierda de la barra de direcciones</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Busca la opción <strong>"Notificaciones"</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Cambia de <strong>"Bloqueado"</strong> a <strong>"Permitir"</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>Recarga la página (F5 o Ctrl+R)</span>
                  </li>
                </ol>
              </div>

              {/* Firefox */}
              <div className="mb-6 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 text-orange-600 font-bold text-sm">2</span>
                  Mozilla Firefox
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 ml-11">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Haz clic en el <strong>icono de escudo 🛡️</strong> a la izquierda de la barra de direcciones</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Haz clic en <strong>"Permisos"</strong> o la flecha <strong>"▶"</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Busca <strong>"Recibir notificaciones"</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>Desmarca <strong>"Bloquear"</strong> y marca <strong>"Permitir"</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">5.</span>
                    <span>Recarga la página (F5 o Ctrl+R)</span>
                  </li>
                </ol>
              </div>

              {/* Safari */}
              <div className="mb-6 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-gray-600 font-bold text-sm">3</span>
                  Safari (Mac)
                </h3>
                <ol className="space-y-2 text-sm text-gray-700 ml-11">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Ve a <strong>Safari</strong> → <strong>Preferencias</strong> (o Cmd + ,)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Haz clic en la pestaña <strong>"Sitios web"</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Selecciona <strong>"Notificaciones"</strong> en el menú izquierdo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>Busca este sitio web y cambia a <strong>"Permitir"</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">5.</span>
                    <span>Recarga la página (Cmd + R)</span>
                  </li>
                </ol>
              </div>

              {/* Configuración del sistema (Windows/Mac) */}
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">💡</span>
                  Verificar Configuración del Sistema
                </h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>Windows:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Configuración → Sistema → Notificaciones → Habilitar notificaciones del navegador</li>
                  </ul>
                  <p className="mt-2"><strong>Mac:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Preferencias del Sistema → Notificaciones → Seleccionar navegador → Permitir notificaciones</li>
                  </ul>
                </div>
              </div>

              {/* Nota importante */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-bold text-red-900 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Importante
                </h3>
                <p className="text-sm text-red-800">
                  Las notificaciones de emergencia son críticas para tu seguridad. 
                  Al habilitarlas, recibirás alertas inmediatas cuando un miembro de la comunidad active el botón de pánico.
                </p>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 border-t">
              <button
                onClick={() => {
                  setShowPermissionGuide(false);
                  // Intentar verificar de nuevo el permiso después de cerrar
                  if (typeof window !== 'undefined' && 'Notification' in window) {
                    setNotificationPermission(Notification.permission);
                    setBrowserNotificationsEnabled(Notification.permission === 'granted');
                    if (Notification.permission === 'granted') {
                      toast.success('✅ Notificaciones habilitadas correctamente');
                    }
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Ya Habilité las Notificaciones
              </button>
              <button
                onClick={() => setShowPermissionGuide(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para animaciones */}
      <style jsx>{`
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

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default PanicNotificationSystem;

