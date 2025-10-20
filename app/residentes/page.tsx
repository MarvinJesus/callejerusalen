'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Camera, AlertTriangle, Users, MapPin, Bell, Settings, ArrowLeft, Sparkles, Lock, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SecurityPlanModal from '@/components/SecurityPlanModal';
import { useStats } from '@/hooks/useStats';

const ResidentesPage: React.FC = () => {
  const { user, userProfile, securityPlan } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const stats = useStats();

  const isEnrolledInSecurityPlan = securityPlan !== null && securityPlan.status === 'active';
  const isAlreadyEnrolled = securityPlan !== null;

  const features = [
    {
      title: 'Panel de Seguridad Personal',
      description: 'Accede a tu panel personalizado de vigilancia y solicita acceso a cámaras específicas',
      icon: Camera,
      href: '/residentes/seguridad',
      color: 'blue',
      available: true,
      requiresAuth: true,
      requiresSecurityPlan: true
    },
    {
      title: 'Botón de Pánico',
      description: 'Acceso rápido al botón de pánico para emergencias',
      icon: AlertTriangle,
      href: '/residentes/panico',
      color: 'red',
      available: true,
      requiresAuth: true,
      requiresSecurityPlan: true
    },
    {
      title: 'Alertas Comunitarias',
      description: 'Recibe y gestiona alertas importantes de la comunidad',
      icon: Bell,
      href: '/residentes/alertas',
      color: 'yellow',
      available: true,
      requiresAuth: true,
      requiresSecurityPlan: true
    },
    {
      title: 'Mapa de Seguridad',
      description: 'Visualiza el mapa interactivo con puntos de seguridad',
      icon: MapPin,
      href: '/mapa',
      color: 'green',
      available: true,
      requiresAuth: false,
      requiresSecurityPlan: false
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-100',
          icon: 'text-blue-600',
          border: 'border-blue-200',
          hover: 'hover:border-blue-400',
          text: 'text-blue-700',
          shadow: 'shadow-blue-500/20'
        };
      case 'red':
        return {
          gradient: 'from-red-500 to-red-600',
          bg: 'bg-red-100',
          icon: 'text-red-600',
          border: 'border-red-200',
          hover: 'hover:border-red-400',
          text: 'text-red-700',
          shadow: 'shadow-red-500/20'
        };
      case 'yellow':
        return {
          gradient: 'from-yellow-500 to-amber-600',
          bg: 'bg-yellow-100',
          icon: 'text-yellow-600',
          border: 'border-yellow-200',
          hover: 'hover:border-yellow-400',
          text: 'text-yellow-700',
          shadow: 'shadow-yellow-500/20'
        };
      case 'green':
        return {
          gradient: 'from-green-500 to-emerald-600',
          bg: 'bg-green-100',
          icon: 'text-green-600',
          border: 'border-green-200',
          hover: 'hover:border-green-400',
          text: 'text-green-700',
          shadow: 'shadow-green-500/20'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          bg: 'bg-gray-100',
          icon: 'text-gray-600',
          border: 'border-gray-200',
          hover: 'hover:border-gray-400',
          text: 'text-gray-700',
          shadow: 'shadow-gray-500/20'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header with Glassmorphism */}
      <div className="relative backdrop-blur-md bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="group inline-flex items-center text-gray-600 hover:text-green-600 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors duration-300 mr-2">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                </div>
                <span className="font-medium">Volver</span>
              </Link>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
                  Panel de Residentes
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">Seguridad y Comunicación Comunitaria</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-xl border border-green-200/50">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {userProfile?.displayName || user?.displayName || 'Residente'}
                  </p>
                  <p className="text-xs text-green-600 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    Conectado
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section with Advanced Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 p-1 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/50 to-transparent opacity-50"></div>
          <div className="relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-2xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-6 md:space-y-0">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-medium text-white">Sistema de Seguridad Inteligente</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  {user ? `¡Bienvenido, ${userProfile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Residente'}!` : 'Bienvenido a Calle Jerusalén'}
                </h2>
                
                {/* Mostrar mensaje según estado de inscripción */}
                {user && securityPlan && securityPlan.status === 'pending' ? (
                  <div className="space-y-3">
                    <p className="text-green-50 text-lg max-w-2xl leading-relaxed">
                      Tu solicitud al <span className="font-bold text-yellow-300">Plan de Seguridad de la Comunidad</span> está 
                      <span className="font-bold text-yellow-300"> pendiente de aprobación</span> por un administrador.
                      Te notificaremos cuando sea revisada.
                    </p>
                    <div className="inline-flex items-center space-x-2 bg-yellow-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-300">
                      <Clock className="w-5 h-5 text-yellow-300" />
                      <span className="text-sm font-medium text-yellow-100">Solicitud en Revisión</span>
                    </div>
                  </div>
                ) : user && securityPlan && securityPlan.status === 'rejected' ? (
                  <div className="space-y-3">
                    <p className="text-green-50 text-lg max-w-2xl leading-relaxed">
                      Tu solicitud al Plan de Seguridad fue <span className="font-bold text-red-300">rechazada</span>.
                      {securityPlan.reviewNotes && (
                        <span className="block mt-2 text-base">
                          Razón: {securityPlan.reviewNotes}
                        </span>
                      )}
                      Contacta al administrador para más información o para volver a solicitar.
                    </p>
                  </div>
                ) : user && !isEnrolledInSecurityPlan && !isAlreadyEnrolled ? (
                  <div className="space-y-3">
                    <p className="text-green-50 text-lg max-w-2xl leading-relaxed">
                      Para acceder a las funciones de seguridad (cámaras, botón de pánico, alertas), únete al 
                      <span className="font-bold text-yellow-300"> Plan de Seguridad de la Comunidad</span>. 
                      Mantengámonos conectados e informados a través de la tecnología.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="group inline-flex items-center px-6 py-3 bg-white text-green-600 font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300"
                      >
                        <Shield className="w-5 h-5 mr-2" />
                        <span>Inscribirme en el Plan de Seguridad</span>
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ) : user ? (
                  <p className="text-green-50 text-lg max-w-2xl leading-relaxed">
                    Tu seguridad es nuestra prioridad. Accede a todas las herramientas de monitoreo y comunicación de la comunidad.
                  </p>
                ) : (
                  <>
                    <p className="text-green-50 text-lg max-w-2xl leading-relaxed">
                      Descubre nuestro ecosistema de seguridad comunitaria. Regístrate para acceder a todas las funcionalidades.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link
                        href="/login"
                        className="group inline-flex items-center px-6 py-3 bg-white text-green-600 font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300"
                      >
                        <span>Iniciar Sesión</span>
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        href="/register"
                        className="group inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-green-600 transition-all duration-300"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        <span>Registrarse</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center transform rotate-6 hover:rotate-12 transition-transform duration-500">
                    <Shield className="w-20 h-20 text-white/80" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400/30 rounded-full blur-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid with Enhanced Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            const IconComponent = feature.icon;
            const needsSecurityPlan = feature.requiresSecurityPlan && !isEnrolledInSecurityPlan;
            const isAvailable = feature.available && (!feature.requiresAuth || user) && !needsSecurityPlan;
            
            return (
              <div 
                key={index} 
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {isAvailable ? (
                  <Link href={feature.href} className="block">
                    <div className={`relative h-full bg-white rounded-2xl p-6 border-2 ${colors.border} ${colors.hover} transition-all duration-500 group-hover:shadow-2xl ${colors.shadow} group-hover:-translate-y-2`}>
                      {/* Gradient Background on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
                      
                      <div className="relative">
                        <div className={`relative w-14 h-14 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                          <IconComponent className="w-7 h-7 text-white" />
                          <div className="absolute inset-0 bg-white/20 rounded-2xl group-hover:animate-ping"></div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          {feature.description}
                        </p>
                        
                        <div className="flex items-center text-sm font-semibold text-gray-400 group-hover:text-green-600 transition-colors">
                          <span>Acceder</span>
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : needsSecurityPlan ? (
                  <div className="relative h-full bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
                    <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                      <IconComponent className={`w-7 h-7 ${colors.icon}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center space-x-1.5 bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full border border-orange-200">
                      <Shield className="w-3 h-3" />
                      <span>Requiere Plan de Seguridad</span>
                    </div>
                    {securityPlan?.status === 'pending' && (
                      <p className="text-sm text-orange-600 mt-3">Solicitud en revisión...</p>
                    )}
                    {securityPlan?.status === 'rejected' && (
                      <p className="text-sm text-red-600 mt-3">Solicitud rechazada</p>
                    )}
                  </div>
                ) : feature.available && feature.requiresAuth && !user ? (
                  <div className="relative h-full bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                    <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                      <IconComponent className={`w-7 h-7 ${colors.icon}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200 mb-3">
                      <Lock className="w-3 h-3" />
                      <span>Requiere autenticación</span>
                    </div>
                    <Link
                      href="/login"
                      className="block text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                    >
                      Iniciar sesión →
                    </Link>
                  </div>
                ) : (
                  <div className="relative h-full bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 opacity-60">
                    <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mb-4`}>
                      <IconComponent className={`w-7 h-7 ${colors.icon} opacity-50`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <span className="inline-block bg-gray-200 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full">
                      Próximamente
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stats Section with Glassmorphism */}
        {stats.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{stats.error}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Cámaras Accesibles</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {stats.loading ? (
                      <span className="inline-block w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></span>
                    ) : (
                      stats.accessibleCameras
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </div>

          <div className="group relative overflow-hidden bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Residentes Conectados</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-800 bg-clip-text text-transparent">
                    {stats.loading ? (
                      <span className="inline-block w-8 h-8 border-2 border-green-300 border-t-green-600 rounded-full animate-spin"></span>
                    ) : (
                      stats.connectedResidents
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </div>

          <div className="group relative overflow-hidden bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Bell className="w-7 h-7 text-white" />
                  </div>
                  {user && stats.recentAlerts > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{stats.recentAlerts}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Alertas Recientes</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-800 bg-clip-text text-transparent">
                    {stats.loading ? (
                      <span className="inline-block w-8 h-8 border-2 border-yellow-300 border-t-yellow-600 rounded-full animate-spin"></span>
                    ) : (
                      stats.recentAlerts
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-yellow-500 to-amber-600 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </div>
        </div>

        {/* CTA Section */}
        {user ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-400/30 rounded-full blur-3xl"></div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">Sistema de Emergencia</h3>
                  <p className="text-red-50 leading-relaxed max-w-2xl">
                    En caso de emergencia, utiliza el botón de pánico para alertar inmediatamente a las autoridades y a los vecinos de la comunidad.
                  </p>
                </div>
              </div>
              <Link
                href="/residentes/panico"
                className="group inline-flex items-center px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 whitespace-nowrap"
              >
                <AlertTriangle className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                <span>Botón de Pánico</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl"></div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">¿Eres residente de Calle Jerusalén?</h3>
                  <p className="text-blue-50 leading-relaxed max-w-2xl">
                    Únete a nuestra comunidad y accede a todas las herramientas de seguridad, comunicación y monitoreo disponibles para los residentes.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  <span>Registrarse</span>
                </Link>
                <Link
                  href="/login"
                  className="group inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
                >
                  <span>Iniciar Sesión</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Inscripción al Plan de Seguridad */}
        <SecurityPlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            // El modal recargará la página automáticamente
          }}
        />
      </div>
    </div>
  );
};

export default ResidentesPage;
