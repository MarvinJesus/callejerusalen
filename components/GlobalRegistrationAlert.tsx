'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Componente de alerta global que se muestra en todas las páginas
 * cuando el usuario tiene un registro pendiente o rechazado
 */
const GlobalRegistrationAlert: React.FC = () => {
  const { user, userProfile, isRegistrationPending, isRegistrationRejected } = useAuth();

  // Agregar padding al body cuando la alerta está visible
  useEffect(() => {
    if (isRegistrationPending || isRegistrationRejected) {
      document.body.style.paddingTop = '80px';
    } else {
      document.body.style.paddingTop = '0';
    }

    // Limpiar al desmontar
    return () => {
      document.body.style.paddingTop = '0';
    };
  }, [isRegistrationPending, isRegistrationRejected]);

  // No mostrar si no hay usuario autenticado o no hay perfil
  if (!user || !userProfile) {
    return null;
  }

  // Alerta para registro pendiente (amarilla)
  if (isRegistrationPending) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 border-b-2 border-yellow-600 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 bg-yellow-600 rounded-full p-2">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base">
                  Solicitud de Registro Pendiente
                </p>
                <p className="text-yellow-100 text-xs sm:text-sm">
                  Tu solicitud está siendo revisada por un administrador. Podrás acceder a todas las funcionalidades una vez aprobada.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <Link
                href="/visitantes"
                className="hidden sm:inline-flex items-center px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                Explorar como Visitante
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Alerta para registro rechazado (roja)
  if (isRegistrationRejected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 border-b-2 border-red-600 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 bg-red-600 rounded-full p-2">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base">
                  Solicitud de Registro Rechazada
                </p>
                <p className="text-red-100 text-xs sm:text-sm">
                  {userProfile.statusReason || 'Tu solicitud no fue aprobada. Contacta al administrador para más información.'}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                Intentar de Nuevo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GlobalRegistrationAlert;

