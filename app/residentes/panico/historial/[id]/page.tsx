'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  Phone, 
  Video,
  X,
  ArrowLeft,
  Shield,
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
  autoResolved?: boolean;
  resolvedAt?: any;
}

interface ChatMessage {
  id: string;
  alertId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: any;
}

const HistorialAlertDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const alertId = params.id as string;
  
  // Estados
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isEmitter, setIsEmitter] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cargar datos de la alerta
  useEffect(() => {
    if (!alertId || !user) return;

    const loadAlertData = async () => {
      try {
        const alertRef = doc(db, 'panicReports', alertId);
        const alertSnap = await getDoc(alertRef);

        if (!alertSnap.exists()) {
          toast.error('Alerta no encontrada');
          router.push('/residentes/panico');
          return;
        }

        const data = alertSnap.data();
        
        // Verificar permisos
        const isUserEmitter = data.userId === user.uid;
        const isUserNotified = data.notifiedUsers?.includes(user.uid);
        
        if (!isUserEmitter && !isUserNotified) {
          toast.error('No tienes permiso para ver esta alerta');
          router.push('/residentes/panico');
          return;
        }

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
          hasVideo: data.hasVideo,
          autoResolved: data.autoResolved,
          resolvedAt: data.resolvedAt
        });

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar alerta:', error);
        toast.error('Error al cargar datos de la alerta');
        router.push('/residentes/panico');
      }
    };

    loadAlertData();
  }, [alertId, user, router]);

  // Cargar mensajes del chat
  useEffect(() => {
    if (!alertId) return;

    const loadChatMessages = async () => {
      try {
        console.log('📚 Cargando mensajes del chat histórico...');
        const messagesRef = collection(db, 'panicChats');
        
        const q = query(
          messagesRef,
          where('alertId', '==', alertId)
        );

        const snapshot = await getDocs(q);
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
        
        console.log(`📚 Cargados ${messages.length} mensajes del chat`);
        setChatMessages(messages);
        
        // Scroll al final después de cargar mensajes
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (error) {
        console.error('❌ Error al cargar mensajes:', error);
      }
    };

    if (!loading) {
      loadChatMessages();
    }
  }, [alertId, loading]);

  // Actualizar tiempo cada segundo si la alerta está activa
  useEffect(() => {
    if (!alertData || alertData.status !== 'active') return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [alertData]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start: any, end: any) => {
    if (!start || !end) return 'N/A';
    const startDate = start.toDate ? start.toDate() : new Date(start);
    const endDate = end.toDate ? end.toDate() : new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  // Calcular duración real vs configurada
  const getDurationAnalysis = () => {
    if (!alertData) return null;

    const startTime = alertData.timestamp?.toDate ? alertData.timestamp.toDate() : new Date(alertData.timestamp);
    const endTime = alertData.resolvedAt?.toDate ? alertData.resolvedAt.toDate() : (alertData.resolvedAt ? new Date(alertData.resolvedAt) : new Date());
    const configuredDuration = alertData.alertDurationMinutes || 0;
    
    // Duración real en minutos
    const realDurationMs = endTime.getTime() - startTime.getTime();
    const realDurationMins = Math.floor(realDurationMs / 60000);
    
    // Comparación con duración configurada
    const difference = configuredDuration - realDurationMins;
    
    return {
      realDuration: realDurationMins,
      configuredDuration,
      difference,
      wasResolvedEarly: difference > 0,
      wasResolvedLate: difference < 0,
      wasResolvedOnTime: difference === 0,
      realDurationFormatted: calculateDuration(alertData.timestamp, alertData.resolvedAt || new Date()),
      configuredDurationFormatted: `${configuredDuration} minuto${configuredDuration !== 1 ? 's' : ''}`
    };
  };

  // Calcular tiempo restante si está activa
  const getTimeRemaining = () => {
    if (!alertData || alertData.status !== 'active') return null;

    const startTime = alertData.timestamp?.toDate ? alertData.timestamp.toDate() : new Date(alertData.timestamp);
    const configuredDuration = alertData.alertDurationMinutes || 0;
    const endTime = new Date(startTime.getTime() + configuredDuration * 60000);
    const now = new Date();
    
    const remainingMs = endTime.getTime() - now.getTime();
    
    if (remainingMs <= 0) {
      return {
        remaining: 0,
        remainingFormatted: 'Expirada',
        isExpired: true
      };
    }
    
    const remainingMins = Math.floor(remainingMs / 60000);
    const remainingSecs = Math.floor((remainingMs % 60000) / 1000);
    
    return {
      remaining: remainingMins,
      remainingSecs,
      remainingFormatted: `${remainingMins}:${remainingSecs.toString().padStart(2, '0')}`,
      isExpired: false
    };
  };

  // Función para resolver una alerta activa
  const handleResolveAlert = async () => {
    try {
      if (!alertId || !user) return;

      const alertRef = doc(db, 'panicReports', alertId);
      await updateDoc(alertRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid
      });

      console.log(`✅ Alerta ${alertId} marcada como resuelta por ${user.email}`);
      
      // Actualizar el estado local
      setAlertData(prev => prev ? { ...prev, status: 'resolved', resolvedAt: new Date() } : null);
      
      toast.success(`Alerta marcada como resuelta`, {
        icon: '✅',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al resolver alerta:', error);
      toast.error('Error al marcar alerta como resuelta');
    }
  };

  // Función para desactivar una alerta activa
  const handleDeactivateAlert = async () => {
    try {
      if (!alertId || !user) return;

      const alertRef = doc(db, 'panicReports', alertId);
      await updateDoc(alertRef, {
        status: 'expired',
        autoResolved: false,
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid
      });

      console.log(`⏹️ Alerta ${alertId} desactivada por ${user.email}`);
      
      // Actualizar el estado local
      setAlertData(prev => prev ? { ...prev, status: 'expired', resolvedAt: new Date() } : null);
      
      toast.success(`Alerta desactivada`, {
        icon: '⏹️',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al desactivar alerta:', error);
      toast.error('Error al desactivar alerta');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de la alerta...</p>
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
              onClick={() => router.push('/residentes/panico')}
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
        {/* Header con botón volver */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/residentes/panico')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al panel de emergencias
          </button>
        </div>

        {/* Header de alerta */}
        <div className={`rounded-lg shadow-lg p-6 mb-6 ${
          alertData.status === 'active' 
            ? 'bg-red-600 text-white' 
            : alertData.status === 'resolved'
            ? 'bg-green-600 text-white'
            : 'bg-orange-600 text-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {alertData.status === 'resolved' ? (
                  <CheckCircle className="w-10 h-10" />
                ) : alertData.status === 'expired' ? (
                  <Clock className="w-10 h-10" />
                ) : (
                  <AlertTriangle className="w-10 h-10" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {isEmitter ? 'Tu Alerta de Emergencia' : `Alerta de ${alertData.userName}`}
                </h1>
                <p className="text-lg opacity-90">
                  {isEmitter ? 'Registro histórico de tu alerta' : 'Alerta en la que fuiste notificado'}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${
                alertData.status === 'active' 
                  ? 'bg-red-800 bg-opacity-50 animate-pulse' 
                  : alertData.status === 'resolved'
                  ? 'bg-green-800 bg-opacity-50'
                  : 'bg-orange-800 bg-opacity-50'
              }`}>
                {alertData.status === 'resolved' 
                  ? '✓ RESUELTA' 
                  : alertData.status === 'expired'
                  ? (alertData.autoResolved ? '⏱️ EXPIRADA (Auto)' : '⏰ EXPIRADA')
                  : '🚨 ACTIVA'}
              </span>
            </div>
          </div>

          {/* Info básica */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Iniciada:</span>
              </div>
              <p className="text-lg font-bold">{formatTime(alertData.timestamp)}</p>
              <p className="text-xs opacity-75">{formatDate(alertData.timestamp).split(',')[0]}</p>
            </div>

            {alertData.resolvedAt && (
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Resuelta:</span>
                </div>
                <p className="text-lg font-bold">{formatTime(alertData.resolvedAt)}</p>
                <p className="text-xs opacity-75">
                  Duración: {calculateDuration(alertData.timestamp, alertData.resolvedAt)}
                </p>
              </div>
            )}

            {/* Tiempo restante para alertas activas */}
            {alertData.status === 'active' && (() => {
              const timeRemaining = getTimeRemaining();
              return timeRemaining && (
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Tiempo Restante:</span>
                  </div>
                  <p className={`text-2xl font-bold ${timeRemaining.isExpired ? 'text-red-300' : 'text-white'}`}>
                    {timeRemaining.remainingFormatted}
                  </p>
                  <p className="text-xs opacity-75">
                    {timeRemaining.isExpired ? 'Expirada' : 'Activa'}
                  </p>
                </div>
              );
            })()}

            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Confirmaciones:</span>
              </div>
              <p className="text-2xl font-bold">
                {acknowledgedCount} / {totalNotified}
              </p>
              <p className="text-xs opacity-75">({confirmationRate}%)</p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Duración:</span>
              </div>
              <p className="text-2xl font-bold">{alertData.alertDurationMinutes} min</p>
              <p className="text-xs opacity-75">Configurada</p>
            </div>
          </div>

          {/* Análisis de duración */}
          {(() => {
            const durationAnalysis = getDurationAnalysis();
            if (!durationAnalysis) return null;

            return (
              <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Análisis de Duración
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Duración Real */}
                  <div className="text-center">
                    <p className="text-sm opacity-75 mb-1">Duración Real</p>
                    <p className="text-xl font-bold">
                      {durationAnalysis.realDurationFormatted}
                    </p>
                  </div>

                  {/* Duración Configurada */}
                  <div className="text-center">
                    <p className="text-sm opacity-75 mb-1">Duración Configurada</p>
                    <p className="text-xl font-bold">
                      {durationAnalysis.configuredDurationFormatted}
                    </p>
                  </div>

                  {/* Estado de Resolución */}
                  <div className="text-center">
                    <p className="text-sm opacity-75 mb-1">Estado de Resolución</p>
                    {durationAnalysis.wasResolvedEarly && (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-green-300 text-xl font-bold">✓</span>
                        <span className="text-green-300 font-bold">Antes de tiempo</span>
                      </div>
                    )}
                    {durationAnalysis.wasResolvedLate && (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-orange-300 text-xl font-bold">⏰</span>
                        <span className="text-orange-300 font-bold">Después de tiempo</span>
                      </div>
                    )}
                    {durationAnalysis.wasResolvedOnTime && (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-blue-300 text-xl font-bold">🎯</span>
                        <span className="text-blue-300 font-bold">Exacto</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Diferencia detallada */}
                {durationAnalysis.difference !== 0 && (
                  <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                    <div className="text-center">
                      <p className="text-sm opacity-75">
                        {Math.abs(durationAnalysis.difference)} minuto{Math.abs(durationAnalysis.difference) !== 1 ? 's' : ''} 
                        {durationAnalysis.wasResolvedEarly ? ' menos' : ' más'} que lo configurado
                      </p>
                    </div>
                  </div>
                )}

                {/* Indicador visual de eficiencia */}
                <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                  <div className="flex items-center justify-center space-x-2">
                    {durationAnalysis.wasResolvedEarly && (
                      <>
                        <span className="text-green-300">⚡</span>
                        <span className="text-green-300 text-sm font-medium">
                          Resolución eficiente - Problema solucionado rápidamente
                        </span>
                      </>
                    )}
                    {durationAnalysis.wasResolvedLate && (
                      <>
                        <span className="text-orange-300">⏱️</span>
                        <span className="text-orange-300 text-sm font-medium">
                          Tiempo extendido - Alerta duró más de lo configurado
                        </span>
                      </>
                    )}
                    {durationAnalysis.wasResolvedOnTime && (
                      <>
                        <span className="text-blue-300">🎯</span>
                        <span className="text-blue-300 text-sm font-medium">
                          Tiempo preciso - Alerta duró exactamente lo configurado
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Badges informativos */}
          <div className="flex flex-wrap gap-2 mt-4">
            {isEmitter && (
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                📤 Alerta emitida por ti
              </span>
            )}
            {!isEmitter && (
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                📥 Fuiste notificado
              </span>
            )}
            {hasAcknowledged && !isEmitter && (
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                ✅ Confirmaste recepción
              </span>
            )}
            {alertData.extremeMode && (
              <span className="px-3 py-1 bg-purple-500 bg-opacity-50 rounded-full text-sm font-medium">
                🎥 Modo Extremo Activado
              </span>
            )}
            {alertData.gpsLatitude && alertData.gpsLongitude && (
              <span className="px-3 py-1 bg-green-500 bg-opacity-50 rounded-full text-sm font-medium">
                📍 Con ubicación GPS
              </span>
            )}
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            {/* Información de la alerta */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
                Detalles de la Emergencia
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Descripción:</label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                    {alertData.description}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Ubicación:</label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg flex items-start">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                    {alertData.location}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Reportada por:</label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                    {alertData.userName} ({alertData.userEmail})
                  </p>
                </div>

                {alertData.expiresAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {alertData.status === 'active' ? 'Expira:' : 'Expiró:'}
                    </label>
                    <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                      {formatDate(alertData.expiresAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Mapa */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                <MapPin className="w-6 h-6 mr-2 text-blue-600" />
                Ubicación
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
                  <>
                    <p className="text-xs text-blue-700 mt-1 font-mono">
                      GPS: {alertData.gpsLatitude.toFixed(6)}, {alertData.gpsLongitude.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${alertData.gpsLatitude},${alertData.gpsLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 underline mt-2 inline-block"
                    >
                      Ver en Google Maps →
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            {/* Estado de Notificaciones */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                <Users className="w-6 h-6 mr-2 text-green-600" />
                Estado de Notificaciones
              </h2>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Confirmaciones</span>
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

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alertData.notifiedUsers?.map((userId, index) => {
                  const hasAck = alertData.acknowledgedBy?.includes(userId);
                  return (
                    <div
                      key={userId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        hasAck ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700">Contacto {index + 1}</span>
                      {hasAck ? (
                        <span className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmó
                        </span>
                      ) : (
                        <span className="text-orange-600 text-sm font-medium">No confirmó</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat de Emergencia (solo lectura) */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
                Historial de Mensajes
                <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Solo lectura
                </span>
              </h2>
              
              {/* Mensajes */}
              <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay mensajes en esta alerta</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg) => {
                      const isOwn = msg.userId === user?.uid;
                      const isAlertEmitter = msg.userId === alertData.userId;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg px-4 py-2 ${
                              isAlertEmitter 
                                ? 'bg-red-100 border-2 border-red-300 text-red-900' 
                                : isOwn 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center mb-1">
                              {isAlertEmitter && <AlertTriangle className="w-4 h-4 mr-1" />}
                              {!isAlertEmitter && !isOwn && <Shield className="w-4 h-4 mr-1 text-blue-600" />}
                              <p className="text-xs font-semibold opacity-75">
                                {isOwn 
                                  ? 'Tú' 
                                  : isAlertEmitter 
                                    ? `${msg.userName} (Solicitó ayuda)` 
                                    : msg.userName
                                }
                              </p>
                            </div>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 opacity-75 ${
                              isAlertEmitter ? 'text-red-700' : isOwn ? 'text-blue-100' : 'text-gray-600'
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

              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-800">
                  ℹ️ Este es un registro histórico. No puedes enviar nuevos mensajes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {alertData.status === 'active' && (
              <>
                <button
                  onClick={() => router.push(`/residentes/panico/activa/${alertId}`)}
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>IR A ALERTA ACTIVA</span>
                </button>
                
                {/* Botones para el emisor de la alerta */}
                {isEmitter && (
                  <>
                    <button
                      onClick={handleResolveAlert}
                      className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>MARCAR COMO RESUELTA</span>
                    </button>
                    
                    <button
                      onClick={handleDeactivateAlert}
                      className="flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-orange-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                      <span>DESACTIVAR ALERTA</span>
                    </button>
                  </>
                )}
              </>
            )}
            
            <button
              onClick={() => router.push('/residentes/panico')}
              className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>VOLVER AL PANEL</span>
            </button>

            <a
              href="tel:911"
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>LLAMAR AL 911</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorialAlertDetailPage;

