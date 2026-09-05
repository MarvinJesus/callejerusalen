'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertTriangle, Bell, Plus, Clock, User, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'emergency' | 'warning' | 'info' | 'maintenance';
  location: string;
  reportedBy: string;
  reportedAt: any;
  status: 'active' | 'resolved';
  contactPhone?: string;
}

const AlertsPage: React.FC = () => {
  const { user, userProfile, securityPlan, loading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    type: 'info' as Alert['type'],
    location: '',
    contactPhone: '',
  });

  // Verificar inscripción en el Plan de Seguridad
  useEffect(() => {
    console.log('🔍 AlertasPage - Verificando acceso:', {
      user: user?.email,
      userProfile: userProfile?.email,
      securityPlan: securityPlan,
      securityPlanStatus: securityPlan?.status,
      loading: loading
    });

    // No hacer verificaciones hasta que se carguen todos los datos
    if (loading) {
      console.log('⏳ AlertasPage - Aún cargando datos...');
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

    console.log('🔍 AlertasPage - Verificaciones:', {
      isAdminOrSuperAdmin,
      isEnrolled,
      isApproved,
      userRole: userProfile?.role
    });

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

    console.log('✅ AlertasPage - Acceso concedido');
  }, [user, userProfile, securityPlan, loading, router]);

  // Datos de ejemplo para alertas
  const sampleAlerts: Alert[] = [
    {
      id: '1',
      title: 'Corte de Agua Programado',
      description: 'Se realizará mantenimiento en la red de agua potable el próximo martes de 8:00 AM a 2:00 PM. Se recomienda almacenar agua.',
      type: 'maintenance',
      location: 'Toda la comunidad',
      reportedBy: 'Administración',
      reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
      status: 'active',
      contactPhone: '+1 (555) 123-4567'
    },
    {
      id: '2',
      title: 'Actividad Sospechosa Reportada',
      description: 'Se reportó actividad sospechosa en el área del estacionamiento. Se recomienda mayor precaución y reportar cualquier incidente.',
      type: 'warning',
      location: 'Estacionamiento Principal',
      reportedBy: 'Residente - María González',
      reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
      status: 'active',
      contactPhone: '+1 (555) 911-0000'
    },
    {
      id: '3',
      title: 'Evento Comunitario',
      description: 'Este sábado se realizará una feria comunitaria en el parque central. Habrá comida, juegos y actividades para toda la familia.',
      type: 'info',
      location: 'Parque Central',
      reportedBy: 'Comité de Eventos',
      reportedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
      status: 'active'
    },
    {
      id: '4',
      title: 'Fuga de Gas Resuelta',
      description: 'La fuga de gas reportada en la calle principal ha sido resuelta. El servicio de gas ha sido restaurado completamente.',
      type: 'emergency',
      location: 'Calle Principal',
      reportedBy: 'Servicios de Emergencia',
      reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
      status: 'resolved',
      contactPhone: '+1 (555) 911-0000'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setAlerts(sampleAlerts);
      setAlertsLoading(false);
    }, 1000);
  }, []);

  // Mostrar pantalla de carga mientras se verifican los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso al sistema de alertas...</p>
        </div>
      </div>
    );
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'maintenance':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'emergency':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'maintenance':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertTypeText = (type: Alert['type']) => {
    switch (type) {
      case 'emergency':
        return 'Emergencia';
      case 'warning':
        return 'Advertencia';
      case 'info':
        return 'Información';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return 'General';
    }
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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes estar autenticado para reportar alertas');
      return;
    }

    try {
      // En una implementación real, aquí se guardaría en Firestore
      const newAlert: Alert = {
        id: Date.now().toString(),
        title: reportForm.title,
        description: reportForm.description,
        type: reportForm.type,
        location: reportForm.location,
        reportedBy: userProfile?.displayName || user.email || 'Usuario',
        reportedAt: new Date(),
        status: 'active',
        contactPhone: reportForm.contactPhone
      };

      setAlerts(prev => [newAlert, ...prev]);
      setReportForm({
        title: '',
        description: '',
        type: 'info',
        location: '',
        contactPhone: '',
      });
      setShowReportForm(false);
      toast.success('Alerta reportada exitosamente');
    } catch (error) {
      toast.error('Error al reportar la alerta');
    }
  };

  const handleViewDetails = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAlert(null);
  };

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

  if (userProfile?.role !== 'comunidad') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Restringido
            </h2>
            <p className="text-gray-600">
              Solo los residentes pueden acceder a las alertas comunitarias.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Alertas Comunitarias
            </h1>
            <p className="text-gray-600">
              Mantente informado sobre eventos, emergencias y noticias de la comunidad
            </p>
          </div>
          
          <button
            onClick={() => setShowReportForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Reportar Alerta</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emergencias</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.type === 'emergency' && a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Advertencias</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(a => a.type === 'warning' && a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Información</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.type === 'info' && a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.type === 'maintenance' && a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className={`border rounded-lg p-6 ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alert.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-800">
                        {getAlertTypeText(alert.type)}
                      </span>
                    </div>
                  </div>
                  
                  {alert.status === 'resolved' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Resuelto
                    </span>
                  )}
                </div>

                <p className="text-gray-700 mb-4">
                  {alert.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{alert.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{alert.reportedBy}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(alert.reportedAt)}</span>
                  </div>
                  
                  {alert.contactPhone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <a 
                        href={`tel:${alert.contactPhone}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {alert.contactPhone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleViewDetails(alert)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Form Modal */}
        {showReportForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Reportar Nueva Alerta
                </h2>
                
                <form onSubmit={handleReportSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Título de la Alerta
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={reportForm.title}
                      onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                      className="input-field"
                      placeholder="Ej: Fuga de agua en el parque"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Alerta
                    </label>
                    <select
                      id="type"
                      required
                      value={reportForm.type}
                      onChange={(e) => setReportForm(prev => ({ ...prev, type: e.target.value as Alert['type'] }))}
                      className="input-field"
                    >
                      <option value="info">Información</option>
                      <option value="warning">Advertencia</option>
                      <option value="emergency">Emergencia</option>
                      <option value="maintenance">Mantenimiento</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      id="location"
                      required
                      value={reportForm.location}
                      onChange={(e) => setReportForm(prev => ({ ...prev, location: e.target.value }))}
                      className="input-field"
                      placeholder="Ej: Parque Central, Estacionamiento, etc."
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      id="description"
                      required
                      rows={4}
                      value={reportForm.description}
                      onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                      className="input-field resize-none"
                      placeholder="Describe detalladamente la situación..."
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Contacto (Opcional)
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      value={reportForm.contactPhone}
                      onChange={(e) => setReportForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="input-field"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 btn-primary"
                    >
                      Reportar Alerta
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalles de Alerta */}
        {showDetailModal && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header del Modal */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(selectedAlert.type)}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedAlert.title}
                      </h2>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-800 border">
                        {getAlertTypeText(selectedAlert.type)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 space-y-6">
                {/* Estado de la Alerta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">Estado:</span>
                    {selectedAlert.status === 'active' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Resuelta
                      </span>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedAlert.description}
                  </p>
                </div>

                {/* Información Detallada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ubicación */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Ubicación</h4>
                    </div>
                    <p className="text-gray-700">{selectedAlert.location}</p>
                  </div>

                  {/* Reportado por */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Reportado por</h4>
                    </div>
                    <p className="text-gray-700">{selectedAlert.reportedBy}</p>
                  </div>

                  {/* Fecha y Hora */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Fecha y Hora</h4>
                    </div>
                    <p className="text-gray-700">{formatDate(selectedAlert.reportedAt)}</p>
                  </div>

                  {/* Contacto */}
                  {selectedAlert.contactPhone && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Phone className="w-5 h-5 text-orange-600" />
                        <h4 className="font-semibold text-gray-900">Contacto</h4>
                      </div>
                      <a 
                        href={`tel:${selectedAlert.contactPhone}`}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {selectedAlert.contactPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  {selectedAlert.contactPhone && (
                    <a
                      href={`tel:${selectedAlert.contactPhone}`}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center font-medium flex items-center justify-center space-x-2"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Llamar</span>
                    </a>
                  )}
                  <button
                    onClick={closeDetailModal}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;



