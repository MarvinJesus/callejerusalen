'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Clock, MapPin, Users, Share2, Star, Navigation, Phone, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
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

const EventDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationStats, setRegistrationStats] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [userRegistrationStatus, setUserRegistrationStatus] = useState<string | null>(null);
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);

  useEffect(() => {
    loadHistoryData();
  }, []);

  useEffect(() => {
    if (event) {
      loadRegistrationStats();
      checkUserRegistration();
    }
  }, [event]);

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
      
      // Buscar el evento específico
      const eventIndex = parseInt(params.id as string);
      if (data.historyData.events && data.historyData.events[eventIndex]) {
        setEvent(data.historyData.events[eventIndex]);
      } else {
        setError('Evento no encontrado');
      }
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrationStats = async () => {
    if (!event) return;
    
    try {
      const response = await fetch(`/api/events/${params.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Datos de estadísticas recibidos:', data);
        // La API devuelve las estadísticas directamente, no anidadas bajo 'stats'
        setRegistrationStats(data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas de inscripción:', error);
    }
  };

  const checkUserRegistration = async () => {
    if (!event || !user) return;
    
    try {
      // Usar el ID real del usuario autenticado
      const userId = user.uid;
      
      // Verificar el estado real de inscripción usando la API
      console.log(`🔍 Verificando inscripción del usuario ${userId} al evento ${params.id}`);
      const response = await fetch(`/api/events/${params.id}/register?userId=${userId}`);
      console.log(`📡 Respuesta de API:`, response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Datos de respuesta:`, data);
        
        // Obtener el estado completo de la inscripción
        const registrationStatus = data.registrationStatus || null;
        const isUserRegistered = Boolean(data.isRegistered);
        
        setUserRegistrationStatus(registrationStatus);
        setIsRegistered(isUserRegistered);
        
        console.log(`✅ Estado actualizado - Usuario inscrito en evento ${params.id}:`, isUserRegistered);
        console.log(`📋 Estado de inscripción:`, registrationStatus);
        console.log(`🔍 Tipo de dato:`, typeof isUserRegistered);
      } else {
        console.error(`❌ Error en API: ${response.status} ${response.statusText}`);
        // En caso de error de API, mantener el estado actual
        console.log(`⚠️ Manteniendo estado actual - Usuario inscrito en evento ${params.id}:`, isRegistered);
      }
    } catch (error) {
      console.error('Error al verificar inscripción del usuario:', error);
      // En caso de error, mantener el estado actual
      console.log(`⚠️ Error en verificación - Manteniendo estado actual:`, isRegistered);
    }
  };

  const handleRegistration = async () => {
    if (!event || !user) return;
    
    // Si el usuario está inscrito, mostrar confirmación antes de desinscribirse
    if (isRegistered) {
      setShowUnregisterConfirm(true);
      return;
    }
    
    // Si no está inscrito, proceder directamente con la inscripción
    await processRegistration();
  };

  const processRegistration = async () => {
    if (!event || !user) return;
    
    try {
      setRegistrationLoading(true);
      
      // Usar datos reales del usuario autenticado
      const userId = user.uid;
      const userEmail = user.email || '';
      const userName = user.displayName || user.email || 'Usuario';
      
      if (isRegistered) {
        // Desinscribir
        const response = await fetch(`/api/events/${params.id}/register`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
        
        if (response.ok) {
          console.log('✅ Desinscripción exitosa, actualizando estado...');
          // Actualizar estado inmediatamente
          setIsRegistered(false);
          // Pequeño delay para asegurar que la base de datos se actualice
          await new Promise(resolve => setTimeout(resolve, 500));
          // Recargar estadísticas
          await loadRegistrationStats();
          // Verificar estado real desde la API
          await checkUserRegistration();
          console.log('🔄 Estado actualizado después de desinscripción');
          alert('Te has desinscrito del evento exitosamente');
        } else {
          const errorData = await response.json();
          console.error('❌ Error en desinscripción:', errorData);
          alert(errorData.error || 'Error al desinscribirse del evento');
        }
      } else {
        // Inscribir
        const response = await fetch(`/api/events/${params.id}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, userEmail, userName }),
        });
        
        if (response.ok) {
          console.log('✅ Inscripción exitosa, actualizando estado...');
          // Actualizar estado inmediatamente
          setIsRegistered(true);
          // Pequeño delay para asegurar que la base de datos se actualice
          await new Promise(resolve => setTimeout(resolve, 500));
          // Recargar estadísticas
          await loadRegistrationStats();
          // Verificar estado real desde la API
          await checkUserRegistration();
          console.log('🔄 Estado actualizado después de inscripción');
          alert('Te has inscrito al evento exitosamente');
        } else {
          const errorData = await response.json();
          console.error('❌ Error en inscripción:', errorData);
          alert(errorData.error || 'Error al inscribirse al evento');
        }
      }
    } catch (error) {
      console.error('Error al manejar inscripción:', error);
      alert('Error al procesar la inscripción');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const confirmUnregister = async () => {
    setShowUnregisterConfirm(false);
    await processRegistration();
  };

  const cancelUnregister = () => {
    setShowUnregisterConfirm(false);
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

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const isUpcoming = (dateString: string) => {
    if (!dateString) return true;
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    } catch {
      return true;
    }
  };

  const shareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
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

  const openMaps = () => {
    if (event?.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando evento...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Calendar className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Evento no encontrado</h2>
            <p className="text-gray-600 mb-4">{error || 'El evento que buscas no existe'}</p>
            <Link
              href="/visitantes/eventos"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Link>
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
                href="/visitantes/eventos"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver a Eventos
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{event.title}</h1>
                <p className="text-gray-600 mt-1">Evento de la comunidad de Calle Jerusalén</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {event.location && (
                <button
                  onClick={openMaps}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ver en mapa
                </button>
              )}
              <button
                onClick={shareEvent}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            {/* Imagen */}
            {event.image && (
              <div className="mb-8">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Información Principal */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {getCategoryIcon(event.category)} {event.category}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(event.type)}`}>
                  {event.type}
                </span>
                {event.isRecurring && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Star className="w-4 h-4 mr-1" />
                    Recurrente
                  </span>
                )}
                {isUpcoming(event.date) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Próximo
                  </span>
                )}
                {isRegistered && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Inscrito
                  </span>
                )}
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sobre este evento</h2>
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Puntos Destacados */}
            {event.highlights && event.highlights.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-primary-600" />
                  Puntos Destacados
                </h3>
                <div className="space-y-4">
                  {event.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requisitos de Participación */}
            {event.requirements && event.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-primary-600" />
                  Requisitos de Participación
                </h3>
                <div className="space-y-3">
                  {event.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{requirement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Información del Evento */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Evento</h3>
              <div className="space-y-4">
                {event.date && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fecha</p>
                      <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                    </div>
                  </div>
                )}
                {event.time && (
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Hora</p>
                      <p className="text-sm text-gray-600">{formatTime(event.time)}</p>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ubicación</p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                    </div>
                  </div>
                )}
                {event.organizer && (
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Organizador</p>
                      <p className="text-sm text-gray-600">{event.organizer}</p>
                    </div>
                  </div>
                )}
                {event.maxParticipants && (
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Participantes</p>
                      <p className="text-sm text-gray-600">Máximo {event.maxParticipants}</p>
                    </div>
                  </div>
                )}
                {event.isRecurring && event.recurringPattern && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Recurrencia</p>
                      <p className="text-sm text-gray-600">{event.recurringPattern}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disponibilidad de Cupo */}
            {event.maxParticipants && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary-600" />
                  Disponibilidad de Cupo
                </h3>
                {(() => {
                  // Usar datos reales de inscripciones
                  const maxParticipants = event.maxParticipants;
                  const currentParticipants = registrationStats?.confirmedRegistrations || 0;
                  const percentage = maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;
                  const spotsLeft = maxParticipants - currentParticipants;
                  
                  // Debug logging
                  console.log(`🔍 Debug del botón - Evento ${params.id}:`);
                  console.log(`  maxParticipants: ${maxParticipants}`);
                  console.log(`  currentParticipants: ${currentParticipants}`);
                  console.log(`  spotsLeft: ${spotsLeft}`);
                  console.log(`  isRegistered: ${isRegistered}`);
                  console.log(`  Texto del botón: ${spotsLeft <= 0 ? 'Evento lleno' : isRegistered ? 'Desinscribirse del evento' : spotsLeft <= 5 ? '¡Inscribirse ahora!' : 'Inscribirse al evento'}`);
                  
                  return (
                    <div className="space-y-4">
                      {/* Estadísticas principales */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{maxParticipants}</div>
                          <div className="text-sm text-gray-600">Capacidad Total</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{currentParticipants}</div>
                          <div className="text-sm text-gray-600">Inscritos</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`text-2xl font-bold ${
                            spotsLeft <= 5 ? 'text-red-600' : 
                            spotsLeft <= 15 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {spotsLeft}
                          </div>
                          <div className="text-sm text-gray-600">Disponibles</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Ocupación del evento</span>
                          <span className="text-sm text-gray-500">
                            {percentage.toFixed(0)}% ocupado
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              percentage >= 90 ? 'bg-red-500' : 
                              percentage >= 70 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {currentParticipants} de {maxParticipants} participantes
                          </span>
                          <span className={`text-sm font-medium ${
                            spotsLeft <= 5 ? 'text-red-600' : 
                            spotsLeft <= 15 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {spotsLeft <= 5 ? '¡Últimos lugares!' : 
                             spotsLeft <= 15 ? 'Pocos lugares disponibles' : 
                             'Muchos lugares disponibles'}
                          </span>
                        </div>
                      </div>

                      {/* Estado de disponibilidad */}
                      <div className={`p-4 rounded-lg border-l-4 ${
                        spotsLeft <= 5 ? 'bg-red-50 border-red-400' : 
                        spotsLeft <= 15 ? 'bg-yellow-50 border-yellow-400' : 
                        'bg-green-50 border-green-400'
                      }`}>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            spotsLeft <= 5 ? 'bg-red-500' : 
                            spotsLeft <= 15 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}></div>
                          <div>
                            <p className={`text-sm font-medium ${
                              spotsLeft <= 5 ? 'text-red-800' : 
                              spotsLeft <= 15 ? 'text-yellow-800' : 
                              'text-green-800'
                            }`}>
                              {spotsLeft <= 5 ? 'Cupo casi lleno' : 
                               spotsLeft <= 15 ? 'Cupo limitado' : 
                               'Cupo disponible'}
                            </p>
                            <p className={`text-xs ${
                              spotsLeft <= 5 ? 'text-red-600' : 
                              spotsLeft <= 15 ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {spotsLeft <= 5 ? 'Solo quedan ' + spotsLeft + ' lugares disponibles. ¡Inscríbete pronto!' : 
                               spotsLeft <= 15 ? 'Quedan ' + spotsLeft + ' lugares. Te recomendamos inscribirte pronto.' : 
                               'Hay ' + spotsLeft + ' lugares disponibles. ¡Perfecto para inscribirte!'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Botón de inscripción */}
                      <div className="pt-4 border-t border-gray-200">
                        {/* Mostrar mensaje si el usuario está bloqueado o cancelado */}
                        {userRegistrationStatus === 'blocked' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-red-600 text-lg">🚫</span>
                              </div>
                            </div>
                            <h3 className="text-red-800 font-medium mb-1">Inscripción Bloqueada</h3>
                            <p className="text-red-600 text-sm">
                              Tu inscripción a este evento ha sido bloqueada por un administrador. 
                              Contacta con los organizadores para más información.
                            </p>
                          </div>
                        )}

                        {userRegistrationStatus === 'cancelled' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-yellow-600 text-lg">⚠️</span>
                              </div>
                            </div>
                            <h3 className="text-yellow-800 font-medium mb-1">Inscripción Cancelada</h3>
                            <p className="text-yellow-600 text-sm">
                              Tu inscripción a este evento fue cancelada. 
                              Puedes contactar con los organizadores si deseas volver a inscribirte.
                            </p>
                          </div>
                        )}

                        {/* Mostrar botón solo si el usuario no está bloqueado o cancelado */}
                        {userRegistrationStatus !== 'blocked' && userRegistrationStatus !== 'cancelled' && (
                          <button
                            onClick={handleRegistration}
                            disabled={spotsLeft <= 0 || registrationLoading}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                              spotsLeft <= 0 ? 
                                'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                isRegistered ?
                                  'bg-red-600 text-white hover:bg-red-700' :
                                  spotsLeft <= 5 ? 
                                    'bg-red-600 text-white hover:bg-red-700' :
                                    'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                          >
                            {registrationLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Procesando...
                              </div>
                            ) : spotsLeft <= 0 ? (
                              'Evento lleno'
                            ) : isRegistered ? (
                              'Desinscribirse del evento'
                            ) : spotsLeft <= 5 ? (
                              '¡Inscribirse ahora!'
                            ) : (
                              'Inscribirse al evento'
                            )}
                          </button>
                        )}

                        {spotsLeft > 0 && !isRegistered && userRegistrationStatus !== 'blocked' && userRegistrationStatus !== 'cancelled' && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            Al inscribirte, tu lugar quedará reservado automáticamente
                          </p>
                        )}
                        {isRegistered && userRegistrationStatus !== 'blocked' && userRegistrationStatus !== 'cancelled' && (
                          <p className="text-xs text-green-600 text-center mt-2">
                            ✅ Estás inscrito a este evento
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Contacto */}
            {event.contact && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-sm text-gray-700">{event.contact}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Contacta al organizador para más información o para confirmar tu participación.
                  </p>
                </div>
              </div>
            )}

            {/* Eventos Relacionados */}
            {historyData?.events && historyData.events.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Otros Eventos</h3>
                <div className="space-y-3">
                  {historyData.events
                    .filter((e, index) => e.category === event.category && index !== parseInt(params.id as string))
                    .slice(0, 3)
                    .map((relatedEvent, index) => (
                      <Link
                        key={index}
                        href={`/visitantes/eventos/${historyData.events.indexOf(relatedEvent)}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{relatedEvent.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{relatedEvent.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(relatedEvent.date)}
                        </div>
                      </Link>
                    ))}
                </div>
                <Link
                  href="/visitantes/eventos"
                  className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todos los eventos
                </Link>
              </div>
            )}

            {/* Botón de Mapa */}
            {event.location && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h3>
                <button
                  onClick={openMaps}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ver en Google Maps
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación para desinscribirse */}
      {showUnregisterConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                ¿Estás seguro?
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Al desinscribirte del evento <strong>"{event?.title}"</strong>, perderás tu lugar reservado. 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelUnregister}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmUnregister}
                  disabled={registrationLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {registrationLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    'Sí, desinscribirme'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
