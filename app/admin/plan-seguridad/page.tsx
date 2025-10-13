'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Check, X, Clock, Phone, MapPin, Briefcase, User, Mail, Calendar, AlertCircle, Trash2, ArrowLeft, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

const SecurityPlanAdminContent: React.FC = () => {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/security-registrations');
      const data = await response.json();
      
      if (data.success) {
        setRegistrations(data.registrations);
      } else {
        throw new Error(data.error || 'Error al cargar registros');
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    const registration = registrations.find(r => r.id === registrationId);
    const isReapproving = registration?.status === 'rejected';
    
    const confirmMessage = isReapproving 
      ? '¿Estás seguro de reaprobar esta inscripción que fue rechazada?'
      : '¿Estás seguro de aprobar esta inscripción?';
    
    if (!confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/security-registrations/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registrationId,
          adminUid: user?.uid,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al aprobar');
      }

      toast.success(isReapproving ? 'Inscripción reaprobada exitosamente' : 'Inscripción aprobada exitosamente');
      setSelectedRegistration(null);
      await loadRegistrations();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al aprobar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (registrationId: string) => {
    const registration = registrations.find(r => r.id === registrationId);
    const isRejectingActive = registration?.status === 'active';
    
    const confirmMessage = isRejectingActive 
      ? '¿Estás seguro de rechazar esta solicitud que ya está aprobada? El usuario perderá acceso a las funciones de seguridad.'
      : '¿Estás seguro de rechazar esta solicitud?';
    
    if (!confirm(confirmMessage)) return;

    const reason = prompt('¿Razón del rechazo? (opcional)');
    if (reason === null) return; // User cancelled

    setActionLoading(true);
    try {
      const response = await fetch('/api/security-registrations/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registrationId,
          adminUid: user?.uid,
          action: 'reject',
          rejectionReason: reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al rechazar');
      }

      toast.success(isRejectingActive ? 'Solicitud rechazada exitosamente' : 'Inscripción rechazada exitosamente');
      setSelectedRegistration(null);
      await loadRegistrations();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al rechazar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (registrationId: string) => {
    const registration = registrations.find(r => r.id === registrationId);
    const userName = registration?.userDisplayName || 'esta solicitud';
    
    if (!confirm(`¿Estás seguro de eliminar la solicitud de ${userName}? Esta acción no se puede deshacer.`)) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/security-registrations/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registrationId,
          adminUid: user?.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar');
      }

      toast.success('Solicitud eliminada exitosamente');
      setSelectedRegistration(null);
      await loadRegistrations();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEditComment = (registrationId: string, currentComment: string) => {
    setEditingComment(registrationId);
    setCommentText(currentComment || '');
  };

  const handleCancelEditComment = () => {
    setEditingComment(null);
    setCommentText('');
  };

  const handleSaveComment = async (registrationId: string) => {
    if (!commentText.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/security-registrations/update-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registrationId,
          adminUid: user?.uid,
          reviewNotes: commentText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar comentario');
      }

      toast.success('Comentario actualizado exitosamente');
      setEditingComment(null);
      setCommentText('');
      await loadRegistrations();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar comentario');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return <Check className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'pending':
      default:
        return 'Pendiente';
    }
  };

  const getAvailabilityText = (availability: string) => {
    const availabilityMap: { [key: string]: string } = {
      'always': 'Siempre disponible',
      'full_time': 'Tiempo completo',
      'part_time': 'Medio tiempo',
      'emergencies_only': 'Solo emergencias',
      'weekends': 'Fines de semana'
    };
    return availabilityMap[availability] || availability;
  };

  const getSkillsText = (skills: string[]) => {
    const skillMap: { [key: string]: string } = {
      'first_aid': '🩹 Primeros auxilios',
      'doctor': '👨‍⚕️ Médico',
      'firefighter': '🚒 Bombero',
      'security': '🛡️ Seguridad',
      'other': '✨ Otro',
    };
    return skills.map(skill => skillMap[skill] || skill).join(', ');
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true;
    if (filter === 'pending') return reg.status === 'pending';
    if (filter === 'approved') return reg.status === 'active' || reg.status === 'approved';
    if (filter === 'rejected') return reg.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-green-600" />
                Gestión del Plan de Seguridad
              </h1>
              <p className="text-gray-600 mt-2">Aprobar o rechazar solicitudes de inscripción</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total de solicitudes</p>
              <p className="text-3xl font-bold text-green-600">{registrations.length}</p>
            </div>
          </div>
          <Link
            href="/admin/admin-dashboard"
            className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Volver al Dashboard</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({registrations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes ({registrations.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aprobadas ({registrations.filter(r => r.status === 'active' || r.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rechazadas ({registrations.filter(r => r.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Registrations List */}
        <div className="space-y-4">
          {filteredRegistrations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay solicitudes {filter !== 'all' ? `con estado ${filter}` : ''}
              </h3>
              <p className="text-gray-600">
                {filter === 'pending' 
                  ? 'No hay solicitudes pendientes de revisión'
                  : filter === 'approved'
                  ? 'No hay solicitudes aprobadas'
                  : filter === 'rejected'
                  ? 'No hay solicitudes rechazadas'
                  : 'No hay solicitudes registradas'
                }
              </p>
            </div>
          ) : (
            filteredRegistrations.map((registration) => (
              <div key={registration.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {registration.userDisplayName}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(registration.status)}`}>
                        {getStatusIcon(registration.status)}
                        <span className="ml-1">{getStatusText(registration.status)}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{registration.userEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{registration.phoneNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{registration.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{getAvailabilityText(registration.availability)}</span>
                      </div>
                    </div>

                    {registration.skills && registration.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Habilidades:</h4>
                        <p className="text-sm text-gray-600">{getSkillsText(registration.skills)}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Solicitado: {registration.submittedAt ? new Date(registration.submittedAt).toLocaleDateString('es-ES') : 'Fecha no disponible'}</span>
                      </div>
                      {registration.reviewedAt && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Revisado: {new Date(registration.reviewedAt).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}
                    </div>

                    {registration.reviewNotes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-700">Notas de revisión:</h4>
                          {registration.status === 'rejected' && !editingComment && (
                            <button
                              onClick={() => handleStartEditComment(registration.id, registration.reviewNotes)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              disabled={actionLoading}
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Editar
                            </button>
                          )}
                        </div>
                        
                        {editingComment === registration.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Escribe las notas de revisión..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
                              rows={3}
                              disabled={actionLoading}
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={handleCancelEditComment}
                                className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={actionLoading}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveComment(registration.id)}
                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={actionLoading}
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">{registration.reviewNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Mostrar información de re-aprobación si es relevante */}
                    {registration.status === 'active' && registration.reviewNotes?.includes('Aprobado') && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          <p className="text-sm text-green-800 font-medium">
                            {registration.reviewNotes.includes('reaprobado') || registration.reviewNotes.includes('Reaprobado') 
                              ? 'Esta solicitud fue reaprobada por un administrador'
                              : 'Esta solicitud fue aprobada por un administrador'
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {/* Botón de Aprobar: solo para pending y rejected */}
                    {(registration.status === 'pending' || registration.status === 'rejected') && (
                      <button
                        onClick={() => handleApprove(registration.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {registration.status === 'rejected' ? 'Reaprobar' : 'Aprobar'}
                      </button>
                    )}

                    {/* Botón de Rechazar: para pending y active */}
                    {(registration.status === 'pending' || registration.status === 'active') && (
                      <button
                        onClick={() => handleReject(registration.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {registration.status === 'active' ? 'Rechazar' : 'Rechazar'}
                      </button>
                    )}
                    
                    {/* Botón de Eliminar siempre visible para todos los estados */}
                    <button
                      onClick={() => handleDelete(registration.id)}
                      disabled={actionLoading}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const SecurityPlanAdminPage: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <SecurityPlanAdminContent />
    </ProtectedRoute>
  );
};

export default SecurityPlanAdminPage;