'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, ArrowLeft, Clock, MapPin, Users, Star, Share2, CheckCircle, UserPlus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
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

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'not_registered' | 'registered' | 'pending' | 'error'>('not_registered');
  const [eventStats, setEventStats] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      loadEvent(parseInt(params.id as string));
    }
  }, [params.id]);

  useEffect(() => {
    if (event) {
      loadEventStats();
      if (user) {
        checkRegistrationStatus();
      }
    }
  }, [event, user]);

  const loadEvent = async (eventIndex: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de historia');
      }

      const data = await response.json();
      const events = data.historyData?.events || [];
      
      if (eventIndex >= 0 && eventIndex < events.length) {
        setEvent(events[eventIndex]);
      } else {
        setError('Evento no encontrado');
      }
    } catch (error) {
      console.error('Error al cargar evento:', error);
      setError('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!user || !event) return;
    
    try {
      const userId = user.uid;
      const response = await fetch(`/api/events/user/${userId}/registrations`);
      
      if (response.ok) {
        const data = await response.json();
        const registrations = data.registrations || [];
        const userRegistration = registrations.find((reg: any) => reg.eventId === params.id);
        
        if (userRegistration) {
          setRegistrationStatus(userRegistration.status === 'confirmed' ? 'registered' : 'pending');
        } else {
          setRegistrationStatus('not_registered');
        }
      }
    } catch (error) {
      console.error('Error al verificar estado de inscripción:', error);
    }
  };

  const loadEventStats = async () => {
    if (!event) return;
    
    try {
      const response = await fetch(`/api/events/${params.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setEventStats(data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas del evento:', error);
    }
  };

  const handleRegistration = async () => {
    if (!user) {
      // Redirigir al login si no está autenticado
      router.push('/login');
      return;
    }

    if (!event) return;

    setIsRegistering(true);
    
    try {
      const response = await fetch(`/api/events/${params.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Usuario',
        }),
      });

      if (response.ok) {
        setRegistrationStatus('pending');
        alert('Inscripción enviada. Te notificaremos cuando sea confirmada.');
      } else {
        const errorData = await response.json();
        alert(`Error al inscribirse: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al inscribirse:', error);
      alert('Error al inscribirse. Por favor, intenta de nuevo.');
    } finally {
      setIsRegistering(false);
    }
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

  const shareEvent = async () => {
    if (!event) return;
    
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
      navigator.clipboard.writeText(window.location.href);
      alert('URL copiada al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Evento no encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'El evento que buscas no existe'}</p>
          <Link
            href="/visitantes/eventos"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Eventos
          </Link>
        </div>
      </div>
    );
  }

  const maxParticipants = event.maxParticipants || 100;
  const currentParticipants = eventStats?.confirmedRegistrations || 0;
  const percentage = maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;
  const spotsLeft = Math.max(0, maxParticipants - currentParticipants);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/visitantes/eventos"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{event.title}</h1>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {getCategoryIcon(event.category)} {event.category}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={shareEvent}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Imagen del Evento */}
            {event.image && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-96 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {event.isRecurring && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Recurrente
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descripción</h2>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>

            {/* Destacados */}
            {event.highlights && event.highlights.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Destacados</h2>
                <ul className="space-y-3">
                  {event.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3"></div>
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requisitos */}
            {event.requirements && event.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Requisitos</h2>
                <ul className="space-y-3">
                  {event.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3"></div>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Evento</h2>
              
              <div className="space-y-4">
                {/* Fecha */}
                {event.date && (
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="text-gray-600 block">Fecha</span>
                      <span className="text-gray-900 font-medium">{formatDate(event.date)}</span>
                    </div>
                  </div>
                )}

                {/* Hora */}
                {event.time && (
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="text-gray-600 block">Hora</span>
                      <span className="text-gray-900 font-medium">{event.time}</span>
                    </div>
                  </div>
                )}

                {/* Ubicación */}
                {event.location && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="text-gray-600 block">Ubicación</span>
                      <span className="text-gray-900 font-medium">{event.location}</span>
                    </div>
                  </div>
                )}

                {/* Organizador */}
                {event.organizer && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="text-gray-600 block">Organizador</span>
                      <span className="text-gray-900 font-medium">{event.organizer}</span>
                    </div>
                  </div>
                )}

                {/* Contacto */}
                {event.contact && (
                  <div className="flex items-start">
                    <Star className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="text-gray-600 block">Contacto</span>
                      <span className="text-gray-900 font-medium">{event.contact}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cupo y Estadísticas */}
            {event.maxParticipants && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Participantes Inscritos</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Inscritos</span>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-gray-900">
                        {currentParticipants} de {maxParticipants} inscritos
                      </div>
                      <div className="text-sm text-gray-500">
                        ({percentage.toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        percentage >= 90 ? 'bg-red-500' : 
                        percentage >= 70 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {spotsLeft} disponibles
                    </span>
                    <span className={`text-sm font-medium ${
                      spotsLeft <= 0 ? 'text-red-600' :
                      spotsLeft <= 5 ? 'text-red-600' : 
                      spotsLeft <= 15 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {spotsLeft <= 0 ? 'Sin cupo' :
                       spotsLeft <= 5 ? `¡Quedan ${spotsLeft}!` : 
                       spotsLeft <= 15 ? `Quedan ${spotsLeft}` : 
                       `${spotsLeft} disponibles`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de Inscripción - Solo visible si el usuario está autenticado */}
            {user && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Inscripción</h2>
                
                {registrationStatus === 'registered' && (
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-green-800 font-medium">¡Ya estás inscrito!</p>
                      <p className="text-green-600 text-sm">Tu inscripción ha sido confirmada.</p>
                    </div>
                  </div>
                )}

                {registrationStatus === 'pending' && (
                  <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-yellow-800 font-medium">Inscripción pendiente</p>
                      <p className="text-yellow-600 text-sm">Esperando confirmación del organizador.</p>
                    </div>
                  </div>
                )}

                {registrationStatus === 'not_registered' && (
                  <div className="space-y-4">
                    {spotsLeft > 0 ? (
                      <button
                        onClick={handleRegistration}
                        disabled={isRegistering}
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRegistering ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Inscribiendo...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Inscribirse al Evento
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <p className="text-red-800 font-medium">Evento lleno</p>
                          <p className="text-red-600 text-sm">No hay lugares disponibles.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mensaje para usuarios no autenticados */}
            {!user && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Inscripción</h2>
                <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-blue-800 font-medium">Inicia sesión para inscribirte</p>
                    <p className="text-blue-600 text-sm">Necesitas una cuenta para participar en este evento.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/register"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Crear Cuenta
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}