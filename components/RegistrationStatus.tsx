'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Clock, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const RegistrationStatus: React.FC = () => {
  const { user, userProfile, isRegistrationPending, isRegistrationRejected } = useAuth();

  if (!user || !userProfile) {
    return null;
  }

  if (isRegistrationPending) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Solicitud Pendiente
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              Tu solicitud de registro está siendo revisada
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 mb-1">
                    ¿Qué sucede ahora?
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Un administrador revisará tu solicitud y te notificará cuando sea aprobada. 
                    Esto puede tomar algunos días.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                <strong>Email:</strong> {userProfile.email}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Nombre:</strong> {userProfile.displayName}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Fecha de solicitud:</strong> {new Date(userProfile.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isRegistrationRejected) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Solicitud Rechazada
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              Tu solicitud de registro no fue aprobada
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Razón del rechazo
                  </h3>
                  <p className="text-sm text-red-700">
                    {userProfile.statusReason || 'No se proporcionó una razón específica.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                <strong>Email:</strong> {userProfile.email}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Nombre:</strong> {userProfile.displayName}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Fecha de rechazo:</strong> {userProfile.statusChangedAt ? new Date(userProfile.statusChangedAt).toLocaleDateString() : 'No disponible'}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Intentar registro nuevamente
              </Link>
              <div>
                <Link
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RegistrationStatus;
