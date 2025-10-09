'use client';

import React from 'react';
import { Clock, XCircle, AlertCircle, CheckCircle, User, Calendar } from 'lucide-react';

interface RegistrationStatusAlertProps {
  status: 'pending' | 'rejected' | 'approved';
  userProfile?: {
    displayName: string;
    email: string;
    createdAt: Date;
    statusReason?: string;
  };
  onClose: () => void;
}

const RegistrationStatusAlert: React.FC<RegistrationStatusAlertProps> = ({
  status,
  userProfile,
  onClose
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-600" />,
          title: 'Solicitud Pendiente',
          message: 'Tu solicitud de registro está siendo revisada por un administrador.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconBg: 'bg-yellow-100'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          title: 'Solicitud Rechazada',
          message: 'Tu solicitud de registro no fue aprobada.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconBg: 'bg-red-100'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          title: 'Solicitud Aprobada',
          message: 'Tu solicitud ha sido aprobada. Redirigiendo...',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconBg: 'bg-green-100'
        };
      default:
        return {
          icon: <AlertCircle className="w-8 h-8 text-gray-600" />,
          title: 'Estado Desconocido',
          message: 'No se pudo determinar el estado de tu solicitud.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconBg: 'bg-gray-100'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Si está aprobado, cerrar automáticamente después de un momento
  React.useEffect(() => {
    if (status === 'approved') {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2 rounded-lg shadow-xl max-w-md w-full p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`${statusInfo.iconBg} p-2 rounded-full`}>
              {statusInfo.icon}
            </div>
            <h3 className={`text-lg font-semibold ${statusInfo.textColor}`}>
              {statusInfo.title}
            </h3>
          </div>
          {status !== 'approved' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Message */}
        <p className={`${statusInfo.textColor} mb-4`}>
          {statusInfo.message}
        </p>

        {/* User Information */}
        {userProfile && (
          <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg p-4 mb-4`}>
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Información de tu solicitud:</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium">{userProfile.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{userProfile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de solicitud:</span>
                <span className="font-medium">
                  {new Date(userProfile.createdAt).toLocaleDateString()}
                </span>
              </div>
              {status === 'rejected' && userProfile.statusReason && (
                <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Razón del rechazo:</p>
                      <p className="text-sm text-red-700">{userProfile.statusReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status-specific information */}
        {status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  ¿Qué sucede ahora?
                </h4>
                <p className="text-sm text-blue-700">
                  Un administrador revisará tu solicitud y te notificará cuando sea procesada. 
                  Esto puede tomar algunos días. Mientras tanto, puedes explorar la comunidad como visitante.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-orange-800 mb-1">
                  ¿Qué puedes hacer?
                </h4>
                <p className="text-sm text-orange-700">
                  Puedes intentar registrarte nuevamente o contactar a la administración 
                  si crees que hubo un error. También puedes explorar la comunidad como visitante.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          {status === 'pending' && (
            <>
              <button
                onClick={() => {
                  // Configurar como visitante y redirigir
                  if (typeof window !== 'undefined') {
                    // Limpiar cualquier estado de autenticación
                    localStorage.removeItem('userSession');
                    localStorage.removeItem('userProfile');
                    // Redirigir al inicio como visitante
                    window.location.href = '/';
                  }
                }}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Explorar como Visitante
              </button>
              <button
                onClick={() => {
                  // Cerrar sesión y volver al login
                  window.location.href = '/login';
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Volver al Login
              </button>
            </>
          )}
          
          {status === 'rejected' && (
            <>
              <button
                onClick={() => {
                  window.location.href = '/register';
                }}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Intentar Registro Nuevamente
              </button>
              <button
                onClick={() => {
                  // Configurar como visitante y redirigir
                  if (typeof window !== 'undefined') {
                    // Limpiar cualquier estado de autenticación
                    localStorage.removeItem('userSession');
                    localStorage.removeItem('userProfile');
                    // Redirigir al inicio como visitante
                    window.location.href = '/';
                  }
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Explorar como Visitante
              </button>
            </>
          )}

          {status === 'approved' && (
            <button
              onClick={onClose}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Continuar al Sistema
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationStatusAlert;
