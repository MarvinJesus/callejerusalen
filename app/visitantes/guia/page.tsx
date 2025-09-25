'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Shield, 
  Heart,
  Info,
  AlertTriangle,
  CheckCircle,
  Star,
  Navigation,
  Calendar,
  Wifi,
  ParkingCircle
} from 'lucide-react';

const VisitorsGuidePage: React.FC = () => {
  const { user, userProfile } = useAuth();

  const guideSections = [
    {
      title: 'Bienvenida',
      icon: <Heart className="w-6 h-6" />,
      content: [
        '¡Bienvenido a Calle Jerusalén!',
        'Somos una comunidad unida que valora la seguridad, la convivencia y el bienestar de todos.',
        'Esta guía te ayudará a conocer mejor nuestra comunidad y aprovechar al máximo tu visita.'
      ]
    },
    {
      title: 'Información General',
      icon: <Info className="w-6 h-6" />,
      content: [
        'Ubicación: Calle Jerusalén #123, Colonia Centro',
        'Horarios de atención: Lunes a Viernes 8:00 AM - 6:00 PM',
        'Área total: 15 hectáreas de desarrollo comunitario',
        'Población: 150+ familias residentes'
      ]
    },
    {
      title: 'Servicios Disponibles',
      icon: <Users className="w-6 h-6" />,
      content: [
        'Administración comunitaria con atención personalizada',
        'Servicios de seguridad 24/7',
        'Mantenimiento y limpieza de áreas comunes',
        'WiFi gratuito en áreas públicas',
        'Estacionamiento para visitantes'
      ]
    },
    {
      title: 'Reglas y Normas',
      icon: <Shield className="w-6 h-6" />,
      content: [
        'Respeta el horario de silencio: 10:00 PM - 7:00 AM',
        'Mantén las áreas comunes limpias',
        'Estaciona solo en espacios designados',
        'Los menores deben estar acompañados por un adulto',
        'Está prohibido el consumo de alcohol en espacios públicos'
      ]
    },
    {
      title: 'Emergencias',
      icon: <AlertTriangle className="w-6 h-6" />,
      content: [
        'Seguridad: +1 (555) 911-0000',
        'Emergencias médicas: 911',
        'Administración: +1 (555) 911-0002',
        'Mantenimiento: +1 (555) 911-0001',
        'Todos los números están disponibles 24/7'
      ]
    }
  ];

  const amenities = [
    {
      name: 'WiFi Gratuito',
      description: 'Conexión a internet en todas las áreas comunes',
      icon: <Wifi className="w-6 h-6" />,
      available: true
    },
    {
      name: 'Estacionamiento',
      description: 'Espacios designados para visitantes',
      icon: <ParkingCircle className="w-6 h-6" />,
      available: true
    },
    {
      name: 'Áreas de Descanso',
      description: 'Bancas y espacios sombreados',
      icon: <Users className="w-6 h-6" />,
      available: true
    },
    {
      name: 'Baños Públicos',
      description: 'Instalaciones sanitarias en áreas comunes',
      icon: <MapPin className="w-6 h-6" />,
      available: true
    }
  ];

  const tips = [
    {
      title: 'Planifica tu visita',
      description: 'Revisa los horarios de los lugares que quieres visitar',
      icon: <Clock className="w-5 h-5" />
    },
    {
      title: 'Usa el mapa interactivo',
      description: 'Navega fácilmente por la comunidad con nuestra herramienta de mapas',
      icon: <Navigation className="w-5 h-5" />
    },
    {
      title: 'Consulta los eventos',
      description: 'Mantente al día con las actividades comunitarias',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      title: 'Respeta las normas',
      description: 'Ayúdanos a mantener un ambiente agradable para todos',
      icon: <Shield className="w-5 h-5" />
    }
  ];

  // Permitir acceso a todos los usuarios (incluyendo visitantes no registrados)
  // No hay restricciones de acceso para la guía de visitantes

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Guía para Visitantes
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Todo lo que necesitas saber para disfrutar al máximo tu visita a nuestra comunidad.
          </p>
        </div>

        {/* Secciones de la guía */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {guideSections.map((section, index) => (
            <div key={index} className="card-theme">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-2">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Comodidades */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Comodidades Disponibles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {amenities.map((amenity, index) => (
              <div key={index} className="card-theme text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  {amenity.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {amenity.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {amenity.description}
                </p>
                <div className="flex items-center justify-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Disponible</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consejos útiles */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Consejos Útiles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="card-theme">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                    {tip.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tip.title}
                    </h3>
                    <p className="text-gray-600">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enlaces rápidos */}
        <div className="card-theme">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Enlaces Rápidos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/visitantes/lugares" 
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <MapPin className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-blue-900">Lugares</span>
            </Link>
            <Link 
              href="/visitantes/servicios" 
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <Users className="w-6 h-6 text-green-600" />
              <span className="font-medium text-green-900">Servicios</span>
            </Link>
            <Link 
              href="/visitantes/eventos" 
              className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200"
            >
              <Calendar className="w-6 h-6 text-orange-600" />
              <span className="font-medium text-orange-900">Eventos</span>
            </Link>
            <Link 
              href="/visitantes/contacto" 
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
            >
              <Phone className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-purple-900">Contacto</span>
            </Link>
          </div>
        </div>

        {/* Información de contacto de emergencia */}
        <div className="mt-12 card-theme bg-red-50 border-red-200">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <h3 className="text-2xl font-semibold text-red-900">
              Contacto de Emergencia
            </h3>
          </div>
          <p className="text-red-800 mb-4">
            En caso de emergencia, contacta inmediatamente a:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Seguridad</h4>
              <p className="text-2xl font-bold text-red-600">+1 (555) 911-0000</p>
              <p className="text-sm text-gray-600">Disponible 24/7</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Administración</h4>
              <p className="text-2xl font-bold text-red-600">+1 (555) 911-0002</p>
              <p className="text-sm text-gray-600">Lunes a Viernes 8:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorsGuidePage;
