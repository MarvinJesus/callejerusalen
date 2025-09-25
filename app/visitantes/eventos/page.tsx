'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, MapPin, Users, Filter, Search } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  maxAttendees: number;
  currentAttendees: number;
  image: string;
  isRecurring: boolean;
  organizer: string;
}

const EventsPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'social', label: 'Social' },
    { value: 'deportivo', label: 'Deportivo' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'educativo', label: 'Educativo' },
    { value: 'recreativo', label: 'Recreativo' }
  ];

  // Datos de ejemplo para eventos
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Feria Comunitaria Primaveral',
      description: 'Gran feria con stands de comida, artesanías locales y actividades para toda la familia.',
      date: '2024-03-15',
      time: '10:00 AM - 6:00 PM',
      location: 'Parque Central',
      category: 'social',
      maxAttendees: 500,
      currentAttendees: 245,
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      isRecurring: false,
      organizer: 'Comité de Eventos'
    },
    {
      id: '2',
      title: 'Torneo de Fútbol Comunitario',
      description: 'Torneo de fútbol 7 para todas las edades. Inscripciones abiertas.',
      date: '2024-03-20',
      time: '8:00 AM - 5:00 PM',
      location: 'Cancha de Fútbol',
      category: 'deportivo',
      maxAttendees: 80,
      currentAttendees: 32,
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
      isRecurring: false,
      organizer: 'Club Deportivo Local'
    },
    {
      id: '3',
      title: 'Noche de Cine al Aire Libre',
      description: 'Proyección de película familiar en el parque. Trae tu manta y disfruta.',
      date: '2024-03-25',
      time: '7:30 PM - 10:00 PM',
      location: 'Parque Central',
      category: 'recreativo',
      maxAttendees: 200,
      currentAttendees: 89,
      image: 'https://images.unsplash.com/photo-1489599856878-46f6b2b5c6e9?w=400',
      isRecurring: true,
      organizer: 'Cine Club Comunitario'
    },
    {
      id: '4',
      title: 'Taller de Jardinería',
      description: 'Aprende técnicas básicas de jardinería y cuidado de plantas.',
      date: '2024-03-28',
      time: '2:00 PM - 4:00 PM',
      location: 'Jardín Botánico',
      category: 'educativo',
      maxAttendees: 25,
      currentAttendees: 18,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      isRecurring: false,
      organizer: 'Grupo Ecológico'
    },
    {
      id: '5',
      title: 'Concierto de Música Local',
      description: 'Presentación de bandas locales con diferentes géneros musicales.',
      date: '2024-04-05',
      time: '6:00 PM - 9:00 PM',
      location: 'Plaza Cultural',
      category: 'cultural',
      maxAttendees: 150,
      currentAttendees: 67,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      isRecurring: false,
      organizer: 'Asociación Musical'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setEvents(sampleEvents);
      setFilteredEvents(sampleEvents);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = events;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedCategory]);

  // Permitir acceso a todos los usuarios (incluyendo visitantes no registrados)
  // No hay restricciones de acceso para la página de eventos

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      social: 'bg-blue-100 text-blue-800',
      deportivo: 'bg-green-100 text-green-800',
      cultural: 'bg-purple-100 text-purple-800',
      educativo: 'bg-yellow-100 text-yellow-800',
      recreativo: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || category;
  };

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Eventos Comunitarios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre y participa en los eventos que organiza nuestra comunidad. 
            ¡Hay algo para todos!
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="card-theme mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="input-container">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-theme pl-10"
                />
              </div>
            </div>

            {/* Filtro por categoría */}
            <div className="md:w-64">
              <div className="input-container">
                <Filter className="input-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-theme pl-10 appearance-none"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de eventos */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-theme animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <div key={event.id} className="card-theme overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                      {getCategoryLabel(event.category)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    {event.isRecurring && (
                      <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Recurrente
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white bg-opacity-90 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{event.currentAttendees} / {event.maxAttendees} asistentes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors duration-300">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="space-y-3 text-sm text-gray-500 mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      <span className="capitalize">{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary-500" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span>{event.location}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Organizado por: {event.organizer}
                    </div>
                  </div>
                  
                  <button className="w-full btn-theme-primary">
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron eventos
            </h3>
            <p className="text-gray-600">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="card-theme">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ¿Quieres organizar un evento?
            </h3>
            <p className="text-gray-600 mb-6">
              Si tienes una idea para un evento comunitario, contáctanos y te ayudaremos a organizarlo.
            </p>
            <button className="btn-theme-primary">
              Contactar Administración
            </button>
          </div>

          <div className="card-theme">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recibe notificaciones
            </h3>
            <p className="text-gray-600 mb-6">
              Mantente al día con los próximos eventos. Regístrate para recibir notificaciones.
            </p>
            <button className="btn-theme-secondary">
              Suscribirse a Eventos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
