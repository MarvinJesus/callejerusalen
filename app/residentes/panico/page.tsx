'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertTriangle, Phone, MapPin, Clock, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PanicReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  location: string;
  description: string;
  timestamp: any;
  status: 'active' | 'resolved';
  emergencyContacts: string[];
}

const PanicPage: React.FC = () => {
  const { user, userProfile, securityPlan, loading } = useAuth();
  const router = useRouter();
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [panicCountdown, setPanicCountdown] = useState(0);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [recentReports, setRecentReports] = useState<PanicReport[]>([]);

  // Verificar inscripción en el Plan de Seguridad
  useEffect(() => {
    console.log('🔍 PanicoPage - Verificando acceso:', {
      user: user?.email,
      userProfile: userProfile?.email,
      securityPlan: securityPlan,
      securityPlanStatus: securityPlan?.status,
      loading: loading
    });

    // No hacer verificaciones hasta que se carguen todos los datos
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

    console.log('🔍 PanicoPage - Verificaciones:', {
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

    console.log('✅ PanicoPage - Acceso concedido');
  }, [user, userProfile, securityPlan, loading, router]);

  // Números de emergencia
  const emergencyContacts = [
    { name: 'Policía', number: '911', description: 'Emergencias generales' },
    { name: 'Bomberos', number: '911', description: 'Incendios y rescates' },
    { name: 'Ambulancia', number: '911', description: 'Emergencias médicas' },
    { name: 'Seguridad Comunitaria', number: '+1 (555) 911-0000', description: 'Seguridad local' },
  ];

  // Datos de ejemplo para reportes recientes
  const sampleReports: PanicReport[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'María González',
      userEmail: 'maria@email.com',
      location: 'Calle Principal #123',
      description: 'Actividad sospechosa en el estacionamiento',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      status: 'resolved',
      emergencyContacts: ['911', '+1 (555) 911-0000']
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Carlos Rodríguez',
      userEmail: 'carlos@email.com',
      location: 'Parque Central',
      description: 'Persona herida que necesita atención médica',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
      status: 'resolved',
      emergencyContacts: ['911']
    }
  ];

  useEffect(() => {
    setRecentReports(sampleReports);
  }, []);

  // Función para manejar la activación del pánico
  const handlePanicActivation = async () => {
    if (!user || !userProfile) {
      toast.error('Debes estar autenticado para usar el botón de pánico');
      return;
    }

    try {
      // Crear reporte de pánico en Firestore
      const panicReport: Omit<PanicReport, 'id'> = {
        userId: user.uid,
        userName: userProfile.displayName || user.displayName || 'Usuario',
        userEmail: userProfile.email || user.email || '',
        location: location || 'Ubicación no especificada',
        description: description || 'Emergencia reportada',
        timestamp: serverTimestamp(),
        status: 'active',
        emergencyContacts: ['911', '+1 (555) 911-0000']
      };

      const docRef = await addDoc(collection(db, 'panicReports'), panicReport);
      
      setIsPanicActive(true);
      toast.success('¡Alerta de emergencia enviada! Las autoridades han sido notificadas.');
      
      // Actualizar la lista de reportes recientes
      setRecentReports(prev => [{
        ...panicReport,
        id: docRef.id
      } as PanicReport, ...prev.slice(0, 4)]); // Mantener solo los 5 más recientes
      
    } catch (error) {
      console.error('Error al enviar reporte de pánico:', error);
      toast.error('Error al enviar la alerta. Inténtalo de nuevo.');
    }
  };

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

  // Mostrar pantalla de carga mientras se verifican los datos
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

  const startPanicSequence = () => {
    if (!user) {
      toast.error('Debes estar autenticado para usar el botón de pánico');
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Botón de Pánico
          </h1>
          <p className="text-gray-600">
            Sistema de emergencia para reportar situaciones de peligro inmediato
          </p>
        </div>

        {/* Panic Button Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center">
            {!isPanicActive ? (
              <div>
                <div className="w-32 h-32 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-16 h-16 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ¿Necesitas ayuda de emergencia?
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Presiona el botón de pánico para alertar inmediatamente a las autoridades y servicios de emergencia.
                </p>

                {/* Formulario opcional */}
                <div className="max-w-md mx-auto space-y-4 mb-6">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación (Opcional)
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="input-field"
                      placeholder="Ej: Calle Principal #123"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (Opcional)
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Describe brevemente la situación..."
                    />
                  </div>
                </div>

                <button
                  onClick={startPanicSequence}
                  className="panic-button"
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
                  className="btn-secondary"
                >
                  CANCELAR ALERTA
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-red-600" />
            Contactos de Emergencia
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{contact.name}</h4>
                  <p className="text-sm text-gray-600">{contact.description}</p>
                </div>
                <a
                  href={`tel:${contact.number}`}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Llamar
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Reportes Recientes
          </h3>
          
          {recentReports.length > 0 ? (
            <div className="space-y-4">
              {recentReports.map(report => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      <h4 className="font-medium text-gray-900">
                        {report.userName}
                      </h4>
                      {report.status === 'resolved' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(report.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">
                    {report.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{report.location}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'resolved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.status === 'resolved' ? 'Resuelto' : 'Activo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No hay reportes recientes
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900">
                Aviso Importante
              </h3>
              <p className="text-sm text-red-800 mt-1">
                El botón de pánico debe usarse únicamente en situaciones de emergencia real. 
                El uso indebido puede resultar en sanciones y cargos legales. 
                En caso de emergencia médica, llama inmediatamente al 911.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanicPage;
