'use client';

import Navbar from '@/components/Navbar';
import RealStats from '@/components/RealStats';
import HeroStats from '@/components/HeroStats';
import { useRealStats } from '@/hooks/useRealStats';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Shield, Eye, Users, Camera, AlertTriangle, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import React, { useEffect, useState } from 'react';
import SimpleMapComponent from '@/components/SimpleMapComponent';

export default function HomePage() {
  const { userProfile, loginAsGuest, isGuest } = useAuth();
  const { totalUsers } = useRealStats();
  const [emergency, setEmergency] = useState<null | {
    title: string;
    subtitle?: string;
    description: string;
    safeAreaName: string;
    safeAreaAddress?: string;
    imageUrl?: string;
    tips: string[];
    instructions: string[];
    map: { lat: number; lng: number; zoom?: number };
    isActive: boolean;
  }>(null);

  useEffect(() => {
    const loadEmergency = async () => {
      try {
        const res = await fetch('/api/emergency', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.emergency) setEmergency(data.emergency);
      } catch (e) {
        console.error('Error cargando info de emergencia:', e);
      }
    };
    loadEmergency();
  }, []);

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-green-50"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                <MapPin className="w-4 h-4 mr-2" />
                Calle Jerusalén, Heredia
              </div>
              
              {/* Mobile-only large image for better visibility */}
              <div className="flex justify-center mb-4 md:hidden">
                <Image
                  src="/arboljerusalen.png"
                  alt="Árbol Calle Jerusalén"
                  width={160}
                  height={160}
                  className="h-28 w-28 object-contain"
                  priority
                />
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-5 mb-6">
                <Image
                  src="/arboljerusalen.png"
                  alt="Árbol Calle Jerusalén"
                  width={128}
                  height={128}
                  className="hidden md:block md:h-24 md:w-24 lg:h-28 lg:w-28 object-contain flex-shrink-0"
                  priority
                />
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Bienvenido a{' '}
                  <span className="text-primary-600 relative">
                    Calle Jerusalén
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-primary-200 rounded-full"></div>
                  </span>
                </h1>
              </div>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Tu plataforma comunitaria digital para conectar residentes y visitantes. 
                Descubre lugares únicos, servicios locales, mantente informado y contribuye a la seguridad de la comunidad.
              </p>
              
              {/* Quick stats */}
              <HeroStats />
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {!userProfile ? (
                  <>
                    <Link href="/login" className="btn-theme-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all">
                      Iniciar Sesión
                    </Link>
                    <Link href="/visitantes/lugares" className="btn-theme-secondary text-lg px-8 py-3">
                      Explorar Lugares
                    </Link>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg text-gray-600">
                      ¡Bienvenido de vuelta, {userProfile.displayName}!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {userProfile.role === 'visitante' && (
                        <Link href="/visitantes" className="btn-theme-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all">
                          Explorar Comunidad
                        </Link>
                      )}
                      {userProfile.role === 'comunidad' && (
                        <Link href="/residentes/camaras" className="btn-theme-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all">
                          Ver Cámaras
                        </Link>
                      )}
                      {(userProfile.role === 'admin' || userProfile.role === 'super_admin') && (
                        <Link href="/admin/admin-dashboard" className="btn-theme-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all">
                          Panel de Administración
                        </Link>
                      )}
                      <Link href="/mapa" className="btn-theme-secondary text-lg px-8 py-3">
                        Ver Mapa
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right content - Interactive preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Vista Previa del Mapa</h3>
                  <Link href="/mapa" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Ver completo →
                  </Link>
                </div>
                
                {/* Mini map preview */}
                <div className="relative h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                  <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium">
                    C. Jerusalén
                  </div>
                  <div className="absolute bottom-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm">
                    Street View
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Lugares activos
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Servicios
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center animate-bounce">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Acceso Rápido
            </h2>
            <p className="text-lg text-gray-600">
              Encuentra lo que necesitas de manera rápida y fácil
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/visitantes/lugares" className="group">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group-hover:border-primary-200">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Lugares</h3>
                <p className="text-gray-600 text-sm">Descubre miradores, pulperías y sitios de interés</p>
                <div className="mt-4 text-primary-600 text-sm font-medium group-hover:text-primary-700">
                  Explorar →
                </div>
              </div>
            </Link>
            
            <Link href="/visitantes/servicios" className="group">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group-hover:border-primary-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Servicios</h3>
                <p className="text-gray-600 text-sm">Encuentra servicios locales y comunitarios</p>
                <div className="mt-4 text-primary-600 text-sm font-medium group-hover:text-primary-700">
                  Ver servicios →
                </div>
              </div>
            </Link>
            
            <Link href="/mapa" className="group">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group-hover:border-primary-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mapa Interactivo</h3>
                <p className="text-gray-600 text-sm">Navega por la comunidad con Street View</p>
                <div className="mt-4 text-primary-600 text-sm font-medium group-hover:text-primary-700">
                  Ver mapa →
                </div>
              </div>
            </Link>
            
            <Link href="/visitantes/eventos" className="group">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group-hover:border-primary-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Camera className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Eventos</h3>
                <p className="text-gray-600 text-sm">Participa en actividades comunitarias</p>
                <div className="mt-4 text-primary-600 text-sm font-medium group-hover:text-primary-700">
                  Ver eventos →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Características de la Plataforma
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Para Visitantes */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-primary-200">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Para Visitantes
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Descubre lugares únicos, servicios locales y mantente conectado con la comunidad.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                    Lugares de recreación
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                    Servicios locales
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                    Mapa interactivo
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                    Street View
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link href="/visitantes" className="text-primary-600 hover:text-primary-700 text-sm font-medium group-hover:underline">
                    Explorar como visitante →
                  </Link>
                </div>
              </div>
            </div>

            {/* Para Residentes */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-green-200">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Para Residentes
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Acceso completo a herramientas de seguridad y alertas comunitarias.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Cámaras de seguridad
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Botón de pánico
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Alertas comunitarias
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Monitoreo 24/7
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link href="/residentes" className="text-green-600 hover:text-green-700 text-sm font-medium group-hover:underline">
                    Acceder como residente →
                  </Link>
                </div>
              </div>
            </div>

            {/* Comunidad */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-blue-200">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Comunidad
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Conecta con tus vecinos y construye una comunidad más unida y segura.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Red social local
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Eventos comunitarios
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Noticias del barrio
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Foros de discusión
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link href="/visitantes/eventos" className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline">
                    Ver actividades →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-primary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Nuestra Comunidad en Números
            </h2>
            <p className="text-xl text-white opacity-90 max-w-2xl mx-auto">
              Una comunidad activa, segura y conectada que crece cada día
            </p>
          </div>
          
          <RealStats />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-8">
              <UserPlus className="w-10 h-10 text-primary-600" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              ¿Listo para ser parte de la comunidad?
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Únete a nuestra plataforma comunitaria y descubre todo lo que Calle Jerusalén tiene para ofrecer. 
              Conecta con vecinos, explora lugares únicos y mantente seguro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!userProfile ? (
                <>
                  <Link href="/register" className="btn-theme-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all">
                    Registrarse Ahora
                  </Link>
                  <Link href="/login" className="btn-theme-secondary text-lg px-8 py-4">
                    Iniciar Sesión
                  </Link>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-gray-600">
                    ¡Ya eres parte de la comunidad!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/visitantes" className="btn-theme-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all">
                      Explorar Comunidad
                    </Link>
                    <Link href="/mapa" className="btn-theme-secondary text-lg px-8 py-4">
                      Ver Mapa
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <Shield className="w-5 h-5 mr-2 text-green-500" />
                  <span>100% Seguro</span>
                </div>
                <div className="flex items-center justify-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{totalUsers > 0 ? `${totalUsers} Miembros` : 'Cargando...'}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Eye className="w-5 h-5 mr-2 text-purple-500" />
                  <span>24/7 Disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Safe Area Section */}
      {emergency?.isActive && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-red-50 border-y border-red-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <AlertTriangle className="w-7 h-7 text-red-600" />
              <h2 className="text-3xl font-bold text-red-900 text-center">{emergency.title}</h2>
            </div>
            {emergency.subtitle && (
              <p className="text-center text-red-800 mb-6">{emergency.subtitle}</p>
            )}

            {/* Imagen y contenido en dos columnas */}
            <div className="grid md:grid-cols-2 gap-8 items-start mb-8">
              <div className="space-y-4">
                {emergency.imageUrl ? (
                  <img src={emergency.imageUrl} alt="Área segura" className="w-full h-64 object-cover rounded-lg border" />
                ) : (
                  <div className="w-full h-64 rounded-lg border bg-white flex items-center justify-center text-gray-400">Imagen del área segura</div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-gray-800 leading-relaxed">{emergency.description}</p>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-gray-900">{emergency.safeAreaName}</span>
                  </div>
                  {emergency.safeAreaAddress && (
                    <p className="text-sm text-gray-600">{emergency.safeAreaAddress}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Coordenadas: {emergency.map.lat.toFixed(6)}, {emergency.map.lng.toFixed(6)}</p>
                </div>

                {emergency.tips?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Consejos</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {emergency.tips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {emergency.instructions?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Indicaciones</h3>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                      {emergency.instructions.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Mapa en fila completa */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación del Área Segura</h3>
              <div className="w-full h-[500px] rounded-lg border overflow-hidden">
                <SimpleMapComponent
                  center={[emergency.map.lat, emergency.map.lng]}
                  zoom={emergency.map.zoom || 16}
                  height="100%"
                  points={[{
                    id: 'safe-area',
                    name: emergency.safeAreaName,
                    type: 'alert',
                    coordinates: [emergency.map.lat, emergency.map.lng],
                    description: emergency.description,
                    address: emergency.safeAreaAddress || undefined,
                  }]}
                  showControls={true}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer-theme py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-6 h-6 text-primary-400" />
                <span className="text-xl font-bold">Calle Jerusalén</span>
              </div>
              <p className="text-gray-400">
                Plataforma comunitaria digital para conectar residentes y visitantes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Registrarse</Link></li>
                <li><Link href="/visitantes/lugares" className="hover:text-white transition-colors">Lugares</Link></li>
                <li><Link href="/visitantes/servicios" className="hover:text-white transition-colors">Servicios</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <div className="space-y-2 text-gray-400">
                <p>📧 info@callejerusalen.com</p>
                <p>📞 +1 (555) 123-4567</p>
                <p>📍 Calle Jerusalén, Ciudad</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Calle Jerusalén. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

