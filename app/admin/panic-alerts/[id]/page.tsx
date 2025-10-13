'use client';

/**
 * Página de Detalle de Alerta de Pánico para Investigación Judicial
 * Información completa, forense y generación de reportes oficiales
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Video,
  Bell,
  Mail,
  Calendar,
  Edit,
  Save,
  X,
  MessageSquare,
  UserCheck,
  Activity,
  Map as MapIcon,
  Download,
  FileText,
  Camera,
  Shield,
  Eye,
  Navigation,
  Timer,
  Info,
  AlertCircle,
  Hash,
  Fingerprint,
  Database,
  Globe,
  Zap,
  Target,
  TrendingUp,
  FileCheck,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PanicAlert {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  location: string;
  gpsCoordinates?: { latitude: number; longitude: number };
  description: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'expired';
  notifiedUsers: string[];
  emergencyContacts: string[];
  acknowledgedBy?: string[];
  activatedFrom?: string;
  extremeMode?: boolean;
  hasVideo?: boolean;
  videoUrl?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  adminNotes?: string;
  alertDurationMinutes?: number;
  expiresAt?: Date;
  autoResolved?: boolean;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    language?: string;
    screenResolution?: string;
  };
  ipAddress?: string;
}

interface NotifiedUser {
  userId: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system' | 'emergency';
}

interface TimelineEvent {
  id: string;
  type: 'created' | 'acknowledged' | 'message' | 'resolved' | 'expired' | 'updated';
  description: string;
  timestamp: Date;
  actor?: string;
}

const PanicAlertDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  const alertId = params.id as string;
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [alert, setAlert] = useState<PanicAlert | null>(null);
  const [notifiedUsers, setNotifiedUsers] = useState<NotifiedUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (alertId) {
      loadAlertDetail();
    }
  }, [alertId]);

  const loadAlertDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando detalle completo de alerta:', alertId);
      
      // Cargar alerta
      const alertRef = doc(db, 'panicReports', alertId);
      const alertSnap = await getDoc(alertRef);
      
      if (!alertSnap.exists()) {
        toast.error('Alerta no encontrada');
        router.push('/admin/panic-alerts');
        return;
      }
      
      const data = alertSnap.data();
      // Normalizar coordenadas: soportar esquemas antiguos (gpsLatitude/gpsLongitude)
      const normalizedGps = data.gpsCoordinates
        ? data.gpsCoordinates
        : (typeof data.gpsLatitude === 'number' && typeof data.gpsLongitude === 'number'
          ? { latitude: data.gpsLatitude, longitude: data.gpsLongitude }
          : undefined);

      const loadedAlert: PanicAlert = {
        id: alertSnap.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        location: data.location,
        gpsCoordinates: normalizedGps,
        description: data.description,
        timestamp: data.timestamp?.toDate() || new Date(),
        status: data.status || 'active',
        notifiedUsers: data.notifiedUsers || [],
        emergencyContacts: data.emergencyContacts || [],
        acknowledgedBy: data.acknowledgedBy || [],
        activatedFrom: data.activatedFrom,
        extremeMode: data.extremeMode,
        hasVideo: data.hasVideo,
        videoUrl: data.videoUrl,
        resolvedAt: data.resolvedAt?.toDate(),
        resolvedBy: data.resolvedBy,
        adminNotes: data.adminNotes,
        alertDurationMinutes: data.alertDurationMinutes,
        expiresAt: data.expiresAt?.toDate(),
        autoResolved: data.autoResolved,
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress
      };
      
      console.log('📊 Alerta cargada:', loadedAlert);
      setAlert(loadedAlert);
      setAdminNotes(loadedAlert.adminNotes || '');
      
      // Cargar información paralela
      await Promise.all([
        loadNotifiedUsersInfo(loadedAlert.notifiedUsers),
        loadChatMessages(),
        buildTimeline(loadedAlert)
      ]);
      
    } catch (error) {
      console.error('❌ Error al cargar alerta:', error);
      toast.error('Error al cargar detalle de la alerta');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async () => {
    try {
      console.log('💬 Cargando mensajes de chat (panicChats) ...');
      // 1) Intentar leer desde colección global panicChats filtrando por alertId
      const chatsRef = collection(db, 'panicChats');
      const chatsQuery = query(chatsRef, where('alertId', '==', alertId));
      const chatsSnap = await getDocs(chatsQuery);

      let messages: ChatMessage[] = [];

      if (!chatsSnap.empty) {
        chatsSnap.forEach((doc) => {
          const data = doc.data() as any;
          const ts = data.timestamp;
          const date: Date = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(0));
          messages.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            message: data.message,
            timestamp: date,
            type: data.type || 'message'
          });
        });
      } else {
        // 2) Fallback: subcolección legacy panicReports/{id}/messages
        console.log('ℹ️ No hay mensajes en panicChats, intentando subcolección legacy...');
        const legacyRef = collection(db, 'panicReports', alertId, 'messages');
        const legacySnap = await getDocs(legacyRef);
        legacySnap.forEach((doc) => {
          const data = doc.data() as any;
          const ts = data.timestamp;
          const date: Date = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(0));
          messages.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            message: data.message,
            timestamp: date,
            type: data.type || 'message'
          });
        });
      }

      // Ordenar en cliente por timestamp asc para evitar requerir índices
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      console.log(`💬 Cargados ${messages.length} mensajes`);
      setChatMessages(messages);
    } catch (error) {
      console.error('❌ Error al cargar mensajes:', error);
    }
  };

  const buildTimeline = async (alertData: PanicAlert) => {
    try {
      console.log('📅 Construyendo timeline...');
      const events: TimelineEvent[] = [];
      
      // Evento de creación
      events.push({
        id: '1',
        type: 'created',
        description: 'Alerta de pánico activada',
        timestamp: alertData.timestamp,
        actor: alertData.userName
      });
      
      // Eventos de reconocimiento
      if (alertData.acknowledgedBy && alertData.acknowledgedBy.length > 0) {
        alertData.acknowledgedBy.forEach((userId, index) => {
          events.push({
            id: `ack-${index}`,
            type: 'acknowledged',
            description: `Alerta reconocida por usuario`,
            timestamp: alertData.timestamp, // Idealmente debería venir de Firestore
            actor: userId
          });
        });
      }
      
      // Evento de resolución
      if (alertData.resolvedAt) {
        events.push({
          id: 'resolved',
          type: alertData.autoResolved ? 'expired' : 'resolved',
          description: alertData.autoResolved ? 'Alerta expirada automáticamente' : 'Alerta marcada como resuelta',
          timestamp: alertData.resolvedAt,
          actor: alertData.resolvedBy || 'Sistema'
        });
      }
      
      // Ordenar por fecha
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      console.log(`📅 Timeline construido con ${events.length} eventos`);
      setTimelineEvents(events);
    } catch (error) {
      console.error('❌ Error al construir timeline:', error);
    }
  };

  const loadNotifiedUsersInfo = async (userIds: string[]) => {
    try {
      const usersInfo: NotifiedUser[] = [];
      
      for (const userId of userIds) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          usersInfo.push({
            userId,
            displayName: userData.displayName || 'Usuario',
            email: userData.email || '',
            phoneNumber: userData.phoneNumber
          });
        } else {
          // Intentar buscar en securityRegistrations
          const secRegRef = doc(db, 'securityRegistrations', userId);
          const secRegSnap = await getDoc(secRegRef);
          
          if (secRegSnap.exists()) {
            const secRegData = secRegSnap.data();
            usersInfo.push({
              userId,
              displayName: secRegData.userDisplayName || 'Usuario',
              email: secRegData.userEmail || '',
              phoneNumber: secRegData.phoneNumber
            });
          }
        }
      }
      
      setNotifiedUsers(usersInfo);
    } catch (error) {
      console.error('Error al cargar usuarios notificados:', error);
    }
  };

  const handleResolveAlert = async () => {
    if (!alert || !userProfile) return;
    
    if (!confirm('¿Estás seguro de marcar esta alerta como resuelta?')) {
      return;
    }
    
    try {
      setSaving(true);
      const alertRef = doc(db, 'panicReports', alertId);
      
      await updateDoc(alertRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: userProfile.uid
      });
      
      toast.success('Alerta marcada como resuelta');
      loadAlertDetail();
    } catch (error) {
      console.error('Error al resolver alerta:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!alert) return;
    
    try {
      setSaving(true);
      const alertRef = doc(db, 'panicReports', alertId);
      
      await updateDoc(alertRef, {
        adminNotes
      });
      
      toast.success('Notas guardadas exitosamente');
      setEditingNotes(false);
      loadAlertDetail();
    } catch (error) {
      console.error('Error al guardar notas:', error);
      toast.error('Error al guardar las notas');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'long'
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    
    if (diffInMinutes < 1) return 'Menos de 1 minuto';
    if (diffInMinutes < 60) return `${diffInMinutes} minutos`;
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const formatTimeOnly = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const generateJudicialReport = async () => {
    if (!alert) return;
    
    try {
      setGeneratingPDF(true);
      toast.loading('Generando reporte judicial...', { id: 'pdf-loading' });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      
      // Encabezado oficial
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE OFICIAL DE ALERTA DE PÁNICO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema de Emergencias Comunitarias - Calle Jerusalén', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Información de autenticidad
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`ID de Reporte: ${alert.id}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Fecha de Generación: ${formatDate(new Date())}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Generado por: ${userProfile?.displayName || userProfile?.email || 'Administrador'}`, margin, yPosition);
      yPosition += 15;
      
      // Línea divisoria
      pdf.setDrawColor(200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Sección 1: Datos del Incidente
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('1. DATOS DEL INCIDENTE', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const addField = (label: string, value: string, bold = false) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${label}:`, margin, yPosition);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        const labelWidth = pdf.getTextWidth(`${label}: `);
        pdf.text(value, margin + labelWidth, yPosition);
        yPosition += 7;
      };
      
      addField('Estado de Alerta', alert.status === 'active' ? 'ACTIVA' : alert.status === 'resolved' ? 'RESUELTA' : 'EXPIRADA', true);
      addField('Fecha y Hora de Activación', formatDate(alert.timestamp));
      addField('Ubicación', alert.location);
      
      if (alert.gpsCoordinates) {
        addField('Coordenadas GPS', `Lat: ${alert.gpsCoordinates.latitude.toFixed(6)}, Lng: ${alert.gpsCoordinates.longitude.toFixed(6)}`);
      }
      
      if (alert.description) {
        yPosition += 3;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Descripción del Incidente:', margin, yPosition);
        yPosition += 7;
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(alert.description, pageWidth - 2 * margin);
        pdf.text(descLines, margin, yPosition);
        yPosition += descLines.length * 7;
      }
      
      yPosition += 5;
      
      // Sección 2: Datos del Solicitante
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. DATOS DEL SOLICITANTE', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      addField('Nombre Completo', alert.userName);
      addField('Correo Electrónico', alert.userEmail);
      addField('ID de Usuario', alert.userId);
      yPosition += 5;
      
      // Sección 3: Información Técnica y Forense
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. INFORMACIÓN TÉCNICA Y FORENSE', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      addField('Método de Activación', alert.activatedFrom === 'floating_button' ? 'Botón Flotante' : 'Página Web');
      addField('Modo Extremo', alert.extremeMode ? 'SÍ - ACTIVADO' : 'NO');
      addField('Video de Evidencia', alert.hasVideo ? 'SÍ - DISPONIBLE' : 'NO');
      
      if (alert.deviceInfo) {
        addField('Plataforma', alert.deviceInfo.platform || 'No disponible');
        if (alert.deviceInfo.userAgent) {
          yPosition += 3;
          pdf.setFont('helvetica', 'bold');
          pdf.text('Navegador:', margin, yPosition);
          yPosition += 7;
          pdf.setFont('helvetica', 'normal');
          const uaLines = pdf.splitTextToSize(alert.deviceInfo.userAgent, pageWidth - 2 * margin);
          pdf.text(uaLines, margin, yPosition);
          yPosition += uaLines.length * 7;
        }
      }
      
      if (alert.ipAddress) {
        addField('Dirección IP', alert.ipAddress);
      }
      
      yPosition += 5;
      
      // Sección 4: Tiempo y Duración
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('4. ANÁLISIS TEMPORAL', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      addField('Hora de Activación', formatTimeOnly(alert.timestamp));
      
      if (alert.resolvedAt) {
        addField('Hora de Resolución', formatTimeOnly(alert.resolvedAt));
        addField('Duración Total', formatDuration(alert.timestamp, alert.resolvedAt), true);
      }
      
      if (alert.alertDurationMinutes) {
        addField('Duración Configurada', `${alert.alertDurationMinutes} minutos`);
      }
      
      yPosition += 5;
      
      // Sección 5: Usuarios Notificados
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('5. USUARIOS NOTIFICADOS Y RESPUESTA', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(11);
      addField('Total Notificados', notifiedUsers.length.toString());
      addField('Total Reconocieron', (alert.acknowledgedBy?.length || 0).toString());
      
      if (notifiedUsers.length > 0) {
        yPosition += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Lista de Usuarios Notificados:', margin, yPosition);
        yPosition += 7;
        
        notifiedUsers.forEach((user, index) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${index + 1}. ${user.displayName} (${user.email})`, margin + 5, yPosition);
          yPosition += 6;
        });
      }
      
      yPosition += 5;
      
      // Sección 6: Mensajes de Chat
      if (chatMessages.length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('6. REGISTRO DE COMUNICACIONES', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        chatMessages.forEach((msg, index) => {
          if (yPosition > pageHeight - 25) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`[${formatTimeOnly(msg.timestamp)}] ${msg.userName}:`, margin, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');
          const msgLines = pdf.splitTextToSize(msg.message, pageWidth - 2 * margin - 5);
          pdf.text(msgLines, margin + 5, yPosition);
          yPosition += msgLines.length * 6 + 2;
        });
        
        yPosition += 5;
      }
      
      // Sección 7: Resolución
      if (alert.status === 'resolved' || alert.status === 'expired') {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('7. RESOLUCIÓN DEL INCIDENTE', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(11);
        addField('Fecha de Resolución', alert.resolvedAt ? formatDate(alert.resolvedAt) : 'N/A');
        addField('Resuelto Por', alert.resolvedBy || 'Sistema Automático');
        addField('Tipo de Resolución', alert.autoResolved ? 'Expiración Automática' : 'Resolución Manual');
      }
      
      // Notas administrativas
      if (alert.adminNotes) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }
        
        yPosition += 5;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('8. NOTAS ADMINISTRATIVAS', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const notesLines = pdf.splitTextToSize(alert.adminNotes, pageWidth - 2 * margin);
        pdf.text(notesLines, margin, yPosition);
        yPosition += notesLines.length * 7;
      }
      
      // Anexo: Mensajes del chat
      if (chatMessages.length > 0) {
        pdf.addPage();
        yPosition = margin;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ANEXO A: MENSAJES DE CHAT DE LA EMERGENCIA', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 12;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total de mensajes: ${chatMessages.length}`, margin, yPosition);
        yPosition += 8;

        chatMessages.forEach((msg, index) => {
          if (yPosition > pageHeight - 25) {
            pdf.addPage();
            yPosition = margin;
          }

          const isRequester = msg.userId === alert.userId;
          const prefix = isRequester ? '[SOLICITANTE]' : msg.type === 'system' ? '[SISTEMA]' : msg.type === 'emergency' ? '[EMERGENCIA]' : '';

          pdf.setFont('helvetica', 'bold');
          pdf.text(`${prefix} [${formatTimeOnly(msg.timestamp)}] ${msg.userName}:`, margin, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');
          const msgLines = pdf.splitTextToSize(msg.message || '', pageWidth - 2 * margin - 5);
          pdf.text(msgLines, margin + 5, yPosition);
          yPosition += msgLines.length * 6 + 2;
        });
      }

      // Pie de página
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('DOCUMENTO CONFIDENCIAL - USO OFICIAL', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
      
      // Guardar PDF
      pdf.save(`Reporte_Judicial_Alerta_${alert.id}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('Reporte judicial generado exitosamente', { id: 'pdf-loading' });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar reporte judicial', { id: 'pdf-loading' });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando detalle de la alerta...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!alert) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Alerta no encontrada</h3>
              <button
                onClick={() => router.push('/admin/panic-alerts')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Volver a la lista
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Mejorado */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin/panic-alerts')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Volver a la lista de alertas</span>
            </button>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Reporte de Alerta de Pánico</h1>
                      <p className="text-sm text-gray-600 mt-1">Información Forense y de Investigación</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-4">
                    <span className={`px-4 py-2 text-sm font-bold rounded-lg ${
                      alert.status === 'active' 
                        ? 'bg-red-100 text-red-800 border border-red-300' 
                        : alert.status === 'resolved'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}>
                      {alert.status === 'active' ? '🚨 ALERTA ACTIVA' : 
                       alert.status === 'resolved' ? '✅ ALERTA RESUELTA' : 
                       '⏰ ALERTA EXPIRADA'}
                    </span>
                    {alert.extremeMode && (
                      <span className="px-4 py-2 text-sm font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-300 flex items-center space-x-2">
                        <Video className="w-4 h-4" />
                        <span>MODO EXTREMO ACTIVO</span>
                      </span>
                    )}
                    {alert.hasVideo && (
                      <span className="px-4 py-2 text-sm font-bold rounded-lg bg-blue-100 text-blue-800 border border-blue-300 flex items-center space-x-2">
                        <Camera className="w-4 h-4" />
                        <span>VIDEO DISPONIBLE</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3 ml-6">
                  <button
                    onClick={generateJudicialReport}
                    disabled={generatingPDF}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 shadow-md"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Generar Reporte Judicial</span>
                  </button>
                  
                  {alert.status === 'active' && (
                    <button
                      onClick={handleResolveAlert}
                      disabled={saving}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 shadow-md"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Marcar como Resuelta</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Información rápida */}
              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Activada hace</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const diffMs = new Date().getTime() - alert.timestamp.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        if (diffMins < 60) return `${diffMins} min`;
                        const hours = Math.floor(diffMins / 60);
                        return `${hours}h ${diffMins % 60}m`;
                      })()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Usuarios notificados</p>
                    <p className="text-sm font-semibold text-gray-900">{alert.notifiedUsers.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Mensajes</p>
                    <p className="text-sm font-semibold text-gray-900">{chatMessages.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-600">Reconocimientos</p>
                    <p className="text-sm font-semibold text-gray-900">{alert.acknowledgedBy?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información del solicitante */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Información del Solicitante
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="text-base font-medium text-gray-900">{alert.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-base font-medium text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {alert.userEmail}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">ID de Usuario</p>
                    <p className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">{alert.userId}</p>
                  </div>
                </div>
              </div>

              {/* Detalles de la emergencia */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  Detalles de la Emergencia
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-6 h-6 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">Ubicación</p>
                        <p className="text-lg text-gray-900">{alert.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  {alert.description && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="w-6 h-6 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                          <p className="text-base text-gray-900">{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Fecha y Hora</p>
                      </div>
                      <p className="text-sm text-gray-900">{formatDate(alert.timestamp)}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-5 h-5 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Activado desde</p>
                      </div>
                      <p className="text-sm text-gray-900">
                        {alert.activatedFrom === 'floating_button' ? '📱 Botón Flotante' : '💻 Página de Pánico'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análisis Temporal Completo */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Timer className="w-5 h-5 mr-2 text-orange-600" />
                  Análisis Temporal Completo
                </h2>
                
                <div className="space-y-4">
                  {/* Tiempo de activación y resolución */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700 mb-1">Hora de Activación</p>
                      <p className="text-2xl font-bold text-blue-900">{formatTimeOnly(alert.timestamp)}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDate(alert.timestamp)}</p>
                    </div>
                    
                    {alert.resolvedAt && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-700 mb-1">Hora de Resolución</p>
                        <p className="text-2xl font-bold text-green-900">{formatTimeOnly(alert.resolvedAt)}</p>
                        <p className="text-xs text-gray-600 mt-1">{formatDate(alert.resolvedAt)}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Duración */}
                  {alert.resolvedAt && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-purple-900">Duración Total</p>
                        {alert.alertDurationMinutes && (
                          <span className="text-xs text-purple-700">
                            Configurado: {alert.alertDurationMinutes} min
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {formatDuration(alert.timestamp, alert.resolvedAt)}
                      </p>
                      
                      {alert.alertDurationMinutes && (() => {
                        const actualMinutes = Math.floor((alert.resolvedAt!.getTime() - alert.timestamp.getTime()) / 60000);
                        const difference = actualMinutes - alert.alertDurationMinutes;
                        
                        return (
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            {difference < 0 ? (
                              <div className="flex items-center space-x-2 text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Resuelta {Math.abs(difference)} min antes de tiempo ⚡</span>
                              </div>
                            ) : difference > 0 ? (
                              <div className="flex items-center space-x-2 text-orange-700">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Duró {difference} min más de lo configurado ⏰</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-blue-700">
                                <Target className="w-4 h-4" />
                                <span className="text-sm font-medium">Duración exacta según configuración 🎯</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  {/* Tiempo restante para alertas activas */}
                  {alert.status === 'active' && alert.alertDurationMinutes && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200 animate-pulse">
                      <p className="text-sm font-medium text-red-900 mb-2">⚠️ Tiempo Restante</p>
                      <p className="text-3xl font-bold text-red-900">
                        {(() => {
                          const now = new Date();
                          const elapsed = Math.floor((now.getTime() - alert.timestamp.getTime()) / 60000);
                          const remaining = Math.max(0, alert.alertDurationMinutes - elapsed);
                          return `${remaining} minutos`;
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mapa GPS Mejorado */}
              {alert.gpsCoordinates && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                    Ubicación GPS Exacta
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Coordenadas */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Latitud</p>
                        <p className="text-lg font-mono text-blue-900">{alert.gpsCoordinates.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Longitud</p>
                        <p className="text-lg font-mono text-blue-900">{alert.gpsCoordinates.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                    
                    {/* Mapa Interactivo */}
                    <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-300 shadow-inner bg-gray-100">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${alert.gpsCoordinates.latitude},${alert.gpsCoordinates.longitude}&hl=es&z=17&output=embed`}
                        allowFullScreen
                        title="Mapa de ubicación de la emergencia"
                      />
                    </div>
                    
                    {/* Enlaces rápidos */}
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${alert.gpsCoordinates.latitude},${alert.gpsCoordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                      >
                        <MapIcon className="w-5 h-5" />
                        <span>Abrir en Google Maps</span>
                      </a>
                      <a
                        href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${alert.gpsCoordinates.latitude},${alert.gpsCoordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                      >
                        <Eye className="w-5 h-5" />
                        <span>Ver Street View</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Forense y de Auditoría */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2 text-purple-600" />
                  Información Forense
                </h2>
                
                <div className="space-y-4">
                  {/* ID de Alerta */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="w-4 h-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-700">ID de Alerta</p>
                    </div>
                    <p className="font-mono text-xs text-gray-900 bg-white px-2 py-1 rounded border break-all">{alert.id}</p>
                  </div>
                  
                  {/* Información del Dispositivo */}
                  {alert.deviceInfo && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <Database className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900">Información del Dispositivo</p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {alert.deviceInfo.platform && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Plataforma:</span>
                            <span className="font-medium text-gray-900">{alert.deviceInfo.platform}</span>
                          </div>
                        )}
                        {alert.deviceInfo.language && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Idioma:</span>
                            <span className="font-medium text-gray-900">{alert.deviceInfo.language}</span>
                          </div>
                        )}
                        {alert.deviceInfo.screenResolution && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Resolución:</span>
                            <span className="font-medium text-gray-900">{alert.deviceInfo.screenResolution}</span>
                          </div>
                        )}
                        {alert.deviceInfo.userAgent && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <p className="text-xs text-gray-700 mb-1">User Agent:</p>
                            <p className="font-mono text-xs text-gray-600 bg-white px-2 py-1 rounded break-all">
                              {alert.deviceInfo.userAgent}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Dirección IP */}
                  {alert.ipAddress && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-medium text-purple-900">Dirección IP</p>
                      </div>
                      <p className="font-mono text-sm text-purple-900 bg-white px-2 py-1 rounded border">{alert.ipAddress}</p>
                    </div>
                  )}
                  
                  {/* Timestamps importantes */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900">Timestamps del Sistema</p>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Creación:</span>
                        <span className="font-mono text-gray-900">{alert.timestamp.toISOString()}</span>
                      </div>
                      {alert.resolvedAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Resolución:</span>
                          <span className="font-mono text-gray-900">{alert.resolvedAt.toISOString()}</span>
                        </div>
                      )}
                      {alert.expiresAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Expiración:</span>
                          <span className="font-mono text-gray-900">{alert.expiresAt.toISOString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat de Emergencia */}
              {chatMessages.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                    Registro de Comunicaciones ({chatMessages.length} mensajes)
                  </h2>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto px-1">
                    {chatMessages.map((msg) => {
                      const isRequester = msg.userId === alert.userId;
                      const isSystem = msg.type === 'system';
                      const isEmergency = msg.type === 'emergency';
                      return (
                        <div key={msg.id} className={`flex ${isRequester ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={
                              `max-w-[80%] rounded-2xl px-4 py-3 shadow-sm border ` +
                              (isSystem
                                ? 'bg-gray-50 border-gray-200'
                                : isRequester
                                ? 'bg-red-600 text-white border-red-700'
                                : isEmergency
                                ? 'bg-red-50 border-red-200'
                                : 'bg-blue-50 border-blue-200')
                            }
                          >
                            <div className={`flex items-center ${isRequester ? 'justify-end' : 'justify-start'} gap-2 mb-1`}>
                              {!isRequester && (
                                <span className="text-xs font-semibold text-gray-700">
                                  {msg.userName}
                                </span>
                              )}
                              {isRequester && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white tracking-wide">
                                  SOLICITANTE
                                </span>
                              )}
                              {isEmergency && !isRequester && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-800">
                                  EMERGENCIA
                                </span>
                              )}
                              <span className={`text-[10px] ${isRequester ? 'text-white/80' : 'text-gray-500'}`}>
                                {formatTimeOnly(msg.timestamp)}
                              </span>
                            </div>
                            <p className={`${isRequester ? 'text-white' : 'text-gray-800'} whitespace-pre-wrap break-words`}>
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evidencia Multimedia */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-indigo-600" />
                  Evidencia Multimedia
                </h2>
                
                <div className="space-y-4">
                  {/* Video de evidencia */}
                  {alert.hasVideo && alert.videoUrl ? (
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-100 to-purple-50 px-4 py-3 border-b border-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">Video de Emergencia</span>
                          <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                            MODO EXTREMO
                          </span>
                        </div>
                      </div>
                      <video
                        src={alert.videoUrl}
                        controls
                        className="w-full bg-black"
                        style={{ maxHeight: '400px' }}
                      >
                        Tu navegador no soporta la reproducción de video.
                      </video>
                      <div className="bg-gray-50 px-4 py-3 border-t border-gray-300">
                        <a
                          href={alert.videoUrl}
                          download
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-2 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Descargar video de evidencia</span>
                        </a>
                      </div>
                    </div>
                  ) : alert.extremeMode ? (
                    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <Video className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 mb-1">Modo extremo activado</p>
                      <p className="text-xs text-gray-700">El video no está disponible o está siendo procesado</p>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No hay evidencia multimedia para esta alerta</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Usuarios notificados */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-purple-600" />
                  Usuarios Notificados ({notifiedUsers.length})
                </h2>
                
                {notifiedUsers.length > 0 ? (
                  <div className="space-y-3">
                    {notifiedUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <UserCheck className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">{user.displayName}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No se encontraron detalles de usuarios notificados</p>
                )}
              </div>

              {/* Notas de administrador */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                    Notas de Administración
                  </h2>
                  {!editingNotes ? (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={saving}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(false);
                          setAdminNotes(alert.adminNotes || '');
                        }}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {editingNotes ? (
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                    placeholder="Agrega notas sobre esta alerta, acciones tomadas, seguimiento, etc..."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    {adminNotes ? (
                      <p className="text-gray-900 whitespace-pre-wrap">{adminNotes}</p>
                    ) : (
                      <p className="text-gray-500 italic">No hay notas de administración para esta alerta</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Columna lateral */}
            <div className="space-y-6">
              {/* Timeline Detallado */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-600" />
                  Timeline Detallado de Eventos
                </h2>
                
                <div className="relative space-y-6">
                  {/* Línea vertical */}
                  <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="relative flex items-start space-x-4">
                      {/* Icono del evento */}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                        event.type === 'created' ? 'bg-red-100 border-2 border-red-300' :
                        event.type === 'acknowledged' ? 'bg-blue-100 border-2 border-blue-300' :
                        event.type === 'resolved' ? 'bg-green-100 border-2 border-green-300' :
                        event.type === 'expired' ? 'bg-gray-100 border-2 border-gray-300' :
                        'bg-yellow-100 border-2 border-yellow-300'
                      }`}>
                        {event.type === 'created' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        {event.type === 'acknowledged' && <UserCheck className="w-4 h-4 text-blue-600" />}
                        {event.type === 'resolved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {event.type === 'expired' && <XCircle className="w-4 h-4 text-gray-600" />}
                        {event.type === 'message' && <MessageSquare className="w-4 h-4 text-yellow-600" />}
                      </div>
                      
                      {/* Contenido del evento */}
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-semibold text-gray-900">{event.description}</p>
                        {event.actor && (
                          <p className="text-xs text-gray-600 mt-1">Por: {event.actor}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{formatDate(event.timestamp)}</p>
                        <p className="text-xs text-gray-400">{formatTimeOnly(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                  
                  {timelineEvents.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No hay eventos registrados</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen Ejecutivo */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FileCheck className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Resumen Ejecutivo</h2>
                </div>
                
                <div className="space-y-4">
                  {/* ID de Alerta */}
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs font-semibold text-gray-600 mb-1">ID de Alerta</p>
                    <p className="font-mono text-xs text-gray-900 break-all">{alert.id}</p>
                  </div>
                  
                  {/* Estadísticas Clave */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-semibold text-gray-600">Notificados</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{alert.notifiedUsers.length}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-semibold text-gray-600">Reconocieron</p>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{alert.acknowledgedBy?.length || 0}</p>
                    </div>
                  </div>
                  
                  {/* Características Especiales */}
                  <div className="space-y-2">
                    {alert.extremeMode && (
                      <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 flex items-center space-x-3">
                        <Video className="w-5 h-5 text-purple-700" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-purple-900">Modo Extremo Activado</p>
                          <p className="text-xs text-purple-700">Grabación de video habilitada</p>
                        </div>
                      </div>
                    )}
                    
                    {alert.hasVideo && (
                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-center space-x-3">
                        <Camera className="w-5 h-5 text-blue-700" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-blue-900">Video Disponible</p>
                          <p className="text-xs text-blue-700">Evidencia multimedia capturada</p>
                        </div>
                      </div>
                    )}
                    
                    {alert.gpsCoordinates && (
                      <div className="bg-green-100 border border-green-300 rounded-lg p-3 flex items-center space-x-3">
                        <Navigation className="w-5 h-5 text-green-700" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-900">GPS Registrado</p>
                          <p className="text-xs text-green-700">Coordenadas exactas disponibles</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Nivel de Prioridad */}
                  <div className={`rounded-lg p-4 border-2 ${
                    alert.status === 'active' 
                      ? 'bg-red-50 border-red-300' 
                      : alert.status === 'resolved'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Nivel de Prioridad</p>
                        <p className={`text-lg font-bold ${
                          alert.status === 'active' ? 'text-red-900' :
                          alert.status === 'resolved' ? 'text-green-900' :
                          'text-gray-900'
                        }`}>
                          {alert.extremeMode ? 'CRÍTICA' :
                           alert.status === 'active' ? 'ALTA' :
                           alert.status === 'resolved' ? 'RESUELTA' :
                           'EXPIRADA'}
                        </p>
                      </div>
                      {alert.status === 'active' && (
                        <div className="animate-pulse">
                          <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas de Respuesta */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Métricas de Respuesta</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Tasa de respuesta */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700">Tasa de Respuesta</span>
                      <span className="text-sm font-bold text-gray-900">
                        {alert.notifiedUsers.length > 0 
                          ? Math.round(((alert.acknowledgedBy?.length || 0) / alert.notifiedUsers.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${alert.notifiedUsers.length > 0 
                            ? Math.round(((alert.acknowledgedBy?.length || 0) / alert.notifiedUsers.length) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Tiempo de respuesta */}
                  {alert.resolvedAt && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-700">Tiempo de Resolución</span>
                        <span className="text-sm font-bold text-blue-900">
                          {formatDuration(alert.timestamp, alert.resolvedAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>
                          {Math.floor((alert.resolvedAt.getTime() - alert.timestamp.getTime()) / 60000) < (alert.alertDurationMinutes || 60)
                            ? '✓ Resolución eficiente'
                            : '⚠ Tiempo extendido'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Mensajes */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">Mensajes de Chat</span>
                      </div>
                      <span className="text-lg font-bold text-purple-900">{chatMessages.length}</span>
                    </div>
                  </div>
                  
                  {/* Tipo de resolución */}
                  {alert.status !== 'active' && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">
                          {alert.autoResolved 
                            ? 'Expiración automática por tiempo'
                            : 'Resolución manual por administrador'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default PanicAlertDetailPage;


