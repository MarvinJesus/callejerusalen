'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Camera, AlertTriangle, Users, MapPin, Bell, Settings, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ResidentesPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  // Permitir acceso a todos los usuarios, pero mostrar diferentes funcionalidades según el estado de autenticación

  const features = [
    {
      title: 'Cámaras de Seguridad',
      description: 'Monitorea las cámaras de seguridad de la comunidad en tiempo real',
      icon: Camera,
      href: '/residentes/camaras',
      color: 'blue',
      available: false, // Temporalmente no disponible
      requiresAuth: true
    },
    {
      title: 'Botón de Pánico',
      description: 'Acceso rápido al botón de pánico para emergencias',
      icon: AlertTriangle,
      href: '/residentes/panico',
      color: 'red',
      available: true,
      requiresAuth: true
    },
    {
      title: 'Alertas Comunitarias',
      description: 'Recibe y gestiona alertas importantes de la comunidad',
      icon: Bell,
      href: '/residentes/alertas',
      color: 'yellow',
      available: true,
      requiresAuth: true
    },
    {
      title: 'Mapa de Seguridad',
      description: 'Visualiza el mapa interactivo con puntos de seguridad',
      icon: MapPin,
      href: '/mapa',
      color: 'green',
      available: true,
      requiresAuth: false // Disponible para todos
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100',
          icon: 'text-blue-600',
          border: 'border-blue-200',
          hover: 'hover:bg-blue-50',
          text: 'text-blue-700'
        };
      case 'red':
        return {
          bg: 'bg-red-100',
          icon: 'text-red-600',
          border: 'border-red-200',
          hover: 'hover:bg-red-50',
          text: 'text-red-700'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-100',
          icon: 'text-yellow-600',
          border: 'border-yellow-200',
          hover: 'hover:bg-yellow-50',
          text: 'text-yellow-700'
        };
      case 'green':
        return {
          bg: 'bg-green-100',
          icon: 'text-green-600',
          border: 'border-green-200',
          hover: 'hover:bg-green-50',
          text: 'text-green-700'
        };
      default:
        return {
          bg: 'bg-gray-100',
          icon: 'text-gray-600',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-50',
          text: 'text-gray-700'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link
                href="/"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Inicio
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Residentes</h1>
                <p className="text-gray-600 mt-1">Herramientas de seguridad y comunicación comunitaria</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile?.displayName || user?.displayName || 'Residente'}
                  </p>
                  <p className="text-xs text-gray-500">Acceso autorizado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {user ? `¡Bienvenido, ${userProfile?.displayName || user?.displayName || 'Residente'}!` : 'Panel de Residentes'}
              </h2>
              <p className="text-green-100">
                {user 
                  ? 'Accede a las herramientas de seguridad y comunicación de la comunidad de Calle Jerusalén.'
                  : 'Descubre las herramientas de seguridad disponibles para los residentes de Calle Jerusalén. Inicia sesión para acceder a todas las funcionalidades.'
                }
              </p>
              {!user && (
                <div className="mt-4 flex space-x-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 bg-white text-green-600 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center px-4 py-2 border border-white text-white text-sm font-medium rounded-lg hover:bg-white hover:text-green-600 transition-colors"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <Shield className="w-16 h-16 text-green-200" />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            const IconComponent = feature.icon;
            const isAvailable = feature.available && (!feature.requiresAuth || user);
            
            return (
              <div key={index} className="group">
                {isAvailable ? (
                  <Link href={feature.href} className="block">
                    <div className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${colors.border} ${colors.hover} group-hover:scale-105`}>
                      <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="mt-4 flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700">
                        Acceder →
                      </div>
                    </div>
                  </Link>
                ) : feature.available && feature.requiresAuth && !user ? (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                      <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mb-3">
                      Requiere inicio de sesión
                    </div>
                    <Link
                      href="/login"
                      className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Iniciar sesión para acceder →
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 opacity-60">
                    <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                      <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-2">
                      {feature.description}
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Próximamente
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cámaras Activas</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Residentes Conectados</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Alertas Recientes</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Section */}
        {user ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Emergencias</h3>
                <p className="text-red-700 mb-4">
                  En caso de emergencia, usa el botón de pánico para alertar inmediatamente a las autoridades y vecinos.
                </p>
                <Link
                  href="/residentes/panico"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Botón de Pánico
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">¿Eres residente?</h3>
                <p className="text-blue-700 mb-4">
                  Si vives en Calle Jerusalén, regístrate para acceder a todas las herramientas de seguridad y comunicación comunitaria.
                </p>
                <div className="flex space-x-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Registrarse como Residente
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentesPage;
