'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const routerRef = useRef(router); // Mantener referencia estable del router
  
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

  // Polling manual para actualizar datos (cada 5 segundos) en lugar de onSnapshot
  useEffect(() => {
    if (!alertId || !user || loading) return;

    const refreshData = async () => {
      try {
        const alertRef = doc(db, 'panicReports', alertId);
        const alertSnap = await getDoc(alertRef);

        if (alertSnap.exists()) {
          const data = alertSnap.data();
          setAlertData(prev => {
            // Solo actualizar si hay cambios reales
            if (!prev) return null;
            
            const acknowledgedChanged = JSON.stringify(prev.acknowledgedBy) !== JSON.stringify(data.acknowledgedBy || []);
            const statusChanged = prev.status !== data.status;
            
            if (!acknowledgedChanged && !statusChanged) {
              return prev; // No actualizar si no hay cambios
            }
            
            return {
              ...prev,
              acknowledgedBy: data.acknowledgedBy || [],
              status: data.status
            };
          });
          
          // Verificar acknowledged sin depender de isEmitter
          const userIsEmitter = data.userId === user.uid;
          if (!userIsEmitter) {
            const userHasAcknowledged = (data.acknowledgedBy || []).includes(user.uid);
            setHasAcknowledged(userHasAcknowledged);
          }
        }
      } catch (error) {
        console.error('Error al actualizar datos:', error);
      }
    };

    // Actualizar cada 5 segundos
    refreshIntervalRef.current = setInterval(refreshData, 5000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [alertId, user, loading]); // Removido isEmitter de las dependencias

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

  // Actualizar tiempo restante
  useEffect(() => {
    if (!alertData?.expiresAt) return;

    const expiresAt = alertData.expiresAt;

    const updateTime = () => {
      const now = new Date();
      const expires = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
      const diffMs = expires.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Expirada');
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
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
      }
    };
  }, [alertData?.expiresAt]);

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
      toast.success('✅ Confirmación registrada', { icon: '✅', duration: 3000 });
    } catch (error) {
      console.error('Error al confirmar:', error);
      toast.error('Error al registrar confirmación');
    }
  }, [alertId, user]);

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-red-600 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  🚨 {isEmitter ? 'EMERGENCIA ACTIVA' : 'ALERTA DE EMERGENCIA'}
                </h1>
                <p className="text-red-100 text-lg">
                  {isEmitter 
                    ? 'Tu alerta de pánico está en curso' 
                    : `${alertData.userName} necesita ayuda urgente`
                  }
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isConnected ? 'bg-green-500 bg-opacity-30' : 'bg-yellow-500 bg-opacity-30'
            }`}>
              {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              <span className="font-semibold">{isConnected ? 'En línea' : 'Offline'}</span>
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Tiempo Restante:</span>
              </div>
              <p className="text-2xl font-bold mt-1">{timeRemaining}</p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Confirmaciones:</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {acknowledgedCount} / {totalNotified}
                <span className="text-lg ml-2">({confirmationRate}%)</span>
              </p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Estado:</span>
              </div>
              <p className="text-2xl font-bold mt-1 capitalize">{alertData.status}</p>
            </div>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            {/* Banner confirmación (receptores) */}
            {!isEmitter && !hasAcknowledged && (
              <div className="bg-green-600 text-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">¿Recibiste la alerta?</h3>
                    <p className="text-green-100">Confirma para que {alertData.userName.split(' ')[0]} sepa</p>
                  </div>
                </div>
                <button
                  onClick={handleAcknowledgeAlert}
                  className="w-full bg-white text-green-600 py-3 px-6 rounded-lg font-bold text-lg hover:bg-green-50"
                >
                  ✅ SÍ, HE SIDO NOTIFICADO
                </button>
              </div>
            )}

            {/* Video (solo emisor) */}
            {isEmitter && alertData.extremeMode && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Video className="w-6 h-6 mr-2 text-purple-600" />
                  Grabación de Video
                  {isRecording && (
                    <span className="ml-auto px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>GRABANDO</span>
                    </span>
                  )}
                </h2>

                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-64 bg-black rounded-lg object-cover"
                />

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
                  >
                    <StopCircle className="w-5 h-5" />
                    <span>Detener Grabación</span>
                  </button>
                )}
              </div>
            )}

            {/* Mapa */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-blue-600" />
                {isEmitter ? 'Tu Ubicación' : `Ubicación de ${alertData.userName.split(' ')[0]}`}
              </h2>
              
              <EmergencyLocationMap
                latitude={alertData.gpsLatitude}
                longitude={alertData.gpsLongitude}
                location={alertData.location}
                userName={alertData.userName}
              />

              <div className="mt-4 bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {alertData.location}
                </p>
                {alertData.gpsLatitude && alertData.gpsLongitude && (
                  <p className="text-xs text-blue-700 mt-1 font-mono">
                    GPS: {alertData.gpsLatitude.toFixed(6)}, {alertData.gpsLongitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            {/* Confirmaciones */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Users className="w-6 h-6 mr-2 text-green-600" />
                Estado de Notificaciones
              </h2>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Confirmaciones</span>
                  <span className="text-sm font-bold text-green-600">
                    {acknowledgedCount} de {totalNotified} ({confirmationRate}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${confirmationRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {alertData.notifiedUsers?.map((userId) => {
                  const hasAck = alertData.acknowledgedBy?.includes(userId);
                  return (
                    <div
                      key={userId}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        hasAck ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-sm">Contacto</span>
                      {hasAck ? (
                        <span className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmó
                        </span>
                      ) : (
                        <span className="text-orange-600 text-sm font-medium">Pendiente...</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
                Chat de Emergencia
              </h2>
              
              {/* Leyenda de tipos de mensajes */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tipos de mensajes:</h3>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded mr-2 neon-pulse"></div>
                    <span className="text-red-700 font-medium">⚠️ Quien solicita ayuda (con efecto neón)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                    <span className="text-blue-700 font-medium">Tus mensajes</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                    <span className="text-gray-700">Otros usuarios</span>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aún no hay mensajes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg) => {
                      const isOwn = msg.userId === user?.uid;
                      const isEmitter = msg.userId === alertData.userId; // El emisor de la alerta
                      const isResponder = !isOwn && !isEmitter; // Usuario que responde
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg px-4 py-2 relative ${
                              isEmitter 
                                ? 'bg-red-100 border-2 border-red-400 text-red-900 shadow-lg neon-pulse' // Emisor: con animación de neón
                                : isOwn 
                                  ? 'bg-blue-600 text-white shadow-md' // Propio: azul
                                  : 'bg-gray-200 text-gray-900' // Otros: gris
                            }`}
                          >
                            
                            {/* Header del mensaje con icono */}
                            <div className="flex items-center mb-1">
                              {isEmitter && (
                                <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />
                              )}
                              {isResponder && (
                                <Users className="w-4 h-4 mr-1 text-blue-600" />
                              )}
                              <p className="text-xs font-semibold opacity-75">
                                {isOwn 
                                  ? 'Tú' 
                                  : isEmitter 
                                    ? `${msg.userName} (Solicita Ayuda)` 
                                    : `${msg.userName} (Responde)`
                                }
                              </p>
                            </div>
                            
                            {/* Contenido del mensaje */}
                            <p className="text-sm">{msg.message}</p>
                            
                            {/* Timestamp */}
                            <p className={`text-xs mt-1 opacity-75 ${
                              isEmitter ? 'text-red-600' : isOwn ? 'text-blue-100' : 'text-gray-600'
                            }`}>
                              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={sendingMessage || alertData.status !== 'active'}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim() || alertData.status !== 'active'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {isEmitter ? 'Acciones de Emergencia' : 'Responder a Emergencia'}
          </h2>
          
          {isEmitter ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="tel:911"
                className="flex items-center justify-center space-x-2 bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-red-700"
              >
                <Phone className="w-6 h-6" />
                <span>LLAMAR AL 911</span>
              </a>

              <button
                onClick={handleResolveAlert}
                disabled={alertData.status !== 'active'}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <CheckCircle className="w-6 h-6" />
                <span>MARCAR COMO RESUELTA</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!hasAcknowledged && (
                <button
                  onClick={handleAcknowledgeAlert}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-4 px-6 rounded-lg font-bold text-xl hover:bg-green-700 shadow-lg"
                >
                  <CheckCircle className="w-7 h-7" />
                  <span>HE SIDO NOTIFICADO</span>
                </button>
              )}

              {hasAcknowledged && (
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-bold text-lg">Ya confirmaste esta alerta</span>
                  </div>
                  <p className="text-center text-green-600 text-sm mt-2">
                    Continúa usando el chat para coordinar
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="tel:911"
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700"
                >
                  <Phone className="w-5 h-5" />
                  <span>LLAMAR AL 911</span>
                </a>

                <button
                  onClick={() => routerRef.current.push('/residentes/panico')}
                  className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700"
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

