'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  Star,
  ArrowRight,
  Heart,
  Shield,
  Calendar,
  Navigation,
  Info,
  Camera,
  TreePine,
  Store,
  Mountain,
  BookOpen,
  Eye,
  Compass
} from 'lucide-react';

const VisitorsHomePage: React.FC = () => {
  const { user, userProfile } = useAuth();

  // Estado para indicadores reales
  const [stats, setStats] = useState({
    totalPlaces: 0,
    pulperias: 0,
    miradores: 0,
    zonasVerdes: 0,
    loading: true,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));
        const response = await fetch('/api/places');
        if (!response.ok) throw new Error('Error al cargar lugares');
        const data = await response.json();
        const places = Array.isArray(data?.places) ? data.places : [];

        const totalPlaces = places.length;
        const pulperias = places.filter((p: any) => (p.category || '').toLowerCase() === 'pulperias').length;
        const miradores = places.filter((p: any) => (p.category || '').toLowerCase() === 'miradores').length;
        const zonasVerdes = places.filter((p: any) => {
          const c = (p.category || '').toLowerCase();
          return c === 'parques' || c === 'naturaleza';
        }).length;

        setStats({ totalPlaces, pulperias, miradores, zonasVerdes, loading: false });
      } catch (e) {
        console.error('Error cargando indicadores reales /visitantes:', e);
        setStats({ totalPlaces: 0, pulperias: 0, miradores: 0, zonasVerdes: 0, loading: false });
      }
    };
    loadStats();
  }, []);

  const quickActions = [
    {
      title: 'Explorar Lugares',
      description: 'Descubre parques, miradores, pulperías y espacios únicos de Calle Jerusalén',
      icon: <MapPin className="w-8 h-8" />,
      href: '/visitantes/lugares',
      color: 'bg-blue-500'
    },
    {
      title: 'Historia y Cultura',
      description: 'Conoce la rica historia y tradiciones de nuestra comunidad',
      icon: <BookOpen className="w-8 h-8" />,
      href: '/visitantes/historia',
      color: 'bg-amber-500'
    },
    {
      title: 'Servicios Locales',
      description: 'Encuentra pulperías, restaurantes, transporte y servicios esenciales',
      icon: <Store className="w-8 h-8" />,
      href: '/visitantes/servicios',
      color: 'bg-green-500'
    },
    {
      title: 'Eventos y Actividades',
      description: 'Participa en eventos comunitarios y actividades culturales',
      icon: <Calendar className="w-8 h-8" />,
      href: '/visitantes/eventos',
      color: 'bg-orange-500'
    },
    {
      title: 'Guía del Visitante',
      description: 'Todo lo que necesitas saber para tu visita a Calle Jerusalén',
      icon: <Compass className="w-8 h-8" />,
      href: '/visitantes/guia',
      color: 'bg-purple-500'
    },
    {
      title: 'Contacto',
      description: 'Ponte en contacto con la administración comunitaria',
      icon: <Phone className="w-8 h-8" />,
      href: '/visitantes/contacto',
      color: 'bg-red-500'
    }
  ];

  const communityStats = [
    { label: 'Lugares de Interés', value: stats.totalPlaces.toString(), icon: <MapPin className="w-5 h-5" /> },
    { label: 'Servicios', value: stats.pulperias.toString(), icon: <Store className="w-5 h-5" /> },
    { label: 'Miradores Naturales', value: stats.miradores.toString(), icon: <Mountain className="w-5 h-5" /> },
    { label: 'Zonas Verdes', value: stats.zonasVerdes.toString(), icon: <TreePine className="w-5 h-5" /> }
  ];

  const upcomingEvents = [
    {
      title: 'Feria Artesanal de Calle Jerusalén',
      date: '15 de Marzo',
      time: '10:00 AM',
      location: 'Plaza Central',
      type: 'evento'
    },
    {
      title: 'Tour Histórico Guiado',
      date: '20 de Marzo',
      time: '2:00 PM',
      location: 'Punto de Encuentro: Mirador Principal',
      type: 'turismo'
    },
    {
      title: 'Noche de Cuentos Tradicionales',
      date: '25 de Marzo',
      time: '7:00 PM',
      location: 'Casa Cultural',
      type: 'cultural'
    }
  ];

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Descubre{' '}
              <span className="text-primary-600">Calle Jerusalén</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Una comunidad llena de historia, tradición y belleza natural. Explora nuestros miradores, 
              conoce nuestras pulperías tradicionales y sumérgete en la cultura local.
            </p>
            
          </div>

          {/* Estadísticas de la comunidad */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {communityStats.map((stat, index) => (
              <div key={index} className="card-theme text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 text-primary-600">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            ¿Qué te gustaría hacer?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="card-theme hover:shadow-xl transition-all duration-300 group"
              >
                <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {action.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {action.description}
                </p>
                <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                  <span>Explorar</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Próximos Eventos */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Próximos Eventos
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="card-theme">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.date} - {event.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Navigation className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        event.type === 'evento' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'turismo' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {event.type === 'evento' ? 'Evento' :
                         event.type === 'turismo' ? 'Tour' : 'Cultural'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Información Útil */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Información Útil
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Horarios */}
            <div className="card-theme">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Horarios de Atención
              </h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Lunes - Viernes:</span>
                  <span>8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sábados:</span>
                  <span>9:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Domingos:</span>
                  <span>Cerrado</span>
                </div>
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="card-theme">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Emergencias
              </h3>
              <div className="space-y-2 text-gray-600">
                <div>
                  <span className="font-medium">Seguridad:</span>
                  <br />
                  <span className="text-red-600 font-bold">+1 (555) 911-0000</span>
                </div>
                <div>
                  <span className="font-medium">Administración:</span>
                  <br />
                  <span className="text-primary-600">+1 (555) 911-0002</span>
                </div>
              </div>
            </div>

            {/* Información General */}
            <div className="card-theme">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Información General
              </h3>
              <div className="space-y-2 text-gray-600">
                <div>
                  <span className="font-medium">Dirección:</span>
                  <br />
                  <span>Calle Jerusalén #123</span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <br />
                  <span>info@callejerusalen.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-6">
            ¡Explora Calle Jerusalén!
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Descubre todos los lugares únicos, servicios locales y eventos que nuestra comunidad tiene para ofrecer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/visitantes/lugares" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
              Explorar Lugares
            </Link>
            <Link href="/visitantes/contacto" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
              Más Información
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VisitorsHomePage;
