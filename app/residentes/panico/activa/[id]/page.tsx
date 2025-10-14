'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAlarmSound } from '@/lib/alarmSound';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  Phone, 
  Video,
  Send,
  X,
  Wifi,
  WifiOff,
  Camera,
  StopCircle,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';

// Importar mapa dinámicamente
const EmergencyLocationMap = dynamic(() => import('@/components/EmergencyLocationMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
});

interface AlertData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  location: string;
  description: string;
  timestamp: any;
  status: 'active' | 'resolved' | 'expired';
  notifiedUsers: string[];
  acknowledgedBy: string[];
  alertDurationMinutes: number;
  expiresAt: any;
  gpsLatitude?: number;
  gpsLongitude?: number;
  extremeMode?: boolean;
  hasVideo?: boolean;
}

interface ChatMessage {
  id: string;
  alertId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: any;
}

const ActivePanicPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { isConnected, socket } = useWebSocket();
  const { startAlarm, stopAlarm, isPlaying } = useAlarmSound();

  // Agregar estilos CSS para la animación de neón
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .neon-pulse {
        animation: neonPulse 2s ease-in-out infinite alternate;
        box-shadow: 
          0 0 5px rgba(239, 68, 68, 0.5),
          0 0 10px rgba(239, 68, 68, 0.3),
          0 0 15px rgba(239, 68, 68, 0.2),
          0 0 20px rgba(239, 68, 68, 0.1);
      }
      
      @keyframes neonPulse {
        0% {
          box-shadow: 
            0 0 5px rgba(239, 68, 68, 0.5),
            0 0 10px rgba(239, 68, 68, 0.3),
            0 0 15px rgba(239, 68, 68, 0.2),
            0 0 20px rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.8);
        }
        100% {
          box-shadow: 
            0 0 10px rgba(239, 68, 68, 0.8),
            0 0 20px rgba(239, 68, 68, 0.6),
            0 0 30px rgba(239, 68, 68, 0.4),
            0 0 40px rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 1);
        }
      }
      
      .neon-pulse .text-red-600 {
        animation: neonGlow 2s ease-in-out infinite alternate;
        text-shadow: 
          0 0 5px rgba(239, 68, 68, 0.8),
          0 0 10px rgba(239, 68, 68, 0.6),
          0 0 15px rgba(239, 68, 68, 0.4);
      }
      
      @keyframes neonGlow {
        0% {
          text-shadow: 
            0 0 5px rgba(239, 68, 68, 0.8),
            0 0 10px rgba(239, 68, 68, 0.6),
            0 0 15px rgba(239, 68, 68, 0.4);
        }
        100% {
          text-shadow: 
            0 0 10px rgba(239, 68, 68, 1),
            0 0 20px rgba(239, 68, 68, 0.8),
            0 0 30px rgba(239, 68, 68, 0.6),
            0 0 40px rgba(239, 68, 68, 0.4);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const alertId = params.id as string;
  
  // Debug: Verificar que el componente no se está recargando infinitamente
  useEffect(() => {
    console.log('🔄 ActivePanicPage montado/actualizado:', new Date().toISOString());
    return () => {
      console.log('🔄 ActivePanicPage desmontado:', new Date().toISOString());
    };
  }, []);

  // Monitorear conexión de Firebase
  useEffect(() => {
    console.log('🔗 Iniciando monitoreo de conexión Firebase...');
    
    let unsubscribe: (() => void) | null = null;
    
    // Verificar conexión inicial
    const checkConnection = () => {
      // Usar una operación simple de Firebase para verificar conexión
      const testDoc = doc(db, 'panicReports', 'connection-test');
      getDoc(testDoc).then(() => {
        setFirebaseConnected(true);
        console.log('✅ Firebase conectado');
      }).catch((error) => {
        setFirebaseConnected(false);
        console.log('❌ Firebase desconectado:', error.message);
      });
    };

    // Verificar inicialmente
    checkConnection();

    // Usar onSnapshot para monitorear el estado de conexión
    // Esto es más preciso que polling manual
    const connectionTestRef = doc(db, 'panicReports', 'connection-test');
    
    // Intentar leer un documento que sabemos que existe (la alerta actual)
    if (alertId) {
      const alertRef = doc(db, 'panicReports', alertId);
      unsubscribe = onSnapshot(
        alertRef,
        (doc) => {
          if (doc.exists()) {
            setFirebaseConnected(true);
            console.log('✅ Firebase conectado (onSnapshot activo)');
          }
        },
        (error) => {
          setFirebaseConnected(false);
          console.log('❌ Firebase desconectado (onSnapshot error):', error.message);
        }
      );
    }

    // Verificar periódicamente cada 15 segundos como backup
    const interval = setInterval(checkConnection, 15000);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(interval);
      console.log('🔗 Monitoreo de conexión Firebase detenido');
    };
  }, [alertId]);
  
  // Estados
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isEmitter, setIsEmitter] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  
  // Estados de presencia
  const [onlineUsers, setOnlineUsers] = useState<Record<string, { userName: string; lastSeen: number }>>({});
  const [usersTyping, setUsersTyping] = useState<Record<string, boolean>>({});
  
  // Estado de conexión Firebase
  const [firebaseConnected, setFirebaseConnected] = useState(true);
  
  // Estado de sonido de alarma
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alarmPlayed, setAlarmPlayed] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const routerRef = useRef(router); // Mantener referencia estable del router
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Actualizar routerRef cuando cambie router
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Cargar datos de la alerta UNA SOLA VEZ
  useEffect(() => {
    if (!alertId || !user) return;

    let isMounted = true; // Para evitar actualizaciones de estado en componentes desmontados

    const loadAlertData = async () => {
      try {
        const alertRef = doc(db, 'panicReports', alertId);
        const alertSnap = await getDoc(alertRef);

        if (!isMounted) return;

        if (!alertSnap.exists()) {
          toast.error('Alerta no encontrada');
          routerRef.current.push('/residentes/panico');
          return;
        }

        const data = alertSnap.data();
        
        // Verificar permisos
        const isUserEmitter = data.userId === user.uid;
        const isUserNotified = data.notifiedUsers?.includes(user.uid);
        
        if (!isUserEmitter && !isUserNotified) {
          toast.error('No tienes permiso para ver esta alerta');
          routerRef.current.push('/residentes/panico');
          return;
        }

        if (!isMounted) return;

        setIsEmitter(isUserEmitter);
        
        if (!isUserEmitter) {
          setHasAcknowledged((data.acknowledgedBy || []).includes(user.uid));
        }

        setAlertData({
          id: alertSnap.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          location: data.location,
          description: data.description,
          timestamp: data.timestamp,
          status: data.status,
          notifiedUsers: data.notifiedUsers || [],
          acknowledgedBy: data.acknowledgedBy || [],
          alertDurationMinutes: data.alertDurationMinutes,
          expiresAt: data.expiresAt,
          gpsLatitude: data.gpsLatitude,
          gpsLongitude: data.gpsLongitude,
          extremeMode: data.extremeMode,
          hasVideo: data.hasVideo
        });

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar alerta:', error);
        if (isMounted) {
          toast.error('Error al cargar datos de la alerta');
          routerRef.current.push('/residentes/panico');
        }
      }
    };

    loadAlertData();

    return () => {
      isMounted = false;
    };
    // Remover router de las dependencias para evitar bucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId, user]);

  // Cargar configuración de sonido desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panic_sound_enabled');
      if (stored !== null) {
        setSoundEnabled(stored === 'true');
      }
    }
  }, []);

  // Reproducir sonido de alarma cuando se carga la alerta activa
  useEffect(() => {
    if (!alertData || loading || alarmPlayed) return;

    // Solo reproducir para receptores, no para el emisor
    if (isEmitter) {
      console.log('ℹ️ Emisor de alerta - sonido no necesario');
      return;
    }

    // Solo reproducir si la alerta está activa
    if (alertData.status !== 'active') {
      console.log('ℹ️ Alerta no activa - sonido no necesario');
      return;
    }

    // Verificar si el sonido está habilitado
    if (!soundEnabled) {
      console.log('🔇 Sonido deshabilitado por configuración del usuario');
      return;
    }

    // Verificar si ya se está reproduciendo
    if (isPlaying()) {
      console.log('🔊 Sonido ya se está reproduciendo');
      setAlarmPlayed(true);
      return;
    }

    console.log('🚨 Intentando reproducir sonido de alarma de emergencia...');
    
    // Pequeño delay para asegurar que la página se haya cargado
    const playSound = setTimeout(() => {
      try {
        startAlarm('emergency');
        setAlarmPlayed(true);
        setShowSoundPrompt(false); // Ocultar prompt si el sonido se reproduce
        console.log('✅ Sonido de alarma iniciado correctamente');
        
        toast.success('🔊 Sonido de emergencia activado', {
          duration: 3000
        });
      } catch (error) {
        console.error('❌ Error al reproducir sonido (autoplay bloqueado):', error);
        // Mostrar banner para que el usuario active el sonido manualmente
        setShowSoundPrompt(true);
        setAlarmPlayed(false); // Permitir que se reproduzca cuando el usuario haga click
        
        toast('⚠️ Click en el botón 🔊 para activar el sonido', {
          duration: 5000,
          icon: '⚠️'
        });
      }
    }, 500); // Delay de 500ms para permitir interacción previa

    return () => clearTimeout(playSound);
  }, [alertData, loading, isEmitter, soundEnabled, startAlarm, isPlaying, alarmPlayed]);

  // Guardar configuración de sonido en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panic_sound_enabled', soundEnabled.toString());
    }
  }, [soundEnabled]);

  // Detener sonido cuando se sale de la página o la alerta se resuelve
  useEffect(() => {
    return () => {
      if (isPlaying()) {
        console.log('🛑 Deteniendo sonido al salir de la página');
        stopAlarm();
      }
    };
  }, [isPlaying, stopAlarm]);

  // Escucha en TIEMPO REAL de cambios en la alerta (reemplaza polling)
  useEffect(() => {
    if (!alertId || !user || loading) return;

    console.log('📡 Iniciando escucha en tiempo real de alerta:', alertId);

    const alertRef = doc(db, 'panicReports', alertId);
    
    // onSnapshot detecta cambios en TIEMPO REAL
    const unsubscribe = onSnapshot(
      alertRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log('⚠️ Alerta no existe o fue eliminada');
          return;
        }

        const data = snapshot.data();
        console.log('🔄 Alerta actualizada en tiempo real:', {
          status: data.status,
          acknowledgedCount: data.acknowledgedBy?.length || 0
        });

        // Actualizar datos de la alerta
        setAlertData(prev => {
          if (!prev) return null;
          
          // Detectar cambios de estado para notificaciones
          const wasActive = prev.status === 'active';
          const nowResolved = data.status === 'resolved';
          const nowExpired = data.status === 'expired';
          
          // Mostrar notificaciones según cambios de estado
          if (wasActive && nowResolved) {
            toast.success('La alerta ha sido resuelta');
            // Detener sonido de alarma si está sonando
            if (isPlaying()) {
              stopAlarm();
            }
          }
          
          if (wasActive && nowExpired) {
            toast('La alerta ha expirado', { icon: '⏱️' });
            // Detener sonido de alarma si está sonando
            if (isPlaying()) {
              stopAlarm();
            }
          }
          
          return {
            ...prev,
            acknowledgedBy: data.acknowledgedBy || [],
            status: data.status,
            notifiedUsers: data.notifiedUsers || [],
            // Actualizar cualquier otro campo que pueda cambiar
            resolvedAt: data.resolvedAt,
            resolvedBy: data.resolvedBy,
            autoResolved: data.autoResolved
          };
        });
        
        // Verificar si el usuario actual ha confirmado
        const userIsEmitter = data.userId === user.uid;
        if (!userIsEmitter) {
          const userHasAcknowledged = (data.acknowledgedBy || []).includes(user.uid);
          setHasAcknowledged(userHasAcknowledged);
        }
      },
      (error) => {
        console.error('❌ Error al escuchar cambios en alerta:', error);
      }
    );

    return () => {
      console.log('📡 Deteniendo escucha de alerta');
      unsubscribe();
    };
  }, [alertId, user, loading]);

  // Chat en tiempo real usando Firestore onSnapshot (funciona en producción)
  useEffect(() => {
    if (!alertId || loading) {
      return;
    }
    
    console.log('💬 Iniciando escucha en tiempo real del chat (Firestore)...');
    
    // Consulta en tiempo real de mensajes del chat
    const messagesRef = collection(db, 'panicChats');
    const q = query(
      messagesRef,
      where('alertId', '==', alertId)
    );

    // onSnapshot escucha cambios en tiempo real
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const messages: ChatMessage[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            alertId: data.alertId,
            userId: data.userId,
            userName: data.userName,
            message: data.message,
            timestamp: data.timestamp
          });
        });
        
        // Ordenar mensajes por timestamp en el cliente
        messages.sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        
        console.log(`💬 Mensajes actualizados en tiempo real. Total: ${messages.length}`);
        setChatMessages(messages);
        
        // Scroll al final después de actualizar mensajes
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (error) => {
        console.error('❌ Error al escuchar mensajes en tiempo real:', error);
      }
    );

    // Cleanup al desmontar
    return () => {
      console.log('💬 Deteniendo escucha en tiempo real del chat...');
      unsubscribe();
    };
  }, [alertId, loading]);

  // WebSocket para chat de emergencia (solo en desarrollo como complemento)
  useEffect(() => {
    if (!alertId || !user || !userProfile || loading) {
      return;
    }

    // Si el WebSocket está disponible, úsalo como complemento
    if (socket && isConnected) {
      console.log(`💬 WebSocket disponible - Uniéndose al chat (Socket: ${socket.id})`);
      
      // Unirse a la sala del chat
      socket.emit('chat:join', {
        alertId,
        userId: user.uid,
        userName: userProfile.displayName || user.displayName || 'Usuario'
      });

      // Escuchar confirmación de envío
      const handleMessageSent = (data: any) => {
        console.log('✅ Mensaje enviado confirmado vía WebSocket:', data);
        setSendingMessage(false);
      };

      // Escuchar errores del chat
      const handleChatError = (error: any) => {
        console.error('❌ Error en chat WebSocket:', error);
        setSendingMessage(false);
      };

      // Registrar listeners
      socket.on('chat:message_sent', handleMessageSent);
      socket.on('chat:error', handleChatError);

      // Cleanup
      return () => {
        socket.off('chat:message_sent', handleMessageSent);
        socket.off('chat:error', handleChatError);
        
        if (socket.connected) {
          socket.emit('chat:leave', {
            alertId,
            userId: user.uid,
            userName: userProfile.displayName || user.displayName || 'Usuario'
          });
        }
      };
    } else {
      console.log('ℹ️ WebSocket no disponible - Usando solo Firestore en tiempo real');
    }
  }, [alertId, user, userProfile, loading, socket, isConnected]);

  // Presencia de usuarios en TIEMPO REAL (quién está viendo la alerta)
  useEffect(() => {
    if (!alertId || !user || !userProfile) return;

    console.log('🟢 Iniciando sistema de presencia para alerta:', alertId);

    // Referencia a la presencia de esta alerta específica
    const presenceRef = doc(db, 'alertPresence', alertId);
    const userId = user.uid;
    const userName = userProfile.displayName || user.displayName || 'Usuario';

    // Marcar como presente
    const markPresent = async () => {
      try {
        const presenceData: any = {};
        presenceData[userId] = {
          userName,
          lastSeen: Date.now(),
          isTyping: false
        };

        await setDoc(presenceRef, presenceData, { merge: true });
      } catch (error) {
        console.error('Error al marcar presencia:', error);
      }
    };

    // Marcar como ausente
    const markAbsent = async () => {
      try {
        const presenceData: any = {};
        presenceData[userId] = {
          userName,
          lastSeen: Date.now(),
          isTyping: false,
          offline: true
        };

        await setDoc(presenceRef, presenceData, { merge: true });
      } catch (error) {
        console.error('Error al marcar ausencia:', error);
      }
    };

    // Marcar presente al inicio
    markPresent();

    // Heartbeat cada 10 segundos
    const heartbeatInterval = setInterval(markPresent, 10000);

    // Escuchar cambios en presencia (otros usuarios)
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const now = Date.now();
        const onlineThreshold = 20000; // 20 segundos

        // Filtrar usuarios que están realmente en línea
        const online: Record<string, { userName: string; lastSeen: number }> = {};
        const typing: Record<string, boolean> = {};

        Object.entries(data).forEach(([uid, userData]: [string, any]) => {
          if (uid === userId) return; // Ignorar a sí mismo
          
          const isOnline = !userData.offline && (now - userData.lastSeen) < onlineThreshold;
          
          if (isOnline) {
            online[uid] = {
              userName: userData.userName,
              lastSeen: userData.lastSeen
            };
            typing[uid] = userData.isTyping || false;
          }
        });

        setOnlineUsers(online);
        setUsersTyping(typing);
      }
    });

    // Marcar ausente al salir
    window.addEventListener('beforeunload', markAbsent);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', markAbsent);
      markAbsent();
      unsubscribe();
    };
  }, [alertId, user, userProfile]);

  // Indicador de "escribiendo" en TIEMPO REAL
  const handleTypingIndicator = useCallback(async () => {
    if (!alertId || !user) return;

    const presenceRef = doc(db, 'alertPresence', alertId);
    const userId = user.uid;

    try {
      // Marcar como escribiendo
      const presenceData: any = {};
      presenceData[userId] = {
        userName: userProfile?.displayName || user.displayName || 'Usuario',
        lastSeen: Date.now(),
        isTyping: true
      };
      await setDoc(presenceRef, presenceData, { merge: true });

      // Limpiar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Marcar como NO escribiendo después de 3 segundos
      typingTimeoutRef.current = setTimeout(async () => {
        presenceData[userId].isTyping = false;
        await setDoc(presenceRef, presenceData, { merge: true });
      }, 3000);
    } catch (error) {
      console.error('Error al indicar escritura:', error);
    }
  }, [alertId, user, userProfile]);

  // Actualizar tiempo restante
  useEffect(() => {
    if (!alertData?.expiresAt) return;

    // Si la alerta ya no está activa, detener el cronómetro
    if (alertData.status !== 'active') {
      // Limpiar intervalo si existe
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      
      // Mostrar estado apropiado
      if (alertData.status === 'resolved') {
        setTimeRemaining('Resuelta');
      } else if (alertData.status === 'expired') {
        setTimeRemaining('Expirada');
      }
      
      return;
    }

    const expiresAt = alertData.expiresAt;

    const updateTime = () => {
      // Verificar nuevamente el estado antes de actualizar
      if (alertData.status !== 'active') {
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
        return;
      }

      const now = new Date();
      const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
      const diffMs = expires.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Expirada');
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
        return;
      }

      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTime();
    timeIntervalRef.current = setInterval(updateTime, 1000);
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    };
  }, [alertData?.expiresAt, alertData?.status]);

  // Iniciar video (solo emisor) - una sola vez
  useEffect(() => {
    if (!alertData?.extremeMode || !isEmitter || isRecording) return;

    const startVideo = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });

        setStream(mediaStream);
        setIsRecording(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        const mediaRecorder = new MediaRecorder(mediaStream, {
          mimeType: 'video/webm;codecs=vp8,opus'
        });

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        toast.success('📹 Grabación iniciada', { icon: '🎥', duration: 2000 });
      } catch (error) {
        console.error('Error al iniciar video:', error);
        toast.error('No se pudo iniciar la cámara');
      }
    };

    startVideo();
    // Solo depender de extremeMode e isEmitter, no de isRecording
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertData?.extremeMode, isEmitter]);

  // Cleanup del video
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stream]);

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    toast.success('Grabación detenida');
  }, [stream, isRecording]);

  // Enviar mensaje al chat usando Firestore (funciona en producción)
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userProfile || !alertId) return;

    setSendingMessage(true);
    const messageText = newMessage.trim();
    const userName = userProfile.displayName || user.displayName || 'Usuario';
    
    // Limpiar input inmediatamente
    setNewMessage('');

    try {
      // Guardar mensaje en Firestore - Firestore onSnapshot se encarga del tiempo real
      const messageRef = await addDoc(collection(db, 'panicChats'), {
        alertId,
        userId: user.uid,
        userName,
        message: messageText,
        timestamp: serverTimestamp()
      });

      console.log('💾 Mensaje guardado en Firestore:', messageRef.id);
      
      // Si WebSocket está disponible, también enviar por ahí (opcional, complementario)
      if (socket && socket.connected) {
        socket.emit('chat:send_message', {
          alertId,
          userId: user.uid,
          userName,
          message: messageText,
          firestoreId: messageRef.id
        });
      }
      
      // Marcar como enviado después de guardar en Firestore
      setSendingMessage(false);

    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      toast.error('Error al enviar mensaje');
      setSendingMessage(false);
    }
  }, [newMessage, user, userProfile, alertId, socket]);

  // Confirmar alerta (receptores)
  const handleAcknowledgeAlert = useCallback(async () => {
    if (!alertId || !user) return;

    try {
      const alertRef = doc(db, 'panicReports', alertId);
      await updateDoc(alertRef, {
        acknowledgedBy: arrayUnion(user.uid)
      });

      setHasAcknowledged(true);
      
      // Detener sonido de alarma al confirmar
      if (isPlaying()) {
        stopAlarm();
        console.log('🔇 Sonido detenido al confirmar recepción');
      }
      
      toast.success('✅ Confirmación registrada', { icon: '✅', duration: 3000 });
    } catch (error) {
      console.error('Error al confirmar:', error);
      toast.error('Error al registrar confirmación');
    }
  }, [alertId, user, isPlaying, stopAlarm]);

  // Resolver alerta (emisor)
  const handleResolveAlert = useCallback(async () => {
    if (!alertId) return;

    try {
      const alertRef = doc(db, 'panicReports', alertId);
      await updateDoc(alertRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: user?.uid
      });

      toast.success('Alerta marcada como resuelta');
      stopRecording();
      
      setTimeout(() => {
        routerRef.current.push('/residentes/panico');
      }, 2000);
    } catch (error) {
      console.error('Error al resolver alerta:', error);
      toast.error('Error al resolver alerta');
    }
    // Remover router de las dependencias para evitar re-creaciones
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId, user?.uid, stopRecording]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de emergencia...</p>
        </div>
      </div>
    );
  }

  if (!alertData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Alerta No Encontrada</h2>
            <button
              onClick={() => routerRef.current.push('/residentes/panico')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Volver a Pánico
            </button>
          </div>
        </div>
      </div>
    );
  }

  const acknowledgedCount = alertData.acknowledgedBy?.length || 0;
  const totalNotified = alertData.notifiedUsers?.length || 0;
  const confirmationRate = totalNotified > 0 ? Math.round((acknowledgedCount / totalNotified) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-6">
        {/* Header - Responsive */}
        <div className="bg-red-600 text-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
          {/* Header principal - Stack en móviles */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight">
                  🚨 {isEmitter ? 'EMERGENCIA' : 'ALERTA'}
                </h1>
                <p className="text-red-100 text-xs sm:text-sm md:text-base line-clamp-2">
                  {isEmitter 
                    ? 'Tu alerta de pánico está en curso' 
                    : `${alertData.userName} necesita ayuda`
                  }
                </p>
              </div>
            </div>
            
            {/* Controles - Horizontal en móviles */}
            <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
              {/* Control de sonido */}
              <button
                onClick={() => {
                  const newState = !soundEnabled;
                  setSoundEnabled(newState);
                  if (!newState && isPlaying()) {
                    stopAlarm();
                  } else if (newState && !isPlaying() && alertData.status === 'active' && !isEmitter) {
                    // Reproducir sonido cuando se activa manualmente
                    startAlarm('emergency');
                    toast.success('🔊 Sonido activado');
                  } else {
                    toast.success(newState ? '🔊 Sonido activado' : '🔇 Sonido desactivado');
                  }
                }}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                  soundEnabled
                    ? 'bg-white bg-opacity-20 hover:bg-opacity-30'
                    : 'bg-gray-600 bg-opacity-50 hover:bg-opacity-60'
                }`}
                title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
              >
                <span className="text-lg sm:text-xl">{soundEnabled ? '🔊' : '🔇'}</span>
                <span className="hidden sm:inline text-xs md:text-sm">
                  {soundEnabled ? 'Sonido' : 'Silencio'}
                </span>
              </button>

              {/* Indicador de conexión Firebase */}
              <div 
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg text-sm sm:text-base transition-all duration-300 ${
                  firebaseConnected 
                    ? 'bg-green-500 bg-opacity-30 hover:bg-opacity-40' 
                    : 'bg-red-500 bg-opacity-30 hover:bg-opacity-40'
                }`}
                title={firebaseConnected ? 'Conectado a Firebase - Datos en tiempo real' : 'Desconectado de Firebase - Sin datos en tiempo real'}
              >
                <div className="relative">
                  {firebaseConnected ? (
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                  )}
                  {firebaseConnected && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="font-semibold text-xs sm:text-sm hidden xs:inline">
                  {firebaseConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Info - Responsive Grid con mejor contraste */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-red-700 bg-opacity-80 rounded-lg p-4 border border-red-400">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-red-100">Tiempo Restante</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white leading-tight">{timeRemaining}</p>
            </div>

            <div className="bg-red-700 bg-opacity-80 rounded-lg p-4 border border-red-400">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-red-100">Confirmaciones</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {acknowledgedCount}/{totalNotified}
              </p>
              <p className="text-sm text-red-200 mt-1">({confirmationRate}%)</p>
            </div>

            <div className="bg-red-700 bg-opacity-80 rounded-lg p-4 border border-red-400">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-red-100">Estado</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white capitalize leading-tight">{alertData.status}</p>
            </div>
          </div>
        </div>

        {/* Banner de conexión Firebase desconectado */}
        {!firebaseConnected && (
          <div className="bg-red-600 text-white rounded-lg shadow-lg p-4 mb-4 border-2 border-red-400 animate-pulse">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <WifiOff className="w-6 h-6 text-red-200" />
                <div>
                  <h3 className="font-bold text-lg">⚠️ Sin Conexión a Firebase</h3>
                  <p className="text-red-100 text-sm">
                    Los datos no se están actualizando en tiempo real. Verifica tu conexión a internet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50 active:bg-red-100 transition-colors flex-shrink-0"
              >
                RECARGAR
              </button>
            </div>
          </div>
        )}

        {/* Banner para activar sonido manualmente - Solo si es receptor y el sonido está habilitado pero no se reproduce */}
        {showSoundPrompt && !isEmitter && soundEnabled && !isPlaying() && alertData.status === 'active' && (
          <div className="bg-orange-500 text-white rounded-lg shadow-lg p-3 sm:p-4 mb-3 sm:mb-4 md:mb-6 animate-pulse">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="text-2xl sm:text-3xl">🔊</div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base md:text-lg">Activa el Sonido de Emergencia</h3>
                  <p className="text-orange-100 text-xs sm:text-sm">Click en el botón 🔊 arriba o aquí para activar el sonido</p>
                </div>
              </div>
              <button
                onClick={() => {
                  try {
                    startAlarm('emergency');
                    setAlarmPlayed(true);
                    setShowSoundPrompt(false);
                    toast.success('🔊 Sonido activado correctamente');
                  } catch (error) {
                    toast.error('No se pudo activar el sonido');
                  }
                }}
                className="bg-white text-orange-600 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base hover:bg-orange-50 active:bg-orange-100 transition-colors flex-shrink-0"
              >
                ACTIVAR
              </button>
            </div>
          </div>
        )}

        {/* Grid principal - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Banner confirmación (receptores) - Mejorado */}
            {!isEmitter && !hasAcknowledged && (
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-2xl p-6 border-2 border-green-400">
                <div className="text-center">
                  <div className="mb-4">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-100 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">¿Recibiste la alerta de emergencia?</h3>
                  <p className="text-green-100 text-lg mb-6">
                    {alertData.userName.split(' ')[0]} necesita tu confirmación de que has sido notificado
                  </p>
                  <button
                    onClick={handleAcknowledgeAlert}
                    className="w-full bg-white text-green-700 py-4 px-6 rounded-xl font-bold text-xl hover:bg-green-50 active:bg-green-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ✅ SÍ, HE SIDO NOTIFICADO
                  </button>
                </div>
              </div>
            )}

            {/* Video (solo emisor) - Responsive */}
            {isEmitter && alertData.extremeMode && (
              <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 flex items-center flex-wrap gap-2">
                  <Video className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  <span>Grabación de Video</span>
                  {isRecording && (
                    <span className="ml-auto px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>GRABANDO</span>
                    </span>
                  )}
                </h2>

                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-48 sm:h-56 md:h-64 bg-black rounded-lg object-cover"
                />

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="w-full mt-3 sm:mt-4 bg-gray-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-gray-700 active:bg-gray-800 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
                  >
                    <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Detener Grabación</span>
                  </button>
                )}
              </div>
            )}

            {/* Mapa - Mejorado */}
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h2 className="text-xl font-bold flex items-center">
                  <MapPin className="w-6 h-6 mr-3" />
                  {isEmitter ? 'Tu Ubicación de Emergencia' : `Ubicación de ${alertData.userName.split(' ')[0]}`}
                </h2>
              </div>
              
              <div className="p-4">
                <div className="w-full h-64 sm:h-72 md:h-80 rounded-lg overflow-hidden border-2 border-gray-300 shadow-inner">
                  <EmergencyLocationMap
                    latitude={alertData.gpsLatitude}
                    longitude={alertData.gpsLongitude}
                    location={alertData.location}
                    userName={alertData.userName}
                  />
                </div>

                <div className="mt-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        {alertData.location}
                      </p>
                      {alertData.gpsLatitude && alertData.gpsLongitude && (
                        <div className="bg-white rounded p-2 border">
                          <p className="text-xs text-gray-600 mb-1">Coordenadas GPS:</p>
                          <p className="text-sm font-mono text-gray-800">
                            Lat: {alertData.gpsLatitude.toFixed(6)}, Lng: {alertData.gpsLongitude.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Confirmaciones - Mejorado */}
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Users className="w-6 h-6 mr-3" />
                  Estado de Notificaciones
                </h2>
              </div>
              
              <div className="p-4">

                {/* Usuarios viendo la alerta en TIEMPO REAL - Mejorado */}
                {Object.keys(onlineUsers).length > 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-300">
                    <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Viendo ahora ({Object.keys(onlineUsers).length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(onlineUsers).map(([uid, userData]) => (
                        <div 
                          key={uid}
                          className="inline-flex items-center px-3 py-1.5 bg-white rounded-full text-sm font-medium text-green-700 border border-green-300 shadow-sm"
                        >
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {userData.userName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Progreso de Confirmaciones</span>
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                      {acknowledgedCount}/{totalNotified} ({confirmationRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${confirmationRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alertData.notifiedUsers?.map((userId) => {
                    const hasAck = alertData.acknowledgedBy?.includes(userId);
                    const isOnline = onlineUsers[userId] !== undefined;
                    return (
                      <div
                        key={userId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          hasAck 
                            ? 'bg-green-50 border-green-200' 
                            : isOnline 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span className="text-sm flex items-center min-w-0">
                          {isOnline && (
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0 animate-pulse"></span>
                          )}
                          <span className="font-medium">{onlineUsers[userId]?.userName || 'Contacto'}</span>
                        </span>
                        {hasAck ? (
                          <span className="flex items-center text-green-700 text-sm font-medium flex-shrink-0 ml-2 bg-green-100 px-2 py-1 rounded">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmó
                          </span>
                        ) : (
                          <span className={`text-sm font-medium flex-shrink-0 ml-2 px-2 py-1 rounded ${
                            isOnline 
                              ? 'text-blue-700 bg-blue-100' 
                              : 'text-orange-700 bg-orange-100'
                          }`}>
                            {isOnline ? 'Viendo...' : 'Pendiente'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chat - Mejorado */}
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h2 className="text-xl font-bold flex items-center">
                  <MessageCircle className="w-6 h-6 mr-3" />
                  Chat de Emergencia
                </h2>
              </div>
              
              <div className="p-4">
              
                {/* Leyenda de tipos de mensajes - Mejorado */}
                <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipos de mensajes:</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded mr-2 neon-pulse flex-shrink-0"></div>
                      <span className="text-red-700 font-medium">⚠️ Solicita ayuda</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-600 rounded mr-2 flex-shrink-0"></div>
                      <span className="text-blue-700 font-medium">Tus mensajes</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-300 rounded mr-2 flex-shrink-0"></div>
                      <span className="text-gray-700">Otros usuarios</span>
                    </div>
                  </div>
                </div>

                {/* Mensajes - Mejorado */}
                <div className="bg-gray-50 rounded-lg p-4 h-72 overflow-y-auto mb-4 border border-gray-200 shadow-inner">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Aún no hay mensajes</p>
                      <p className="text-sm text-gray-400 mt-2">Sé el primero en escribir</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg) => {
                        const isOwn = msg.userId === user?.uid;
                        const isEmitter = msg.userId === alertData.userId;
                        const isResponder = !isOwn && !isEmitter;
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-4 py-3 relative shadow-sm ${
                                isEmitter 
                                  ? 'bg-red-100 border-2 border-red-400 text-red-900 shadow-lg neon-pulse'
                                  : isOwn 
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white border border-gray-200 text-gray-900'
                              }`}
                            >
                              {/* Header del mensaje con icono */}
                              <div className="flex items-center mb-2">
                                {isEmitter && (
                                  <AlertTriangle className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                                )}
                                {isResponder && (
                                  <Users className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                                )}
                                <p className="text-xs font-semibold opacity-75">
                                  {isOwn 
                                    ? 'Tú' 
                                    : isEmitter 
                                      ? `${msg.userName.split(' ')[0]} (Solicita ayuda)` 
                                      : msg.userName.split(' ')[0]
                                  }
                                </p>
                              </div>
                              
                              {/* Contenido del mensaje */}
                              <p className="text-sm break-words mb-2">{msg.message}</p>
                              
                              {/* Timestamp */}
                              <p className={`text-xs opacity-75 ${
                                isEmitter ? 'text-red-600' : isOwn ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Indicador de usuarios escribiendo - Mejorado */}
                {Object.entries(usersTyping).some(([_, isTyping]) => isTyping) && (
                  <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 flex items-center">
                      <span className="flex space-x-1 mr-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                      <span className="truncate">
                        {Object.entries(usersTyping)
                          .filter(([_, isTyping]) => isTyping)
                          .map(([uid, _]) => onlineUsers[uid]?.userName?.split(' ')[0])
                          .filter(Boolean)
                          .join(', ')} {Object.entries(usersTyping).filter(([_, isTyping]) => isTyping).length === 1 ? 'está' : 'están'} escribiendo...
                      </span>
                    </p>
                  </div>
                )}

                {/* Input - Mejorado */}
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTypingIndicator();
                    }}
                    placeholder="Escribe un mensaje de emergencia..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm"
                    disabled={sendingMessage || alertData.status !== 'active'}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim() || alertData.status !== 'active'}
                    className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones - Mejoradas */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl p-4 md:relative md:mt-6 md:rounded-xl md:shadow-2xl md:border-t-0 z-50">
          <h2 className="text-lg font-bold mb-4 hidden md:block text-center text-gray-800">
            {isEmitter ? 'Acciones de Emergencia' : 'Responder a Emergencia'}
          </h2>
          
          {isEmitter ? (
            <div className="grid grid-cols-2 gap-4">
              <a
                href="tel:911"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-red-700 hover:to-red-800 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Phone className="w-6 h-6" />
                <span>LLAMAR 911</span>
              </a>

              <button
                onClick={handleResolveAlert}
                disabled={alertData.status !== 'active'}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 active:scale-95 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <CheckCircle className="w-6 h-6" />
                <span className="hidden sm:inline">MARCAR RESUELTA</span>
                <span className="sm:hidden">RESUELTA</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!hasAcknowledged && (
                <button
                  onClick={handleAcknowledgeAlert}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white py-5 px-6 rounded-xl font-bold text-xl hover:from-green-700 hover:to-green-800 active:scale-95 shadow-2xl hover:shadow-3xl transition-all duration-200"
                >
                  <CheckCircle className="w-7 h-7" />
                  <span>HE SIDO NOTIFICADO</span>
                </button>
              )}

              {hasAcknowledged && (
                <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-3 text-green-700">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-bold text-lg">¡Ya confirmaste tu recepción!</span>
                  </div>
                  <p className="text-center text-green-600 text-sm mt-2">
                    Continúa usando el chat para coordinar la ayuda
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <a
                  href="tel:911"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl font-bold text-base hover:from-red-700 hover:to-red-800 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Phone className="w-5 h-5" />
                  <span>LLAMAR 911</span>
                </a>

                <button
                  onClick={() => routerRef.current.push('/residentes/panico')}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-xl font-semibold text-base hover:from-gray-700 hover:to-gray-800 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <X className="w-5 h-5" />
                  <span>VOLVER</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivePanicPage;

