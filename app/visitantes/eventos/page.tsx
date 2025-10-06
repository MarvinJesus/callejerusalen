'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Search, Filter, Clock, MapPin, Users, Star, Share2, Navigation, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface CommunityEvent {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  type: string;
  organizer: string;
  contact: string;
  image: string;
  maxParticipants?: number;
  requirements: string[];
  highlights: string[];
  isRecurring: boolean;
  recurringPattern?: string;
  order: number;
}

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: any[];
  traditions: any[];
  places: any[];
  events: CommunityEvent[];
  gallery: any[];
  exploreLinks: any[];
  isActive: boolean;
}

const EventsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [eventStats, setEventStats] = useState<{[key: string]: any}>({});
  const [statsLoading, setStatsLoading] = useState(false);

  const categories = [
    'Cultural',
    'Deportivo',
    'Religioso',
    'Educativo',
    'Social',
    'Benéfico',
    'Recreativo',
    'Tradicional',
    'Comunitario',
    'Otros'
  ];

  const eventTypes = [
    'Evento Único',
    'Evento Recurrente',
    'Taller',
    'Conferencia',
    'Festival',
    'Competencia',
    'Celebración',
    'Reunión',
    'Actividad',
    'Otros'
  ];

  useEffect(() => {
    loadHistoryData();
  }, []);

  useEffect(() => {
    if (historyData?.events) {
      loadUserRegistrations();
      loadEventStats();
    }
  }, [historyData]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de historia');
      }

      const data = await response.json();
      setHistoryData(data.historyData);
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRegistrations = async () => {
    // Por ahora, no cargar inscripciones para evitar problemas
    setUserRegistrations([]);
  };

  const loadEventStats = async () => {
    try {
      setStatsLoading(true);
      const stats: {[key: string]: any} = {};
      
      // Cargar estadísticas reales para cada evento
      if (historyData?.events) {
        const statsPromises = historyData.events.map(async (event, index) => {
          try {
            // Usar el índice como eventId para la API
            const response = await fetch(`/api/events/${index}/stats`);
            if (response.ok) {
              const data = await response.json();
              return {
                index,
                confirmedRegistrations: data.confirmedRegistrations || 0,
                totalRegistrations: data.totalRegistrations || 0
              };
            }
          } catch (error) {
            console.error(`Error al cargar estadísticas del evento ${index}:`, error);
          }
          return {
            index,
            confirmedRegistrations: 0,
            totalRegistrations: 0
          };
        });

        const statsResults = await Promise.all(statsPromises);
        
        // Convertir a objeto indexado
        statsResults.forEach(result => {
          stats[result.index] = {
            confirmedRegistrations: result.confirmedRegistrations,
            totalRegistrations: result.totalRegistrations
          };
        });
      }
      
      setEventStats(stats);
    } catch (error) {
      console.error('Error al cargar estadísticas de eventos:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const isUserRegistered = (eventIndex: string) => {
    return userRegistrations.some(reg => reg.eventId === eventIndex && reg.status === 'confirmed');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cultural':
        return '🎭';
      case 'Deportivo':
        return '⚽';
      case 'Religioso':
        return '⛪';
      case 'Educativo':
        return '📚';
      case 'Social':
        return '👥';
      case 'Benéfico':
        return '❤️';
      case 'Recreativo':
        return '🎮';
      case 'Tradicional':
        return '🏛️';
      case 'Comunitario':
        return '🏘️';
      default:
        return '📅';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Evento Único':
        return 'bg-blue-100 text-blue-800';
      case 'Evento Recurrente':
        return 'bg-green-100 text-green-800';
      case 'Taller':
        return 'bg-purple-100 text-purple-800';
      case 'Conferencia':
        return 'bg-orange-100 text-orange-800';
      case 'Festival':
        return 'bg-pink-100 text-pink-800';
      case 'Competencia':
        return 'bg-red-100 text-red-800';
      case 'Celebración':
        return 'bg-yellow-100 text-yellow-800';
      case 'Reunión':
        return 'bg-gray-100 text-gray-800';
      case 'Actividad':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    } catch {
      return dateString;
    }
  };

  const isUpcoming = (dateString: string) => {
    if (!dateString) return true; // Si no hay fecha, considerarlo como próximo
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    } catch {
      return true;
    }
  };

  const filteredEvents = historyData?.events.filter(event => {
    const matchesSearch = (event.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.organizer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || event.category === selectedCategory;
    const matchesType = !selectedType || event.type === selectedType;
    const matchesUpcoming = !showUpcoming || isUpcoming(event.date);
    
    return matchesSearch && matchesCategory && matchesType && matchesUpcoming;
  }) || [];

  // Separar eventos inscritos de no inscritos
  const registeredEvents = filteredEvents.filter((_, index) => isUserRegistered(index.toString()));
  const unregisteredEvents = filteredEvents.filter((_, index) => !isUserRegistered(index.toString()));

  const shareEvent = async (event: CommunityEvent) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error al compartir:', error);
      }
    } else {
      // Fallback: copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('URL copiada al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando eventos y actividades...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Calendar className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar los eventos</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link
                href="/visitantes"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Inicio
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Eventos y Actividades</h1>
                <p className="text-gray-600 mt-1">Participa en los eventos de la comunidad de Calle Jerusalén</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-800"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-800"
              >
                <option value="">Todos los tipos</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                    </option>
                  ))}
                </select>

              <label className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white">
                <input
                  type="checkbox"
                  checked={showUpcoming}
                  onChange={(e) => setShowUpcoming(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Solo próximos</span>
              </label>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Eventos</p>
                <p className="text-2xl font-semibold text-gray-900">{historyData?.events.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Próximos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {historyData?.events.filter(e => isUpcoming(e.date)).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recurrentes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {historyData?.events.filter(e => e.isRecurring).length || 0}
                </p>
              </div>
                  </div>
                  </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mis Inscripciones</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {registeredEvents.length}
                </p>
                      </div>
                    </div>
                  </div>
                </div>
                
        {/* Sección Mis Inscripciones */}
        {registeredEvents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Mis Inscripciones</h2>
                  <p className="text-sm text-gray-600">Eventos a los que estás inscrito</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {registeredEvents.map((event, index) => {
                const originalIndex = historyData?.events.findIndex(e => e === event) || 0;
                const maxParticipants = event.maxParticipants || 100;
                const currentParticipants = eventStats[originalIndex]?.confirmedRegistrations || 0;
                const percentage = maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;
                const spotsLeft = Math.max(0, maxParticipants - currentParticipants);
                
                return (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors">
                    {/* Header compacto */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-green-800 bg-green-200 px-2 py-1 rounded">
                            {getCategoryIcon(event.category)} {event.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                    {event.title}
                  </h3>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                    </div>

                    {/* Información básica compacta */}
                    <div className="space-y-1 mb-3 text-xs text-gray-600">
                      {event.date && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{formatDate(event.date)}</span>
                        </div>
                      )}
                      {event.time && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.time}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar compacto */}
                    {event.maxParticipants && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Cupo disponible</span>
                          <span className="text-xs text-gray-500">
                            {spotsLeft} de {maxParticipants} lugares
                          </span>
                    </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          {statsLoading ? (
                            <div className="h-1.5 bg-gray-300 rounded-full animate-pulse"></div>
                          ) : (
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                percentage >= 90 ? 'bg-red-500' : 
                                percentage >= 70 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          )}
                    </div>
                  </div>
                    )}

                    {/* Botón de acción */}
                    <button
                      onClick={() => router.push(`/visitantes/eventos/${originalIndex}`)}
                      className="w-full inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                    >
                      Ver detalles
                  </button>
                </div>
                );
              })}
              </div>
          </div>
        )}

        {/* Lista de Eventos */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory || selectedType 
                ? 'No se encontraron eventos' 
                : 'No hay eventos disponibles'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory || selectedType 
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'Los eventos se están preparando'
              }
            </p>
            {(searchTerm || selectedCategory || selectedType) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedType('');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => {
              // Usar datos reales de estadísticas
              const maxParticipants = event.maxParticipants || 100;
              const currentParticipants = eventStats[index]?.confirmedRegistrations || 0;
              const percentage = maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;
              const spotsLeft = Math.max(0, maxParticipants - currentParticipants);
              const isRegistered = isUserRegistered(index.toString());
              
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Imagen */}
                  {event.image && (
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {event.isRecurring && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Recurrente
                          </span>
                        )}
                        {isRegistered && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Inscrito
                          </span>
                        )}
                      </div>
          </div>
        )}

                  {/* Contenido */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {getCategoryIcon(event.category)} {event.category}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                      </div>
                      <button
                        onClick={() => shareEvent(event)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                        title="Compartir evento"
                      >
                        <Share2 className="w-4 h-4" />
            </button>
          </div>

                    {/* Información básica */}
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      {event.date && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{formatDate(event.date)}</span>
                        </div>
                      )}
                      {event.time && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar de Cupo */}
                    {event.maxParticipants && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Cupo disponible</span>
                          <span className="text-sm text-gray-500">
                            {spotsLeft} de {maxParticipants} lugares disponibles
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          {statsLoading ? (
                            <div className="h-2 bg-gray-300 rounded-full animate-pulse"></div>
                          ) : (
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                percentage >= 90 ? 'bg-red-500' : 
                                percentage >= 70 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {percentage.toFixed(0)}% ocupado
                          </span>
                          <span className={`text-xs font-medium ${
                            spotsLeft === 0 ? 'text-red-600' :
                            spotsLeft <= 5 ? 'text-red-600' : 
                            spotsLeft <= 15 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {spotsLeft === 0 ? 'Sin cupo disponible' :
                             spotsLeft <= 5 ? '¡Últimos lugares!' : 
                             spotsLeft <= 15 ? 'Pocos lugares' : 
                             'Disponible'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Descripción */}
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                      {event.description}
                    </p>

                    {/* Destacados */}
                    {event.highlights && event.highlights.length > 0 && (
                      <div className="mb-4">
                        <div className="space-y-1">
                          {(event.highlights || []).slice(0, 2).map((highlight, highlightIndex) => (
                            <div key={highlightIndex} className="flex items-start">
                              <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2"></div>
                              <span className="text-xs text-gray-600 line-clamp-1">{highlight}</span>
                            </div>
                          ))}
                          {event.highlights.length > 2 && (
                            <p className="text-xs text-gray-500 ml-3.5">
                              +{event.highlights.length - 2} más...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center text-xs text-gray-500">
                        {event.organizer && (
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {event.organizer}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/visitantes/eventos/${index}`)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 transition-colors"
                      >
                        Ver detalles
            </button>
          </div>
        </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;