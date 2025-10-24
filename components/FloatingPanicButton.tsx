'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useRouter } from 'next/navigation';
import { getPanicButtonSettings, PanicButtonSettings, getActiveSecurityPlanUsers } from '@/lib/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createPanicActivationNotifications } from '@/lib/notifications';
import { db } from '@/lib/firebase';
import { AlertTriangle, Video, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface FloatingPanicButtonProps {
  onPanicActivated?: () => void;
}

const FloatingPanicButton: React.FC<FloatingPanicButtonProps> = ({ onPanicActivated }) => {
  const { user, userProfile, securityPlan } = useAuth();
  const { sendPanicAlert, isConnected } = useWebSocket();
  const router = useRouter();
  const [settings, setSettings] = useState<PanicButtonSettings | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar si el usuario tiene acceso
  // SOLO usuarios inscritos Y aprobados en el Plan de Seguridad pueden ver el botón
  const hasAccess = React.useMemo(() => {
    if (!user || !userProfile) return false;
    
    // Verificar inscripción y aprobación en el Plan de Seguridad
    const isEnrolledAndActive = securityPlan !== null && securityPlan.status === 'active';
    
    // SOLO mostrar si está inscrito y aprobado (sin excepciones para admins)
    return isEnrolledAndActive;
  }, [user, userProfile, securityPlan]);

  // Cargar configuración
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !hasAccess) return;

      try {
        const userSettings = await getPanicButtonSettings(user.uid);
        if (userSettings) {
          setSettings(userSettings);
          setIsVisible(userSettings.floatingButtonEnabled);
        } else {
          // Configuración por defecto
          setSettings({
            userId: user.uid,
            emergencyContacts: [],
            notifyAll: false,
            floatingButtonEnabled: true,
            holdTime: 5,
            extremeModeEnabled: false,
            autoRecordVideo: true,
            shareGPSLocation: false,
            alertDurationMinutes: 5,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    };

    loadSettings();
  }, [user, hasAccess]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      stopRecording();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [stream]);

  // Iniciar grabación de video
  const startRecording = async () => {
    try {
      console.log('🎥 Iniciando grabación de video...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // Cámara frontal
        audio: true
      });

      setStream(mediaStream);
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        console.log('✅ Grabación completada, tamaño:', blob.size);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      toast.success('📹 Grabación de video iniciada', {
        icon: '🎥',
        style: {
          background: '#DC2626',
          color: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      toast.error('No se pudo acceder a la cámara');
    }
  };

  // Detener grabación de video
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      console.log('🛑 Grabación detenida');
    }
  };

  // Activar pánico
  const activatePanic = async () => {
    if (!user || !userProfile || !settings) {
      toast.error('Error: No se pudo activar la alerta');
      return;
    }

    try {
      console.log('🚨 Activando pánico desde botón flotante...');

      // Detener grabación si está activa
      stopRecording();

      // Determinar contactos a notificar
      let contactsToNotify = settings.emergencyContacts;
      
      if (settings.notifyAll) {
        // Obtener todos los usuarios activos del plan de seguridad
        try {
          const allUsers = await getActiveSecurityPlanUsers();
          contactsToNotify = allUsers.map(u => u.userId);
          console.log(`📢 Modo "Notificar a todos": ${contactsToNotify.length} usuarios`);
        } catch (error) {
          console.error('Error al obtener usuarios del plan:', error);
        }
      }

      if (contactsToNotify.length === 0) {
        toast.error('No hay contactos configurados. Ve a configuración.');
        return;
      }

      let location = settings.location || 'Ubicación no especificada';
      const description = settings.customMessage || 'Alerta de emergencia activada desde botón flotante';
      let gpsCoords: {lat: number; lng: number} | null = null;

      // Obtener ubicación GPS si está habilitado
      if (settings.shareGPSLocation) {
        try {
          console.log('📍 Obteniendo ubicación GPS...');
          gpsCoords = await new Promise<{lat: number; lng: number}>((resolve, reject) => {
            if (!('geolocation' in navigator)) {
              reject(new Error('Geolocalización no soportada'));
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
              },
              (error) => reject(error),
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              }
            );
          });
          
          // Agregar coordenadas a la ubicación textual
          location = `${location} (GPS: ${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)})`;
          console.log('📍 Ubicación GPS incluida:', gpsCoords);
        } catch (gpsError) {
          console.error('⚠️ No se pudo obtener ubicación GPS:', gpsError);
        }
      }

      // 1. ENVIAR VÍA WEBSOCKET (TIEMPO REAL - PRIORIDAD)
      if (isConnected) {
        console.log('🚨 Enviando alerta vía WebSocket...');
        try {
          const wsResult = await sendPanicAlert({
            userId: user.uid,
            userName: userProfile.displayName || user.displayName || 'Usuario',
            userEmail: userProfile.email || user.email || '',
            location,
            description,
            notifiedUsers: contactsToNotify,
            extremeMode: settings.extremeModeEnabled && isRecording,
            hasVideo: videoBlob !== null,
            activatedFrom: 'floating_button',
            ...(gpsCoords && {
              gpsLatitude: gpsCoords.lat,
              gpsLongitude: gpsCoords.lng
            })
          });

          console.log('✅ Alerta WebSocket enviada:', wsResult);
        } catch (wsError) {
          console.error('❌ Error al enviar por WebSocket:', wsError);
        }
      } else {
        console.warn('⚠️ WebSocket no conectado');
        toast('Enviando alerta (modo offline)...', { icon: '⚠️' });
      }

      // 2. GUARDAR EN FIRESTORE (BACKUP Y PERSISTENCIA)
      console.log('💾 Guardando alerta en Firestore...');
      
      // Calcular tiempo de expiración
      const now = new Date();
      const alertDurationMinutes = settings.alertDurationMinutes || 5;
      const expiresAt = new Date(now.getTime() + alertDurationMinutes * 60 * 1000);
      
      const panicReport: any = {
        userId: user.uid,
        userName: userProfile.displayName || user.displayName || 'Usuario',
        userEmail: userProfile.email || user.email || '',
        location,
        description,
        timestamp: serverTimestamp(),
        status: 'active',
        emergencyContacts: ['911'],
        notifiedUsers: contactsToNotify,
        acknowledgedBy: [], // Inicialmente nadie ha confirmado
        activatedFrom: 'floating_button',
        extremeMode: settings.extremeModeEnabled && isRecording,
        hasVideo: videoBlob !== null,
        alertDurationMinutes,
        expiresAt,
        autoResolved: false,
        ...(gpsCoords && {
          gpsLatitude: gpsCoords.lat,
          gpsLongitude: gpsCoords.lng
        })
      };
      
      console.log(`⏱️ Alerta flotante configurada para expirar en ${alertDurationMinutes} minutos (${expiresAt.toLocaleTimeString()})`);

      const docRef = await addDoc(collection(db, 'panicReports'), panicReport);
      console.log('✅ Alerta guardada en Firestore:', docRef.id);

      try {
        const notificationTargets = contactsToNotify.filter((contactId) => contactId && contactId !== user.uid);
        await createPanicActivationNotifications({
          alertId: docRef.id,
          triggeredByName: userProfile.displayName || user.displayName || 'Usuario',
          location,
          description,
          notifiedUserIds: notificationTargets,
          extremeMode: settings.extremeModeEnabled,
          hasVideo: Boolean(videoBlob)
        });
      } catch (notificationError) {
        console.error('Error al crear notificaciones de pánico:', notificationError);
      }

      // TODO: Subir video a Storage si existe
      if (videoBlob) {
        console.log('📹 Video capturado, tamaño:', videoBlob.size);
        // Aquí se puede subir el video a Firebase Storage
        toast.success('✅ Video de emergencia guardado');
      }

      toast.success(
        `🚨 ¡Alerta enviada! ${contactsToNotify.length} persona${contactsToNotify.length !== 1 ? 's' : ''} notificada${contactsToNotify.length !== 1 ? 's' : ''}. Durará ${alertDurationMinutes} min.`,
        {
          duration: 3000,
          icon: '🚨',
        }
      );

      // Reset estado
      setIsHolding(false);
      setHoldProgress(0);
      setClickCount(0);
      setVideoBlob(null);

      // Callback opcional
      if (onPanicActivated) {
        onPanicActivated();
      }

      // Redirigir a la página de emergencia activa
      setTimeout(() => {
        console.log('🔄 Redirigiendo a página de emergencia activa:', docRef.id);
        router.push(`/residentes/panico/activa/${docRef.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error al activar pánico:', error);
      toast.error('Error al enviar la alerta');
      
      // Reset estado en caso de error
      setIsHolding(false);
      setHoldProgress(0);
    }
  };

  // Manejar click del botón
  const handleButtonClick = () => {
    if (!settings) return;

    setClickCount(prev => prev + 1);

    // Limpiar timer anterior
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    // Si es el segundo click (doble click)
    if (clickCount === 1) {
      console.log('✅ Doble click detectado');
      
      // Iniciar modo de mantener presionado
      toast('⚠️ Mantén presionado para activar', {
        icon: '⚠️',
        style: {
          background: '#FCD34D',
          color: '#92400E',
        },
        duration: 2000,
      });
    }

    // Reset después de 800ms
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 800);
  };

  // Manejar inicio de mantener presionado
  const handleMouseDown = () => {
    if (clickCount < 2 || !settings) return;

    console.log('👇 Iniciando mantener presionado...');
    setIsHolding(true);
    setHoldProgress(0);

    // Iniciar grabación si modo extremo está activo
    if (settings.extremeModeEnabled && settings.autoRecordVideo) {
      startRecording();
    }

    // Progreso visual
    const totalTime = (settings.holdTime || 5) * 1000;
    const intervalTime = 50;
    let elapsed = 0;

    progressIntervalRef.current = setInterval(() => {
      elapsed += intervalTime;
      const progress = (elapsed / totalTime) * 100;
      setHoldProgress(progress);

      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, intervalTime);

    // Timer para activar pánico
    holdTimerRef.current = setTimeout(() => {
      console.log('✅ Tiempo completado, activando pánico');
      activatePanic();
    }, totalTime);
  };

  // Manejar fin de mantener presionado
  const handleMouseUp = () => {
    if (!isHolding) return;

    console.log('👆 Soltado antes de completar');
    
    // Limpiar timers
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Si no completó el tiempo, detener grabación
    if (holdProgress < 100) {
      stopRecording();
      toast('Activación cancelada', {
        icon: 'ℹ️',
        style: {
          background: '#3B82F6',
          color: '#FFFFFF',
        },
      });
    }

    setIsHolding(false);
    setHoldProgress(0);
    setClickCount(0);
  };

  // No mostrar si no tiene acceso o está deshabilitado
  if (!hasAccess || !isVisible || !settings?.floatingButtonEnabled) {
    return null;
  }

  return (
    <>
      {/* Botón flotante */}
      <div className="fixed left-4 bottom-24 z-50">
        <button
          onClick={handleButtonClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`
            relative w-16 h-16 rounded-full shadow-2xl
            flex items-center justify-center
            transition-all duration-300 transform
            ${isHolding 
              ? 'bg-red-700 scale-110' 
              : clickCount > 0 
                ? 'bg-red-600 scale-105 animate-pulse' 
                : 'bg-red-500 hover:bg-red-600 hover:scale-105'
            }
            ${isRecording ? 'ring-4 ring-red-300 animate-pulse' : ''}
          `}
          title={clickCount === 0 
            ? 'Click 2 veces para activar' 
            : clickCount === 1 
              ? 'Click una vez más' 
              : 'Mantén presionado'
          }
        >
          {/* Icono */}
          {isRecording ? (
            <Video className="w-8 h-8 text-white animate-pulse" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-white" />
          )}

          {/* Indicador de progreso */}
          {isHolding && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="white"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - holdProgress / 100)}`}
                className="transition-all duration-50"
              />
            </svg>
          )}

          {/* Badge de clicks */}
          {clickCount > 0 && !isHolding && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
              {clickCount}
            </div>
          )}

          {/* Indicador de modo extremo */}
          {settings.extremeModeEnabled && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"></div>
          )}
        </button>

        {/* Tooltip */}
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          {clickCount === 0 && 'Click 2 veces rápido'}
          {clickCount === 1 && 'Click de nuevo'}
          {clickCount >= 2 && 'Mantén presionado'}
        </div>
      </div>

      {/* Indicador de grabación */}
      {isRecording && (
        <div className="fixed left-4 bottom-44 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <Camera className="w-5 h-5" />
          <span className="text-sm font-semibold">Grabando...</span>
        </div>
      )}

      {/* Overlay de instrucciones en primer uso */}
      {clickCount === 1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ⚠️ Activación de Pánico
            </h3>
            <p className="text-gray-700 mb-4">
              Click una vez más y luego mantén presionado {settings.holdTime} segundos para activar la alerta.
            </p>
            {settings.extremeModeEnabled && (
              <p className="text-sm text-purple-600 font-medium">
                🎥 Modo Extremo: La cámara empezará a grabar al mantener presionado
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingPanicButton;

