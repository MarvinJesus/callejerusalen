'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit as limitQuery, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  Shield, 
  CheckCircle, 
  Settings, 
  Users,
  Bell,
  Save,
  X,
  Check,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SkipBack,
  SkipForward,
  Filter,
  Calendar,
  RefreshCw,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getActiveSecurityPlanUsers,
  SecurityPlanRegistration,
  getPanicButtonSettings,
  savePanicButtonSettings,
  PanicButtonSettings
} from '@/lib/auth';
import { createPanicActivationNotifications } from '@/lib/notifications';

interface PanicReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  location: string;
  description: string;
  timestamp: any;
  status: 'active' | 'resolved' | 'expired';
  emergencyContacts: string[];
  notifiedUsers?: string[];
  acknowledgedBy?: string[]; // Array de userIds que confirmaron "He sido notificado"
  alertDurationMinutes?: number; // Duración configurada de la alerta en minutos
  expiresAt?: any; // Timestamp cuando expira la alerta
  autoResolved?: boolean; // Si fue resuelta automáticamente por expiración
  resolvedAt?: any; // Timestamp cuando fue resuelta la alerta
}

type TabType = 'config' | 'panic' | 'history';

const PanicPage: React.FC = () => {
  const { user, userProfile, securityPlan, loading } = useAuth();
  const { sendPanicAlert, isConnected } = useWebSocket();
  const router = useRouter();
  
  // Estados de la UI
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [panicCountdown, setPanicCountdown] = useState(0);
  
  // Estados de configuración
  const [securityUsers, setSecurityUsers] = useState<SecurityPlanRegistration[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [notifyAll, setNotifyAll] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Estados de botón flotante
  const [floatingButtonEnabled, setFloatingButtonEnabled] = useState(true);
  const [holdTime, setHoldTime] = useState(5);
  const [extremeModeEnabled, setExtremeModeEnabled] = useState(false);
  const [autoRecordVideo, setAutoRecordVideo] = useState(true);
  
  // Estados de geolocalización GPS
  const [shareGPSLocation, setShareGPSLocation] = useState(false);
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [currentGPSCoords, setCurrentGPSCoords] = useState<{lat: number; lng: number} | null>(null);
  
  // Estados de permisos de cámara
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [testingCamera, setTestingCamera] = useState(false);
  
  // Estados de pánico
  const [panicLocation, setPanicLocation] = useState('');
  const [panicDescription, setPanicDescription] = useState('');
  const [recentReports, setRecentReports] = useState<PanicReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [allReports, setAllReports] = useState<PanicReport[]>([]);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estados de filtros
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
    enabled: boolean;
  }>(() => {
    // Filtrar por defecto por el mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      enabled: true // Siempre activo por defecto
    };
  });
  
  // Estado de duración de alerta
  const [alertDurationMinutes, setAlertDurationMinutes] = useState(5); // Default: 5 minutos

  // Verificar inscripción en el Plan de Seguridad
  useEffect(() => {
    console.log('🔍 PanicoPage - Verificando acceso:', {
      user: user?.email,
      userProfile: userProfile?.email,
      securityPlan: securityPlan,
      securityPlanStatus: securityPlan?.status,
      loading: loading
    });

    if (loading) {
      console.log('⏳ PanicoPage - Aún cargando datos...');
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar si el usuario está inscrito Y aprobado en el plan de seguridad
    const isEnrolled = securityPlan !== null;
    const isApproved = securityPlan?.status === 'active';
    const isAdminOrSuperAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

    if (!isAdminOrSuperAdmin) {
      if (!isEnrolled) {
        console.log('❌ Usuario no inscrito en plan de seguridad');
        toast.error('Debes inscribirte en el Plan de Seguridad para acceder a esta función');
        setTimeout(() => {
          router.push('/residentes');
        }, 2000);
        return;
      }

      if (!isApproved) {
        console.log('❌ Usuario inscrito pero no aprobado, status:', securityPlan?.status);
        if (securityPlan?.status === 'pending') {
          toast.error('Tu inscripción está pendiente de aprobación por un administrador');
        } else if (securityPlan?.status === 'rejected') {
          toast.error('Tu inscripción fue rechazada. Contacta al administrador');
        } else {
          toast.error('Debes ser aprobado en el Plan de Seguridad para acceder a esta función');
        }
        setTimeout(() => {
          router.push('/residentes');
        }, 2000);
        return;
      }
    }

    console.log('✅ PanicoPage - Acceso concedido');
  }, [user, userProfile, securityPlan, loading, router]);

  // Cargar usuarios del plan de seguridad y configuración
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        console.log('🔍 PanicoPage - Cargando usuarios del plan de seguridad...');
        // Cargar usuarios del plan de seguridad
        const users = await getActiveSecurityPlanUsers();
        console.log('🔍 PanicoPage - Usuarios cargados:', users.length, users);
        setSecurityUsers(users);

        // Cargar configuración del usuario
        const settings = await getPanicButtonSettings(user.uid);
        if (settings) {
          setSelectedContacts(settings.emergencyContacts);
          setNotifyAll(settings.notifyAll);
          setCustomMessage(settings.customMessage || '');
          setUserLocation(settings.location || '');
          setFloatingButtonEnabled(settings.floatingButtonEnabled !== undefined ? settings.floatingButtonEnabled : true);
          setHoldTime(settings.holdTime || 5);
          setExtremeModeEnabled(settings.extremeModeEnabled || false);
          setAutoRecordVideo(settings.autoRecordVideo !== undefined ? settings.autoRecordVideo : true);
          setShareGPSLocation(settings.shareGPSLocation || false);
          setAlertDurationMinutes(settings.alertDurationMinutes || 5); // Default: 5 minutos
        }

        // Cargar reportes recientes
        await loadRecentReports();
      } catch (error) {
        console.error('❌ PanicoPage - Error al cargar datos:', error);
        console.error('❌ PanicoPage - Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('❌ PanicoPage - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        toast.error('Error al cargar configuración');
      }
    };

    if (!loading && user) {
      loadData();
    }
  }, [user, loading]);

  // Verificar y actualizar estado de permisos GPS cuando se carga la configuración
  useEffect(() => {
    const checkGPSPermissions = async () => {
      if (!shareGPSLocation || !('geolocation' in navigator)) {
        return;
      }

      // Verificar si el navegador soporta Permissions API
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          
          if (result.state === 'granted') {
            console.log('📍 Permisos de ubicación ya otorgados, obteniendo coordenadas...');
            setGpsPermissionStatus('granted');
            
            // Obtener coordenadas actuales
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coords = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                setCurrentGPSCoords(coords);
                console.log('📍 Coordenadas GPS actualizadas:', coords);
              },
              (error) => {
                console.error('Error al obtener coordenadas:', error);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 // Usar caché de hasta 1 minuto
              }
            );
          } else if (result.state === 'denied') {
            setGpsPermissionStatus('denied');
          } else {
            setGpsPermissionStatus('prompt');
          }
        } catch (error) {
          console.log('Permissions API no disponible, intentando obtener ubicación directamente');
          
          // Fallback: intentar obtener ubicación directamente
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setCurrentGPSCoords(coords);
              setGpsPermissionStatus('granted');
              console.log('📍 Coordenadas GPS obtenidas:', coords);
            },
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                setGpsPermissionStatus('denied');
              } else {
                setGpsPermissionStatus('prompt');
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        }
        return;
      }

      // Sin Permissions API, intentar obtener ubicación directamente
      if (typeof window !== 'undefined' && window.navigator && window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentGPSCoords(coords);
            setGpsPermissionStatus('granted');
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setGpsPermissionStatus('denied');
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      }
    };

    checkGPSPermissions();
  }, [shareGPSLocation]);

  // Verificar permisos de cámara cuando se carga la configuración
  useEffect(() => {
    // Si modo extremo está activado, intentar verificar estado de permisos
    // Pero NO solicitarlos automáticamente al cargar la página
    if (extremeModeEnabled && typeof window !== 'undefined') {
      // Solo cambiar a 'prompt' si no hay estado definido
      if (cameraPermissionStatus === 'prompt') {
        // El usuario deberá hacer click en el botón para activar
        console.log('🎥 Modo extremo activado, permisos pendientes de configurar');
      }
    }
  }, [extremeModeEnabled]);

  // Verificar y resolver alertas expiradas periódicamente
  useEffect(() => {
    if (!user) return;

    // Verificar inmediatamente al cargar
    checkAndResolveExpiredAlerts();

    // Verificar cada 30 segundos
    const interval = setInterval(() => {
      checkAndResolveExpiredAlerts();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  // Cargar reportes recientes de pánico (emitidos Y recibidos) - SIN ÍNDICES COMPUESTOS
  const loadRecentReports = async () => {
    try {
      if (!db || !user) {
        console.log('❌ No se puede cargar reportes - falta db o user:', { db: !!db, user: !!user });
        return;
      }

      setLoadingHistory(true);
      console.log('🔍 Cargando reportes para usuario:', user.uid);

      const reportsRef = collection(db, 'panicReports');
      
      // 1. Cargar TODAS las alertas recientes (sin filtros complejos)
      console.log('📋 Consultando todas las alertas recientes...');
      const qAll = query(
        reportsRef, 
        orderBy('timestamp', 'desc'),
        limitQuery(100) // Más registros para filtros y paginación
      );
      
      const allSnapshot = await getDocs(qAll);
      const allReports: PanicReport[] = [];
      
      console.log(`📋 Encontradas ${allSnapshot.docs.length} alertas totales`);
      
      // 2. Filtrar en el cliente para evitar índices compuestos
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        const isEmittedByUser = data.userId === user.uid;
        const isUserNotified = data.notifiedUsers?.includes(user.uid);
        
        // Solo incluir alertas donde el usuario es emisor O fue notificado
        if (isEmittedByUser || isUserNotified) {
          console.log(`📋 Procesando alerta ${isEmittedByUser ? 'emitida' : 'recibida'}:`, doc.id, data.status);
          allReports.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          location: data.location,
          description: data.description,
          timestamp: data.timestamp?.toDate() || new Date(),
          status: data.status,
          emergencyContacts: data.emergencyContacts || [],
          notifiedUsers: data.notifiedUsers || [],
          acknowledgedBy: data.acknowledgedBy || [],
          alertDurationMinutes: data.alertDurationMinutes,
          expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : (data.expiresAt || null),
          autoResolved: data.autoResolved || false
        });
        }
      });

      // 3. Ordenar por timestamp (ya está ordenado por la consulta, pero por seguridad)
      allReports.sort((a, b) => {
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      console.log(`📊 Total final: ${allReports.length} alertas relevantes para el usuario`);
      setAllReports(allReports);
      
      // Aplicar filtros y paginación (esto establecerá totalItems correctamente)
      applyFiltersAndPagination(allReports);
      
      // Mostrar toast si hay alertas
      if (allReports.length > 0) {
        toast.success(`Cargadas ${allReports.length} alertas en el historial`, { duration: 2000 });
      } else {
        toast.success('No se encontraron alertas para este usuario', { duration: 3000 });
      }
    } catch (error) {
      console.error('❌ Error al cargar reportes:', error);
      toast.error('Error al cargar historial de alertas');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Función para auto-resolver alertas expiradas - SIN ÍNDICES COMPUESTOS
  const checkAndResolveExpiredAlerts = async () => {
    try {
      if (!db || !user) return;

      const now = new Date();
      const reportsRef = collection(db, 'panicReports');
      
      // Consulta simple sin índices compuestos
      const q = query(
        reportsRef,
        where('userId', '==', user.uid),
        limitQuery(20)
      );

      const querySnapshot = await getDocs(q);
      let resolvedCount = 0;

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        
        // Solo procesar alertas activas (filtro en cliente)
        if (data.status === 'active') {
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : (data.expiresAt ? new Date(data.expiresAt) : null);

        // Si la alerta ha expirado, actualizarla
        if (expiresAt && now >= expiresAt) {
          await updateDoc(doc(db, 'panicReports', docSnapshot.id), {
            status: 'expired',
            autoResolved: true,
            resolvedAt: serverTimestamp()
          });
          resolvedCount++;
          console.log(`⏱️ Alerta ${docSnapshot.id} expirada y resuelta automáticamente`);
          }
        }
      }

      if (resolvedCount > 0) {
        console.log(`✅ ${resolvedCount} alerta(s) expirada(s) resuelta(s) automáticamente`);
        // Recargar reportes para reflejar los cambios
        await loadRecentReports();
        toast(`${resolvedCount} alerta(s) expirada(s) desactivada(s) automáticamente`, {
          icon: '⏱️',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error al verificar alertas expiradas:', error);
    }
  };

  // Función para resolver/desactivar una alerta activa
  const handleResolveAlert = async (alertId: string, alertTitle: string) => {
    try {
      if (!db || !user) return;

      const alertRef = doc(db, 'panicReports', alertId);
      await updateDoc(alertRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid
      });

      console.log(`✅ Alerta ${alertId} marcada como resuelta por ${user.email}`);
      
      // Recargar el historial para reflejar el cambio
      await loadRecentReports();
      
      toast.success(`Alerta "${alertTitle}" marcada como resuelta`, {
        icon: '✅',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al resolver alerta:', error);
      toast.error('Error al marcar alerta como resuelta');
    }
  };

  // Función para desactivar una alerta activa (marcar como expirada)
  const handleDeactivateAlert = async (alertId: string, alertTitle: string) => {
    try {
      if (!db || !user) return;

      const alertRef = doc(db, 'panicReports', alertId);
      await updateDoc(alertRef, {
        status: 'expired',
        autoResolved: false,
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid
      });

      console.log(`⏹️ Alerta ${alertId} desactivada por ${user.email}`);
      
      // Recargar el historial para reflejar el cambio
      await loadRecentReports();
      
      toast.success(`Alerta "${alertTitle}" desactivada`, {
        icon: '⏹️',
        duration: 3000
      });
    } catch (error) {
      console.error('Error al desactivar alerta:', error);
      toast.error('Error al desactivar alerta');
    }
  };

  // Guardar configuración
  const handleSaveSettings = async () => {
    if (!user) return;

    if (selectedContacts.length === 0 && !notifyAll) {
      toast.error('Debes seleccionar al menos un contacto o activar "Notificar a todos"');
      return;
    }

    setSaving(true);
    try {
      await savePanicButtonSettings(user.uid, {
        emergencyContacts: selectedContacts,
        notifyAll,
        customMessage,
        location: userLocation,
        floatingButtonEnabled,
        holdTime,
        extremeModeEnabled,
        autoRecordVideo,
        shareGPSLocation,
        alertDurationMinutes
      });

      toast.success('Configuración guardada exitosamente');
      
      // Mensaje adicional si se activó el modo extremo
      if (extremeModeEnabled) {
        setTimeout(() => {
          toast('🎥 Modo Extremo activado. La cámara grabará al activar el pánico.', {
            duration: 5000,
            icon: '⚠️',
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  // Toggle selección de contacto
  const toggleContact = (userId: string) => {
    setSelectedContacts(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Solicitar permisos de geolocalización
  const requestGPSPermission = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Tu navegador no soporta geolocalización');
      setGpsPermissionStatus('denied');
      return;
    }

    try {
      toast('Solicitando permisos de ubicación...', { icon: '📍' });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentGPSCoords(coords);
          setGpsPermissionStatus('granted');
          toast.success('✓ Permisos de ubicación otorgados');
          console.log('📍 GPS activado:', coords);
        },
        (error) => {
          console.error('Error al obtener ubicación:', error);
          setGpsPermissionStatus('denied');
          
          let errorMessage = 'No se pudo obtener la ubicación';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permisos de ubicación denegados. Ve a configuración del navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible en este momento';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado al obtener ubicación';
              break;
          }
          toast.error(errorMessage, { duration: 5000 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Error al solicitar permisos GPS:', error);
      setGpsPermissionStatus('denied');
      toast.error('Error al acceder a la ubicación');
    }
  };

  // Obtener ubicación GPS actual en tiempo real
  const getCurrentGPSLocation = (): Promise<{lat: number; lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('📍 Ubicación GPS obtenida:', coords);
          resolve(coords);
        },
        (error) => {
          console.error('Error al obtener ubicación GPS:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  // Solicitar permisos de cámara
  const requestCameraPermission = async () => {
    if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
      toast.error('Tu navegador no soporta acceso a la cámara');
      setCameraPermissionStatus('denied');
      return;
    }

    try {
      setTestingCamera(true);
      console.log('🎥 Solicitando permisos de cámara al navegador...');
      toast('📹 Solicitando permisos de cámara...', { icon: '🎥', duration: 3000 });
      
      // Solicitar acceso a cámara y micrófono
      // Esto SIEMPRE muestra el diálogo si los permisos no están otorgados
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',  // Cámara frontal
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      // Si llegamos aquí, los permisos fueron otorgados
      console.log('✅ Permisos de cámara otorgados exitosamente');
      setCameraPermissionStatus('granted');
      toast.success('✓ Permisos de cámara otorgados correctamente', { duration: 3000 });

      // Detener inmediatamente el stream (solo estamos probando permisos)
      stream.getTracks().forEach(track => {
        console.log(`🛑 Deteniendo track: ${track.kind}`);
        track.stop();
      });
      
      setTestingCamera(false);
    } catch (error: any) {
      console.error('❌ Error al solicitar permisos de cámara:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      setTestingCamera(false);
      
      let errorMessage = 'No se pudo acceder a la cámara';
      let shouldSetDenied = false;
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Permisos de cámara denegados. Puedes cambiarlos en la configuración del navegador.';
        shouldSetDenied = true;
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo';
        shouldSetDenied = true;
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra otras apps y vuelve a intentar.';
        shouldSetDenied = false; // No marcar como denegado permanentemente
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Tu dispositivo no cumple con los requisitos de cámara';
        shouldSetDenied = false;
      } else {
        errorMessage = `Error al acceder a la cámara: ${error.message}`;
        shouldSetDenied = false;
      }
      
      if (shouldSetDenied) {
        setCameraPermissionStatus('denied');
      }
      
      toast.error(errorMessage, { duration: 6000 });
    }
  };

  // Activar botón de pánico
  const handlePanicActivation = async () => {
    if (!user || !userProfile) {
      toast.error('Debes estar autenticado para usar el botón de pánico');
      return;
    }

    try {
      // Determinar contactos a notificar
      const contactsToNotify = notifyAll 
        ? securityUsers.map(u => u.userId)
        : selectedContacts;

      if (contactsToNotify.length === 0) {
        toast.error('Debes configurar al menos un contacto de emergencia');
        setActiveTab('config');
        return;
      }

      let location = panicLocation || userLocation || 'Ubicación no especificada';
      const description = panicDescription || customMessage || 'Emergencia reportada';
      let gpsCoords: {lat: number; lng: number} | null = null;

      // Obtener ubicación GPS si está habilitado
      if (shareGPSLocation) {
        try {
          toast('📍 Obteniendo ubicación GPS...', { duration: 2000 });
          gpsCoords = await getCurrentGPSLocation();
          // Agregar coordenadas a la ubicación textual
          location = `${location} (GPS: ${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)})`;
          console.log('📍 Ubicación GPS incluida en alerta:', gpsCoords);
        } catch (gpsError) {
          console.error('⚠️ No se pudo obtener ubicación GPS:', gpsError);
          toast.error('No se pudo obtener ubicación GPS, continuando sin ella', { duration: 3000 });
        }
      }

      // 1. ENVIAR VÍA WEBSOCKET (TIEMPO REAL)
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
            extremeMode: extremeModeEnabled,
            hasVideo: extremeModeEnabled && autoRecordVideo,
            activatedFrom: 'panic_page',
            ...(gpsCoords && {
              gpsLatitude: gpsCoords.lat,
              gpsLongitude: gpsCoords.lng
            })
          });

          console.log('✅ Alerta WebSocket enviada:', wsResult);
        } catch (wsError) {
          console.error('❌ Error al enviar por WebSocket:', wsError);
          toast.error('Error en notificación en tiempo real');
        }
      } else {
        console.warn('⚠️ WebSocket no conectado, solo se guardará en Firestore');
        toast('Enviando alerta (conexión limitada)...', { icon: '⚠️' });
      }

      // 2. GUARDAR EN FIRESTORE (BACKUP Y PERSISTENCIA)
      console.log('💾 Guardando alerta en Firestore...');
      
      // Calcular tiempo de expiración
      const now = new Date();
      const expiresAt = new Date(now.getTime() + alertDurationMinutes * 60 * 1000);
      
      const panicReport: Omit<PanicReport, 'id'> & {gpsLatitude?: number; gpsLongitude?: number} = {
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
        alertDurationMinutes,
        expiresAt,
        autoResolved: false,
        ...(gpsCoords && {
          gpsLatitude: gpsCoords.lat,
          gpsLongitude: gpsCoords.lng
        })
      };
      
      console.log(`⏱️ Alerta configurada para expirar en ${alertDurationMinutes} minutos (${expiresAt.toLocaleTimeString()})`);

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
          extremeMode: extremeModeEnabled,
          hasVideo: extremeModeEnabled && autoRecordVideo
        });
      } catch (notificationError) {
        console.error('Error al crear notificaciones de pánico:', notificationError);
      }

      setIsPanicActive(true);
      toast.success(
        `¡Alerta de emergencia enviada! ${contactsToNotify.length} personas notificadas. Durará ${alertDurationMinutes} min.`,
        { duration: 3000, icon: '🚨' }
      );
      
      // Actualizar la lista de reportes recientes
      await loadRecentReports();
      
      // Redirigir a la página de emergencia activa
      setTimeout(() => {
        console.log('🔄 Redirigiendo a página de emergencia activa:', docRef.id);
        router.push(`/residentes/panico/activa/${docRef.id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error al enviar reporte de pánico:', error);
      toast.error('Error al enviar la alerta. Inténtalo de nuevo.');
      setIsPanicActive(false);
      setPanicCountdown(0);
    }
  };

  // Countdown del pánico
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPanicActive && panicCountdown > 0) {
      interval = setInterval(() => {
        setPanicCountdown(prev => {
          if (prev <= 1) {
            handlePanicActivation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPanicActive, panicCountdown]);

  // Aplicar paginación cuando cambie itemsPerPage o currentPage
  useEffect(() => {
    if (allReports.length > 0) {
      console.log('🔄 Aplicando paginación por cambio de estado:', { itemsPerPage, currentPage });
      applyFiltersAndPagination(allReports);
    }
  }, [itemsPerPage, currentPage]);

  // Aplicar filtros cuando cambie el filtro de fecha
  useEffect(() => {
    if (allReports.length > 0) {
      console.log('🔄 Aplicando filtros por cambio de fecha:', dateFilter);
      applyFiltersAndPagination(allReports);
    }
  }, [dateFilter]);

  const startPanicSequence = () => {
    if (!user) {
      toast.error('Debes estar autenticado para usar el botón de pánico');
      return;
    }

    if (selectedContacts.length === 0 && !notifyAll) {
      toast.error('Primero configura tus contactos de emergencia en la pestaña de Configuración');
      setActiveTab('config');
      return;
    }

    setIsPanicActive(true);
    setPanicCountdown(5);
    toast('¡Alerta de pánico iniciada! Se activará en 5 segundos...', {
      icon: '⚠️',
      style: {
        background: '#fbbf24',
        color: '#92400e',
      },
    });
  };

  const cancelPanicSequence = () => {
    setIsPanicActive(false);
    setPanicCountdown(0);
    toast('Alerta de pánico cancelada', {
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#ffffff',
      },
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  // Función para analizar la duración de una alerta
  const getDurationAnalysis = (report: PanicReport) => {
    if (!report.resolvedAt) return null;

    const startTime = report.timestamp;
    const endTime = report.resolvedAt.toDate ? report.resolvedAt.toDate() : new Date(report.resolvedAt);
    const configuredDuration = report.alertDurationMinutes || 0;
    
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
      wasResolvedOnTime: difference === 0
    };
  };

  // Función para aplicar filtros y paginación
  const applyFiltersAndPagination = (reports: PanicReport[]) => {
    console.log('🔧 Aplicando filtros y paginación:', {
      reportsLength: reports.length,
      itemsPerPage,
      currentPage,
      dateFilter
    });

    let filteredReports = [...reports];

    // Aplicar filtro de fechas si está habilitado
    if (dateFilter.enabled && (dateFilter.startDate || dateFilter.endDate)) {
      filteredReports = filteredReports.filter(report => {
        const reportDate = report.timestamp;
        const reportDateStr = reportDate.toISOString().split('T')[0]; // YYYY-MM-DD

        if (dateFilter.startDate && reportDateStr < dateFilter.startDate) {
          return false;
        }
        if (dateFilter.endDate && reportDateStr > dateFilter.endDate) {
          return false;
        }
        return true;
      });
    }

    // Calcular paginación
    const totalFiltered = filteredReports.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    
    // Asegurar que currentPage esté dentro del rango válido
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
    
    // Calcular índices para la página actual
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Obtener elementos para la página actual
    const paginatedReports = filteredReports.slice(startIndex, endIndex);
    
    console.log('📊 Resultado de paginación:', {
      totalFiltered,
      validCurrentPage,
      totalPages,
      startIndex,
      endIndex,
      paginatedReportsLength: paginatedReports.length
    });
    
    // Actualizar estados
    setRecentReports(paginatedReports);
    setTotalItems(totalFiltered);
    
    // Si la página actual es mayor que el total de páginas, ajustar
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
    }
    
    console.log(`📊 Filtros aplicados: ${totalFiltered} alertas, página ${validCurrentPage}/${totalPages}, mostrando ${paginatedReports.length} elementos`);
  };

  // Función para cambiar página
  const handlePageChange = (page: number) => {
    console.log('🔄 Cambiando página:', { from: currentPage, to: page });
    setCurrentPage(page);
    // El useEffect se encargará de aplicar la paginación
  };

  // Función para cambiar items por página
  const handleItemsPerPageChange = (items: number) => {
    console.log('🔄 Cambiando items por página:', { from: itemsPerPage, to: items });
    setItemsPerPage(items);
    setCurrentPage(1); // Reset a la primera página
    // El useEffect se encargará de aplicar la paginación
  };

  // Función para aplicar filtros de fecha
  const handleDateFilterChange = (startDate: string, endDate: string, enabled: boolean) => {
    console.log('🔄 Aplicando filtro de fecha:', { startDate, endDate, enabled });
    setDateFilter({ startDate, endDate, enabled });
    setCurrentPage(1); // Reset a la primera página
    // El useEffect se encargará de aplicar la paginación
  };

  const selectedContactsCount = notifyAll ? securityUsers.length : selectedContacts.length;
  const hasContactsConfigured = notifyAll ? securityUsers.length > 0 : selectedContacts.length > 0;
  const latestAlert = allReports.length > 0 ? allReports[0] : null;
  const activeAlertCount = allReports.filter((report) => report.status === 'active').length;
  const resolvedAlertCount = allReports.filter((report) => report.status === 'resolved').length;
  const totalAlerts = allReports.length;
  const lastAlertSummary = latestAlert
    ? formatDate(
        latestAlert.timestamp instanceof Date
          ? latestAlert.timestamp
          : latestAlert.timestamp?.toDate
          ? latestAlert.timestamp.toDate()
          : new Date(latestAlert.timestamp)
      )
    : 'Sin alertas registradas';
  const latestAlertStatusLabel = latestAlert
    ? latestAlert.status === 'resolved'
      ? 'Resuelta'
      : latestAlert.status === 'expired'
      ? 'Expirada'
      : 'Activa'
    : 'Sin registros';
  const isGpsSharing = shareGPSLocation && gpsPermissionStatus === 'granted';
  const gpsStatusLabel = shareGPSLocation
    ? gpsPermissionStatus === 'granted'
      ? 'Compartiendo ubicación'
      : gpsPermissionStatus === 'denied'
      ? 'Permisos denegados'
      : 'Permiso pendiente'
    : 'Inactivo';
  const gpsStatusHelper = shareGPSLocation
    ? gpsPermissionStatus === 'granted'
      ? 'Tu equipo verá tu posición cuando envíes una alerta.'
      : 'Concede permisos de GPS para compartir tu ubicación en emergencias.'
    : 'Activa el GPS para enviar tu ubicación automáticamente.';
  const cameraStatusLabel =
    cameraPermissionStatus === 'granted'
      ? 'Cámara lista'
      : cameraPermissionStatus === 'denied'
      ? 'Permisos denegados'
      : 'Sin configurar';
  const cameraStatusHelper =
    cameraPermissionStatus === 'granted'
      ? 'El modo extremo grabará video automáticamente al activar el pánico.'
      : 'Permite el acceso a la cámara para habilitar el modo extremo.';
  const panicReadyCopy = hasContactsConfigured
    ? 'Listo para responder en segundos.'
    : 'Configura tus contactos para activar el sistema.';

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso al sistema de emergencia...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Restringido
            </h2>
            <p className="text-gray-600">
              Necesitas iniciar sesión para acceder a esta página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (userProfile?.role !== 'comunidad' && userProfile?.role !== 'admin' && userProfile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Restringido
            </h2>
            <p className="text-gray-600">
              Solo los residentes pueden acceder al botón de pánico.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Sistema de Emergencia
            </h1>
            {/* Indicador de conexión WebSocket */}
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            Configura tus contactos de emergencia y accede al botón de pánico
          </p>
          {isConnected && (
            <p className="text-green-600 text-sm mt-1 font-medium">
              ✓ Alertas en tiempo real activadas
            </p>
          )}
          {!isConnected && (
            <p className="text-orange-600 text-sm mt-1 font-medium">
              ⚠️ Las alertas se enviarán cuando se restablezca la conexión
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-5 h-5 inline-block mr-2" />
                Configuración
              </button>
              <button
                onClick={() => setActiveTab('panic')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'panic'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5 inline-block mr-2" />
                Botón de Pánico
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  // Recargar reportes cuando se cambie a historial
                  if (user) {
                    console.log('🔄 Cambiando a pestaña historial, recargando reportes...');
                    loadRecentReports();
                  }
                }}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-5 h-5 inline-block mr-2" />
                Historial
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Configuración Tab */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Users className="w-6 h-6 mr-2 text-blue-600" />
                    Contactos de Emergencia
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Selecciona los miembros del plan de seguridad que serán notificados cuando actives el botón de pánico.
                    Prioriza aquellos que estén más cerca o puedan responder más rápido.
                  </p>

                  {/* Opción de notificar a todos */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyAll}
                        onChange={(e) => setNotifyAll(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Notificar a todos los miembros del plan de seguridad</span>
                        <p className="text-sm text-gray-600">
                          Si activas esta opción, todos los {securityUsers.length} miembros activos serán notificados
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Lista de usuarios del plan de seguridad */}
                  {!notifyAll && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {securityUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No hay usuarios activos en el plan de seguridad</p>
                        </div>
                      ) : (
                        securityUsers.map((secUser) => (
                          <div
                            key={secUser.userId}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedContacts.includes(secUser.userId)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => toggleContact(secUser.userId)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h3 className="font-semibold text-gray-900">
                                    {secUser.userDisplayName}
                                  </h3>
                                  {selectedContacts.includes(secUser.userId) && (
                                    <Check className="w-5 h-5 ml-2 text-blue-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{secUser.userEmail}</p>
                                <div className="flex items-center mt-2 space-x-4 text-sm">
                                  <span className="flex items-center text-gray-500">
                                    <Phone className="w-4 h-4 mr-1" />
                                    {secUser.phoneNumber}
                                  </span>
                                  {secUser.sector && (
                                    <span className="flex items-center text-gray-500">
                                      <MapPin className="w-4 h-4 mr-1" />
                                      Sector: {secUser.sector}
                                    </span>
                                  )}
                                </div>
                                {secUser.skills && secUser.skills.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {secUser.skills.map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Configuración adicional */}
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ubicación por defecto (Opcional)
                      </label>
                      <input
                        type="text"
                        value={userLocation}
                        onChange={(e) => setUserLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
                        placeholder="Ej: Calle Principal #123, Apartamento 2B"
                        style={{ color: '#111827' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensaje personalizado (Opcional)
                      </label>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-500 bg-white"
                        rows={3}
                        placeholder="Mensaje que se enviará junto con la alerta..."
                        style={{ color: '#111827' }}
                      />
                    </div>
                  </div>

                  {/* Configuración del Botón Flotante */}
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🔘 Botón de Pánico Flotante
                    </h3>
                    
                    {/* Activar botón flotante */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={floatingButtonEnabled}
                          onChange={(e) => setFloatingButtonEnabled(e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-900">Activar botón flotante</span>
                          <p className="text-sm text-gray-600">
                            Muestra un botón de pánico flotante en toda la aplicación para acceso rápido
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Tiempo de mantener presionado */}
                    {floatingButtonEnabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tiempo para activar (segundos)
                          </label>
                          <div className="flex items-center space-x-4">
                            <input
                              type="range"
                              min="3"
                              max="10"
                              value={holdTime}
                              onChange={(e) => setHoldTime(Number(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                              {holdTime}s
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Tiempo que debes mantener presionado el botón para activar la alerta
                          </p>
                        </div>

                        {/* Modo Extremo */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="checkbox"
                              checked={extremeModeEnabled}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                console.log('🎥 Modo extremo:', isChecked ? 'ACTIVADO' : 'DESACTIVADO');
                                setExtremeModeEnabled(isChecked);
                                
                                if (isChecked) {
                                  // Siempre intentar solicitar permisos al activar
                                  console.log('🎥 Solicitando permisos de cámara automáticamente...');
                                  // Usar setTimeout para que el checkbox se marque visualmente primero
                                  setTimeout(() => {
                                    requestCameraPermission();
                                  }, 100);
                                }
                              }}
                              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mt-1"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900">Modo Pánico Extremo</span>
                                <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-semibold">
                                  AVANZADO
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                🎥 Activa automáticamente la cámara frontal y graba video al presionar el botón de pánico
                              </p>
                              {extremeModeEnabled && (
                                <div className="mt-3 pt-3 border-t border-purple-200 space-y-3">
                                  {/* Estado de permisos de cámara */}
                                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-gray-700">Estado de la Cámara:</span>
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        cameraPermissionStatus === 'granted' 
                                          ? 'bg-green-100 text-green-800' 
                                          : cameraPermissionStatus === 'denied'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {cameraPermissionStatus === 'granted' 
                                          ? '✓ Cámara Lista' 
                                          : cameraPermissionStatus === 'denied'
                                          ? '✗ Permisos Denegados'
                                          : '⏳ Sin Configurar'}
                                      </span>
                                    </div>
                                    
                                    {cameraPermissionStatus !== 'granted' && (
                                      <button
                                        onClick={requestCameraPermission}
                                        disabled={testingCamera}
                                        className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {testingCamera ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                                            Probando Cámara...
                                          </>
                                        ) : (
                                          '🎥 Activar Permisos de Cámara'
                                        )}
                                      </button>
                                    )}
                                    
                                    {cameraPermissionStatus === 'granted' && (
                                      <div className="flex items-center text-sm text-green-700">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        <span>Cámara configurada y lista para emergencias</span>
                                      </div>
                                    )}
                                    
                                    {cameraPermissionStatus === 'denied' && (
                                      <div className="text-xs text-red-700 bg-red-50 rounded p-2 mt-2">
                                        <strong>⚠️ Permisos bloqueados.</strong> Ve a la configuración de tu navegador para permitir el acceso a la cámara.
                                      </div>
                                    )}
                                  </div>
                                  
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={autoRecordVideo}
                                      onChange={(e) => setAutoRecordVideo(e.target.checked)}
                                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                      Grabar automáticamente (recomendado)
                                    </span>
                                  </label>
                                  
                                  <p className="text-xs text-purple-700 font-medium">
                                    💡 Los permisos se solicitan ahora para evitar demoras durante la emergencia
                                  </p>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>

                        {/* Compartir Ubicación GPS */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="checkbox"
                              checked={shareGPSLocation}
                              onChange={(e) => {
                                setShareGPSLocation(e.target.checked);
                                if (e.target.checked && gpsPermissionStatus !== 'granted') {
                                  // Solicitar permisos automáticamente al activar
                                  requestGPSPermission();
                                }
                              }}
                              className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-1"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900">Compartir Ubicación GPS</span>
                                <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-semibold">
                                  TIEMPO REAL
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                📍 Comparte tu ubicación exacta (latitud y longitud) cuando actives el botón de pánico
                              </p>
                              
                              {shareGPSLocation && (
                                <div className="mt-3 pt-3 border-t border-green-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Estado del GPS:</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      gpsPermissionStatus === 'granted' 
                                        ? 'bg-green-100 text-green-800' 
                                        : gpsPermissionStatus === 'denied'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {gpsPermissionStatus === 'granted' 
                                        ? '✓ Permisos Otorgados' 
                                        : gpsPermissionStatus === 'denied'
                                        ? '✗ Permisos Denegados'
                                        : '⏳ Sin Configurar'}
                                    </span>
                                  </div>
                                  
                                  {gpsPermissionStatus !== 'granted' && (
                                    <button
                                      onClick={requestGPSPermission}
                                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                    >
                                      🗺️ Activar Permisos de Ubicación
                                    </button>
                                  )}
                                  
                                  {gpsPermissionStatus === 'granted' && currentGPSCoords && (
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                      <p className="text-xs text-gray-600 mb-1">Ubicación actual detectada:</p>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-gray-500">Lat:</span>
                                          <span className="ml-1 font-mono text-gray-900">{currentGPSCoords.lat.toFixed(6)}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Lng:</span>
                                          <span className="ml-1 font-mono text-gray-900">{currentGPSCoords.lng.toFixed(6)}</span>
                                        </div>
                                      </div>
                                      <a
                                        href={`https://www.google.com/maps?q=${currentGPSCoords.lat},${currentGPSCoords.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-green-600 hover:text-green-700 underline mt-2 inline-block"
                                      >
                                        Ver en Google Maps →
                                      </a>
                                    </div>
                                  )}
                                  
                                  <p className="text-xs text-green-700 mt-2 font-medium">
                                    ℹ️ Tu ubicación se compartirá SOLO cuando actives el botón de pánico
                                  </p>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>

                        {/* Duración de la Alerta */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <Clock className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="font-medium text-gray-900">Duración de la Señal de Alerta</span>
                                <span className="ml-2 px-2 py-0.5 bg-orange-600 text-white text-xs rounded-full font-semibold">
                                  CONFIGURABLE
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                ⏱️ Tiempo en minutos que la alerta permanecerá activa antes de desactivarse automáticamente
                              </p>
                              
                              <div className="bg-white rounded-lg p-3 border border-orange-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Duración (minutos)
                                </label>
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="range"
                                    min="1"
                                    max="60"
                                    value={alertDurationMinutes}
                                    onChange={(e) => setAlertDurationMinutes(Number(e.target.value))}
                                    className="flex-1"
                                  />
                                  <span className="text-lg font-semibold text-orange-900 w-16 text-center">
                                    {alertDurationMinutes} min
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  La alerta se desactivará automáticamente después de {alertDurationMinutes} minuto{alertDurationMinutes !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Información de uso */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">
                            📖 Cómo usar el botón flotante:
                          </h4>
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Click dos veces rápido en el botón rojo flotante</li>
                            <li>Mantén presionado durante {holdTime} segundo{holdTime !== 1 ? 's' : ''}</li>
                            <li>La alerta se activará automáticamente</li>
                            {extremeModeEnabled && <li className="font-medium">La cámara comenzará a grabar automáticamente</li>}
                            {shareGPSLocation && <li className="font-medium">Tu ubicación GPS se compartirá automáticamente</li>}
                            <li className="font-medium text-orange-700">La alerta permanecerá activa por {alertDurationMinutes} minuto{alertDurationMinutes !== 1 ? 's' : ''}</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botón guardar */}
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Guardar Configuración
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Botón de Pánico Tab */}
            {activeTab === 'panic' && (
              <div className="text-center max-w-2xl mx-auto">
                {!isPanicActive ? (
                  <div>
                    <div className="w-32 h-32 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors">
                      <AlertTriangle className="w-16 h-16 text-white" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      ¿Necesitas ayuda de emergencia?
                    </h2>
                    
                    <p className="text-gray-600 mb-6">
                      Presiona el botón de pánico para alertar inmediatamente a tus contactos de emergencia configurados.
                    </p>

                    {/* Información de contactos */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-700">
                        <Bell className="w-4 h-4 inline mr-2" />
                        {notifyAll 
                          ? `Se notificará a todos los ${securityUsers.length} miembros del plan de seguridad`
                          : `Se notificará a ${selectedContacts.length} contacto${selectedContacts.length !== 1 ? 's' : ''} seleccionado${selectedContacts.length !== 1 ? 's' : ''}`
                        }
                      </p>
                    </div>

                    {/* Formulario opcional */}
                    <div className="max-w-md mx-auto space-y-4 mb-6">
                      <div>
                        <label htmlFor="panicLocation" className="block text-sm font-medium text-gray-700 mb-2">
                          Ubicación específica (Opcional)
                        </label>
                        <input
                          type="text"
                          id="panicLocation"
                          value={panicLocation}
                          onChange={(e) => setPanicLocation(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
                          placeholder={userLocation || "Ej: Calle Principal #123"}
                          style={{ color: '#111827' }}
                        />
                      </div>

                      <div>
                        <label htmlFor="panicDescription" className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción de la emergencia (Opcional)
                        </label>
                        <textarea
                          id="panicDescription"
                          value={panicDescription}
                          onChange={(e) => setPanicDescription(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-500 bg-white"
                          rows={3}
                          style={{ color: '#111827' }}
                          placeholder={customMessage || "Describe brevemente la situación..."}
                        />
                      </div>
                    </div>

                    <button
                      onClick={startPanicSequence}
                      className="w-full max-w-md bg-red-600 text-white py-4 px-8 rounded-lg text-lg font-bold hover:bg-red-700 transition-colors shadow-lg"
                    >
                      ACTIVAR ALERTA DE PÁNICO
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-32 h-32 mx-auto mb-6 bg-red-800 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-4xl font-bold text-white">
                        {panicCountdown}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-red-600 mb-4">
                      ¡ALERTA DE PÁNICO ACTIVADA!
                    </h2>
                    
                    <p className="text-gray-600 mb-6">
                      La alerta se enviará en {panicCountdown} segundo{panicCountdown !== 1 ? 's' : ''}...
                    </p>

                    <button
                      onClick={cancelPanicSequence}
                      className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5 inline mr-2" />
                      CANCELAR ALERTA
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Historial Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-green-600" />
                  Historial de Alertas
                </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={loadRecentReports}
                      disabled={loadingHistory}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {loadingHistory ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Cargando...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Recargar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Panel de Control y Filtros */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-blue-600" />
                      Panel de Control
                    </h3>
                    <p className="text-sm text-gray-600">
                      Configura cómo visualizar tu historial de alertas. Los filtros te ayudan a encontrar alertas específicas y la paginación optimiza la carga.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Filtro por Fechas */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Filtro por Fechas</h4>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>Activo</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-blue-700 mb-3">
                        📅 Por defecto muestra alertas del mes actual. Ajusta las fechas para ver períodos específicos.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-blue-800 mb-2 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Fecha inicio
                          </label>
                          <input
                            type="date"
                            value={dateFilter.startDate}
                            onChange={(e) => {
                              handleDateFilterChange(e.target.value, dateFilter.endDate, true);
                              toast.success('Filtro de fecha actualizado', { duration: 1500 });
                            }}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-800 mb-2 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Fecha fin
                          </label>
                          <input
                            type="date"
                            value={dateFilter.endDate}
                            onChange={(e) => {
                              handleDateFilterChange(dateFilter.startDate, e.target.value, true);
                              toast.success('Filtro de fecha actualizado', { duration: 1500 });
                            }}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Configuración de Paginación */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-green-900">Configuración de Visualización</h4>
                      </div>
                      
                      <p className="text-xs text-green-700 mb-3">
                        📊 Controla cuántas alertas ver por página. Menos elementos = carga más rápida.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-medium text-green-800">Mostrar:</label>
                          <div className="relative">
                            <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                handleItemsPerPageChange(newValue);
                                toast.success(`Mostrando ${newValue} alertas por página`, {
                                  duration: 2000,
                                  icon: '📊'
                                });
                              }}
                              className="appearance-none px-4 py-2 pr-8 border border-green-300 rounded-lg text-sm text-gray-900 bg-white hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors cursor-pointer shadow-sm"
                            >
                              <option value={5}>5 alertas</option>
                              <option value={10}>10 alertas</option>
                              <option value={20}>20 alertas</option>
                              <option value={50}>50 alertas</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {/* Estado de Paginación */}
                        <div className="bg-white border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-green-800">Estado actual</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-700">
                                <span className="font-bold text-green-700">{recentReports.length}</span> de <span className="font-bold text-gray-900">{totalItems}</span> alertas
                              </div>
                              <div className="text-xs text-gray-500">
                                Página {currentPage} de {Math.ceil(totalItems / itemsPerPage)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-gray-600">
                        <strong>💡 Tip:</strong> Los filtros se aplican automáticamente. Si no ves alertas, intenta ampliar el rango de fechas o verificar que tienes alertas en ese período.
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Aquí puedes ver todas tus alertas de pánico emitidas y las alertas en las que fuiste notificado.
                  Haz clic en cualquier alerta para ver el detalle completo.
                </p>
                
                
                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando historial de alertas...</p>
                  </div>
                ) : recentReports.length > 0 ? (
                  <div className="space-y-4">
                    {recentReports.map(report => {
                      const isEmitter = report.userId === user?.uid;
                      const wasNotified = report.notifiedUsers?.includes(user?.uid || '');
                      
                      return (
                        <div 
                          key={report.id} 
                          onClick={() => router.push(`/residentes/panico/historial/${report.id}`)}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer bg-white"
                        >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                              <Shield className={`w-5 h-5 ${isEmitter ? 'text-red-600' : 'text-blue-600'}`} />
                              <div>
                            <h4 className="font-medium text-gray-900">
                                  {isEmitter ? 'Alerta Emitida por Ti' : `Alerta de ${report.userName}`}
                            </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {isEmitter && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                      📤 Emitida
                                    </span>
                                  )}
                                  {wasNotified && !isEmitter && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                      📥 Recibida
                                    </span>
                                  )}
                            {report.status === 'resolved' && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {report.status === 'expired' && (
                              <Clock className="w-4 h-4 text-orange-600" />
                            )}
                                  {report.status === 'active' && (
                                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium animate-pulse">
                                      🚨 ACTIVA
                                    </span>
                            )}
                                </div>
                              </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(report.timestamp)}
                          </span>
                        </div>
                        
                          <p className="text-gray-700 mb-2 line-clamp-2">
                          {report.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                              <span className="line-clamp-1">{report.location}</span>
                          </div>
                        </div>

                        {/* Información de duración */}
                        {report.alertDurationMinutes && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span>
                                Duración: {report.alertDurationMinutes} min
                            </span>
                            {report.expiresAt && (
                              <span className="text-xs text-gray-500">
                                • {report.status === 'active' ? 'Expira' : 'Expiró'}: {new Date(report.expiresAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Información de confirmaciones */}
                        {report.acknowledgedBy && report.acknowledgedBy.length > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-green-600 mb-2">
                            <Check className="w-4 h-4" />
                            <span>
                                {report.acknowledgedBy.length} de {report.notifiedUsers?.length || 0} confirmaron
                            </span>
                          </div>
                        )}

                          <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">
                                {report.notifiedUsers?.length || 0} notificada{report.notifiedUsers?.length !== 1 ? 's' : ''}
                          </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === 'resolved' 
                              ? 'bg-green-100 text-green-800' 
                              : report.status === 'expired'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {report.status === 'resolved' 
                                  ? '✓ Resuelto' 
                              : report.status === 'expired'
                                  ? (report.autoResolved ? '⏱️ Expirada' : '⏰ Expirada')
                                  : '🚨 Activo'}
                          </span>
                              
                              {/* Indicador de duración para alertas resueltas */}
                              {report.status === 'resolved' && (() => {
                                const analysis = getDurationAnalysis(report);
                                if (!analysis) return null;
                                
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    analysis.wasResolvedEarly 
                                      ? 'bg-green-200 text-green-900' 
                                      : analysis.wasResolvedLate
                                      ? 'bg-orange-200 text-orange-900'
                                      : 'bg-blue-200 text-blue-900'
                                  }`}>
                                    {analysis.wasResolvedEarly 
                                      ? `⚡ ${Math.abs(analysis.difference)}m antes` 
                                      : analysis.wasResolvedLate
                                      ? `⏰ ${Math.abs(analysis.difference)}m después`
                                      : '🎯 Exacto'}
                                  </span>
                                );
                              })()}
                              
                              {/* Botones de acción para alertas activas */}
                              {report.status === 'active' && isEmitter && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResolveAlert(report.id, `Alerta de ${report.userName}`);
                                    }}
                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                    title="Marcar como resuelta"
                                  >
                                    ✓ Resolver
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeactivateAlert(report.id, `Alerta de ${report.userName}`);
                                    }}
                                    className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                                    title="Desactivar alerta"
                                  >
                                    ⏹️ Desactivar
                                  </button>
                        </div>
                              )}
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/residentes/panico/historial/${report.id}`);
                                }}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                              >
                                Ver detalle →
                              </button>
                      </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No hay alertas registradas</p>
                    <p className="text-sm mt-2">Tus alertas de emergencia aparecerán aquí</p>
                  </div>
                )}

                {/* Controles de Paginación */}
                {recentReports.length > 0 && (
                  <div className="mt-6 flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">
                        Página {currentPage} de {Math.ceil(totalItems / itemsPerPage)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({totalItems} alertas totales)
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Botón Primera Página */}
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Primera página"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      {/* Botón Página Anterior */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Números de Página */}
                      <div className="flex items-center space-x-1">
                        {(() => {
                          const totalPages = Math.ceil(totalItems / itemsPerPage);
                          const pages = [];
                          
                          // Mostrar páginas alrededor de la página actual
                          const startPage = Math.max(1, currentPage - 2);
                          const endPage = Math.min(totalPages, currentPage + 2);
                          
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                  i === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }
                          
                          return pages;
                        })()}
                      </div>

                      {/* Botón Página Siguiente */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                        className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Botón Última Página */}
                      <button
                        onClick={() => handlePageChange(Math.ceil(totalItems / itemsPerPage))}
                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                        className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Última página"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contacts Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-red-600" />
            Números de Emergencia Nacional
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Policía', number: '911', description: 'Emergencias generales' },
              { name: 'Bomberos', number: '911', description: 'Incendios y rescates' },
              { name: 'Ambulancia', number: '911', description: 'Emergencias médicas' },
              { name: 'Cruz Roja', number: '911', description: 'Asistencia médica' },
            ].map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
                <div>
                  <h4 className="font-medium text-gray-900">{contact.name}</h4>
                  <p className="text-sm text-gray-600">{contact.description}</p>
                </div>
                <a
                  href={`tel:${contact.number}`}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Llamar
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-900">
                Aviso Importante
              </h3>
              <p className="text-sm text-red-800 mt-1">
                El botón de pánico debe usarse únicamente en situaciones de emergencia real. 
                El uso indebido puede resultar en sanciones. 
                En caso de emergencia médica grave, llama inmediatamente al 911.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanicPage;
