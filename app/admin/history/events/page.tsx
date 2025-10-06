'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Edit, Trash2, Plus, ArrowLeft, X, Check, AlertCircle, Clock, MapPin, Users, Star, Camera, Search, Filter, SortAsc, SortDesc, Archive } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
  isArchived?: boolean;
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

const AdminEventsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [eventStats, setEventStats] = useState<{[key: string]: any}>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [initialHistoryData, setInitialHistoryData] = useState<HistoryPageData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<number | null>(null);
  const [showUnarchiveConfirm, setShowUnarchiveConfirm] = useState<number | null>(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'participants'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Estados para tabs y archivado
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [refreshKey, setRefreshKey] = useState(0);

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

  const recurringPatterns = [
    'Diario',
    'Semanal',
    'Quincenal',
    'Mensual',
    'Trimestral',
    'Anual',
    'Personalizado'
  ];

  useEffect(() => {
    loadHistoryData();
  }, []);

  useEffect(() => {
    if (historyData?.events && historyData.events.length > 0) {
      loadEventStats();
      
      // Debug: Mostrar información de eventos al cargar
      console.log('🔄 Eventos cargados, verificando archivado...');
      const counts = getEventCounts();
      console.log('📊 Conteos calculados:', counts);
    }
  }, [historyData]);

  // Recalcular conteos cuando cambie el refreshKey
  useEffect(() => {
    if (historyData?.events && historyData.events.length > 0) {
      console.log('🔄 Recalculando conteos...');
      const counts = getEventCounts();
      console.log('📊 Conteos recalculados:', counts);
    }
  }, [refreshKey, historyData]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de historia');
      }

      const data = await response.json();
      
      setHistoryData(data.historyData);
      setInitialHistoryData(data.historyData);
    } catch (error) {
      console.error('❌ Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const saveHistoryData = async () => {
    if (!historyData) return;

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar datos de historia');
      }

      const data = await response.json();
      console.log('Datos de historia guardados:', data);
      toast.success('Datos de historia guardados exitosamente');
      setInitialHistoryData(historyData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error al guardar datos de historia:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar datos de historia');
      toast.error('Error al guardar datos de historia');
    } finally {
      setSaving(false);
    }
  };

  const updateHistoryData = (updates: Partial<HistoryPageData>) => {
    setHistoryData(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(initialHistoryData));
      return updated;
    });
  };

  const addEvent = () => {
    const newEvent: CommunityEvent = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: '',
      type: '',
      organizer: '',
      contact: '',
      image: '',
      maxParticipants: undefined,
      requirements: [],
      highlights: [],
      isRecurring: false,
      recurringPattern: '',
      order: 0,
    };
    setEditingEvent(newEvent);
    setEditingEventIndex(null);
    setShowForm(true);
    setNewRequirement('');
    setNewHighlight('');
  };

  const editEvent = (event: CommunityEvent, index: number) => {
    setEditingEvent({ ...event });
    setEditingEventIndex(index);
    setShowForm(true);
    setNewRequirement('');
    setNewHighlight('');
  };

  const confirmDeleteEvent = (index: number) => {
    setShowDeleteConfirm(index);
  };

  const deleteEvent = async (index: number) => {
    if (!historyData || index < 0 || index >= historyData.events.length) {
      toast.error('Índice de evento inválido');
      return;
    }
    
    try {
      setSaving(true);
      
      const updatedEvents = historyData.events.filter((_, i) => i !== index);
      
      const reorderedEvents = updatedEvents.map((event, newIndex) => ({
        ...event,
        order: newIndex + 1
      }));
      
      const updatedHistoryData = { ...historyData, events: reorderedEvents };
      setHistoryData(updatedHistoryData);

      console.log('Eliminando evento en índice:', index);
      console.log('Eventos restantes:', reorderedEvents);

      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el evento');
      }

      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      setShowDeleteConfirm(null);
      
      // Recargar estadísticas después de eliminar
      await loadEventStats();
      
      toast.success('Evento eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar evento:', error);
      toast.error(error.message || 'Error al eliminar el evento');
      setHistoryData(historyData);
    } finally {
      setSaving(false);
    }
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
                totalRegistrations: data.totalRegistrations || 0,
                pendingRegistrations: data.pendingRegistrations || 0,
                cancelledRegistrations: data.cancelledRegistrations || 0,
                blockedRegistrations: data.blockedRegistrations || 0
              };
            }
          } catch (error) {
            console.error(`Error al cargar estadísticas del evento ${index}:`, error);
          }
          return {
            index,
            confirmedRegistrations: 0,
            totalRegistrations: 0,
            pendingRegistrations: 0,
            cancelledRegistrations: 0,
            blockedRegistrations: 0
          };
        });

        const statsResults = await Promise.all(statsPromises);
        
        // Convertir a objeto indexado
        statsResults.forEach(result => {
          stats[result.index] = {
            confirmedRegistrations: result.confirmedRegistrations,
            totalRegistrations: result.totalRegistrations,
            pendingRegistrations: result.pendingRegistrations,
            cancelledRegistrations: result.cancelledRegistrations,
            blockedRegistrations: result.blockedRegistrations
          };
        });
      }
      
      setEventStats(stats);
    } catch (error) {
      console.error('❌ Error al cargar estadísticas de eventos:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const saveEvent = async () => {
    if (!editingEvent || !historyData) return;

    if (!editingEvent.title.trim() || !editingEvent.description.trim() || !editingEvent.category.trim() || !editingEvent.type.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      const updatedEvents = [...historyData.events];
      
      if (editingEventIndex === null) {
        const newEvent = { 
          ...editingEvent,
          order: updatedEvents.length + 1
        };
        delete newEvent.id;
        updatedEvents.push(newEvent);
        
        console.log('Agregando nuevo evento:', newEvent);
      } else {
        if (editingEventIndex >= 0 && editingEventIndex < updatedEvents.length) {
          const originalOrder = updatedEvents[editingEventIndex].order;
          const updatedEvent = { 
            ...editingEvent, 
            order: originalOrder 
          };
          
          updatedEvents[editingEventIndex] = updatedEvent;
          
          console.log(`Actualizando evento en índice ${editingEventIndex}:`, updatedEvent);
        } else {
          throw new Error('Índice de evento inválido para edición');
        }
      }

      const updatedHistoryData = { ...historyData, events: updatedEvents };
      setHistoryData(updatedHistoryData);

      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el evento');
      }

      setShowForm(false);
      setEditingEvent(null);
      setEditingEventIndex(null);
      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      
      // Recargar estadísticas después de guardar
      await loadEventStats();
      
      toast.success('Evento guardado exitosamente');
    } catch (error: any) {
      console.error('Error al guardar evento:', error);
      toast.error(error.message || 'Error al guardar el evento');
    } finally {
      setSaving(false);
    }
  };

  const addRequirement = () => {
    if (!newRequirement.trim() || !editingEvent) return;
    
    setEditingEvent({
      ...editingEvent,
      requirements: [...editingEvent.requirements, newRequirement.trim()]
    });
    setNewRequirement('');
  };

  const removeRequirement = (index: number) => {
    if (!editingEvent) return;
    
    setEditingEvent({
      ...editingEvent,
      requirements: editingEvent.requirements.filter((_, i) => i !== index)
    });
  };

  const addHighlight = () => {
    if (!newHighlight.trim() || !editingEvent) return;
    
    setEditingEvent({
      ...editingEvent,
      highlights: [...editingEvent.highlights, newHighlight.trim()]
    });
    setNewHighlight('');
  };

  const removeHighlight = (index: number) => {
    if (!editingEvent) return;
    
    setEditingEvent({
      ...editingEvent,
      highlights: editingEvent.highlights.filter((_, i) => i !== index)
    });
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

  // Función para determinar si un evento está archivado
  const isEventArchived = (event: CommunityEvent) => {
    // Respeta el archivado manual
    if (event.isArchived) {
      return true;
    }

    // Si no tiene fecha, no se archiva
    if (!event.date || event.date.trim() === '') {
      console.log('📅 Evento sin fecha:', event.title, '- NO archivado');
      return false;
    }
    
    // Los eventos recurrentes no se archivan automáticamente
    if (event.isRecurring) {
      console.log('🔄 Evento recurrente:', event.title, '- NO archivado');
      return false;
    }
    
    try {
      // Crear fecha del evento
      const eventDate = new Date(event.date);
      
      // Verificar si la fecha es válida
      if (isNaN(eventDate.getTime())) {
        console.warn('⚠️ Fecha inválida para evento:', event.title, 'Fecha:', event.date);
        return false;
      }
      
      // Crear fecha actual (inicio del día de hoy)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Crear fecha del evento (inicio del día del evento)
      const eventDateStart = new Date(eventDate);
      eventDateStart.setHours(0, 0, 0, 0);
      
      const isArchived = eventDateStart < today;
      
      // Debug logging
      console.log('🔍 Evento:', event.title);
      console.log('📅 Fecha del evento:', eventDate.toLocaleDateString());
      console.log('📅 Fecha actual:', today.toLocaleDateString());
      console.log('📅 ¿Ya pasó?', isArchived ? 'SÍ' : 'NO');
      console.log('---');
      
      return isArchived;
    } catch (error) {
      console.error('❌ Error procesando fecha:', event.title, 'Fecha:', event.date, error);
      return false;
    }
  };

  const confirmArchiveEvent = (index: number) => {
    setShowArchiveConfirm(index);
  };

  const archiveEvent = async (index: number) => {
    if (!historyData || index < 0 || index >= historyData.events.length) {
      toast.error('Índice de evento inválido');
      return;
    }

    try {
      setSaving(true);

      const updatedEvents = historyData.events.map((ev, i) =>
        i === index ? { ...ev, isArchived: true } : ev
      );

      const updatedHistoryData = { ...historyData, events: updatedEvents };
      setHistoryData(updatedHistoryData);

      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al archivar el evento');
      }

      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      setShowArchiveConfirm(null);
      setRefreshKey(prev => prev + 1);
      toast.success('Evento archivado exitosamente');
    } catch (error: any) {
      console.error('Error al archivar evento:', error);
      toast.error(error.message || 'Error al archivar el evento');
      setHistoryData(historyData);
    } finally {
      setSaving(false);
    }
  };

  const confirmUnarchiveEvent = (index: number) => {
    setShowUnarchiveConfirm(index);
  };

  const unarchiveEvent = async (index: number) => {
    if (!historyData || index < 0 || index >= historyData.events.length) {
      toast.error('Índice de evento inválido');
      return;
    }

    try {
      setSaving(true);

      const updatedEvents = historyData.events.map((ev, i) =>
        i === index ? { ...ev, isArchived: false } : ev
      );

      const updatedHistoryData = { ...historyData, events: updatedEvents };
      setHistoryData(updatedHistoryData);

      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al desarchivar el evento');
      }

      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      setShowUnarchiveConfirm(null);
      setRefreshKey(prev => prev + 1);
      toast.success('Evento desarchivado exitosamente');
    } catch (error: any) {
      console.error('Error al desarchivar evento:', error);
      toast.error(error.message || 'Error al desarchivar el evento');
      setHistoryData(historyData);
    } finally {
      setSaving(false);
    }
  };

  // Función para filtrar y ordenar eventos
  const getFilteredAndSortedEvents = () => {
    if (!historyData?.events) return [];

    let filteredEvents = historyData.events.filter(event => {
      // Filtro por tab (activos vs archivados)
      const isArchived = isEventArchived(event);
      const matchesTab = activeTab === 'active' ? !isArchived : isArchived;

      // Filtro por término de búsqueda
      const matchesSearch = !searchTerm || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por categoría
      const matchesCategory = !selectedCategory || event.category === selectedCategory;

      // Filtro por tipo
      const matchesType = !selectedType || event.type === selectedType;

      // Filtro por eventos recurrentes
      const matchesRecurring = !showRecurringOnly || event.isRecurring;

      return matchesTab && matchesSearch && matchesCategory && matchesType && matchesRecurring;
    });

    // Ordenar eventos
    filteredEvents.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          // Ordenar por fecha del evento, si no hay fecha usar el orden
          const dateA = a.date ? new Date(a.date).getTime() : a.order;
          const dateB = b.date ? new Date(b.date).getTime() : b.order;
          comparison = dateA - dateB;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'participants':
          const participantsA = eventStats[historyData.events.indexOf(a)]?.confirmedRegistrations || 0;
          const participantsB = eventStats[historyData.events.indexOf(b)]?.confirmedRegistrations || 0;
          comparison = participantsA - participantsB;
          break;
        default:
          comparison = b.order - a.order; // Orden por defecto: más recientes primero
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filteredEvents;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedType('');
    setShowRecurringOnly(false);
    setSortBy('date');
    setSortOrder('desc');
  };

  const handleTabChange = (tab: 'active' | 'archived') => {
    console.log('🔄 Cambiando a tab:', tab);
    setActiveTab(tab);
    setRefreshKey(prev => prev + 1); // Forzar re-render
  };

  // Función para obtener conteos de eventos
  const getEventCounts = () => {
    if (!historyData?.events) return { active: 0, archived: 0 };
    
    let activeCount = 0;
    let archivedCount = 0;
    
    console.log('📊 Calculando conteos de eventos...');
    console.log('📊 Total de eventos:', historyData.events.length);
    
    historyData.events.forEach((event, index) => {
      const isArchived = isEventArchived(event);
      console.log(`📊 Evento ${index + 1}: "${event.title}" - Archivado: ${isArchived}`);
      
      if (isArchived) {
        archivedCount++;
      } else {
        activeCount++;
      }
    });
    
    console.log('📊 Conteos finales - Activos:', activeCount, 'Archivados:', archivedCount);
    
    return { active: activeCount, archived: archivedCount };
  };


  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
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
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 sm:py-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors text-sm sm:text-base"
                title="Volver a la página anterior"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Volver Atrás
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Eventos y Actividades</h1>
                <p className="text-sm sm:text-base text-gray-600">Gestiona los eventos y actividades de la comunidad</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <UserMenu />
              {hasChanges && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Cambios sin guardar</span>
                  </div>
                  <button
                    onClick={saveHistoryData}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar eventos por título, descripción, ubicación u organizador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-900 bg-white"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-900 bg-white"
              >
                <option value="">Todos los tipos</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as 'date' | 'title' | 'participants');
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-900 bg-white"
              >
                <option value="date-desc">Más recientes primero</option>
                <option value="date-asc">Más antiguos primero</option>
                <option value="title-asc">Título A-Z</option>
                <option value="title-desc">Título Z-A</option>
                <option value="participants-desc">Más inscritos</option>
                <option value="participants-asc">Menos inscritos</option>
              </select>

              <label className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white">
                <input
                  type="checkbox"
                  checked={showRecurringOnly}
                  onChange={(e) => setShowRecurringOnly(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Solo recurrentes</span>
              </label>

              {(searchTerm || selectedCategory || selectedType || showRecurringOnly || sortBy !== 'date' || sortOrder !== 'desc') && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs para Eventos Activos y Archivados */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('active')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Eventos Vigentes
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'active'
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getEventCounts().active}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('archived')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'archived'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Eventos Archivados
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'archived'
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getEventCounts().archived}
                </span>
              </button>
            </nav>
          </div>
          
          {/* Información del tab (eliminada: mensajes y botones de debug/recarga) */}
        </div>

        {/* Lista de Eventos */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {activeTab === 'active' ? 'Eventos Vigentes' : 'Eventos Archivados'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {getFilteredAndSortedEvents().length} de {activeTab === 'active' ? getEventCounts().active : getEventCounts().archived} eventos {activeTab === 'active' ? 'vigentes' : 'archivados'}
                {(searchTerm || selectedCategory || selectedType || showRecurringOnly) && ' (filtrados)'}
              </p>
            </div>
            {activeTab === 'active' && (
              <button
                onClick={addEvent}
                disabled={saving}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Evento
              </button>
            )}
          </div>

          <div className="space-y-4">
            {getFilteredAndSortedEvents().map((event, index) => {
              // Encontrar el índice original del evento para las estadísticas
              const originalIndex = historyData?.events.findIndex(e => e === event) ?? 0;
              return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 w-fit">
                        {event.category}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                        {event.type}
                      </span>
                      {event.isRecurring && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                          Recurrente
                        </span>
                      )}
                      {activeTab === 'archived' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-fit">
                          Archivado
                        </span>
                      )}
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                        #{event.order}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">{event.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 break-words overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4',
                      maxHeight: '4.2em'
                    }}>
                      {event.description}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {event.time}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {event.location}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {event.organizer}
                      </span>
                      {event.maxParticipants && (
                        <span className="flex items-center">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          Máx. {event.maxParticipants}
                        </span>
                      )}
                      <span className="flex items-center text-blue-600">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {statsLoading ? (
                          <span className="animate-pulse">Cargando...</span>
                        ) : (
                          <>
                            {eventStats[originalIndex]?.confirmedRegistrations || 0} inscritos
                            {eventStats[originalIndex]?.totalRegistrations > eventStats[originalIndex]?.confirmedRegistrations && (
                              <span className="ml-1 text-orange-600">
                                ({eventStats[originalIndex]?.totalRegistrations - eventStats[originalIndex]?.confirmedRegistrations} pendientes)
                              </span>
                            )}
                          </>
                        )}
                      </span>
                      {event.image && (
                        <span className="flex items-center text-green-600">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          Con imagen
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-4 lg:flex-shrink-0">
                    {activeTab === 'active' ? (
                      // Acciones para eventos vigentes
                      <>
                        <Link
                          href={`/admin/history/events/${originalIndex}/users`}
                          className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                          title="Gestionar usuarios inscritos"
                        >
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                          Gestionar Usuarios
                        </Link>
                        <button
                          onClick={() => confirmArchiveEvent(originalIndex)}
                          disabled={saving}
                          className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                          title="Archivar evento"
                        >
                          <Archive className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                          Archivar
                        </button>
                        <button
                          onClick={() => editEvent(event, originalIndex)}
                          disabled={saving}
                          className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                          title="Editar evento"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => confirmDeleteEvent(originalIndex)}
                          disabled={saving}
                          className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                          title="Eliminar evento"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                          Eliminar
                        </button>
                      </>
                    ) : (
                      // Acciones para eventos archivados
                      <>
                        <Link
                          href={`/admin/history/events/${originalIndex}/users`}
                          className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                          title="Ver estados de usuarios que participaron"
                        >
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                          Estados de Usuarios
                        </Link>
                        <button
                          onClick={() => confirmUnarchiveEvent(originalIndex)}
                          disabled={saving}
                          className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-green-700 bg-white border border-green-300 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                          title="Desarchivar evento"
                        >
                          <Archive className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                          Desarchivar
                        </button>
                        <button
                          onClick={() => editEvent(event, originalIndex)}
                          disabled={saving}
                          className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                          title="Ver detalles del evento archivado"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                          Ver Detalles
                        </button>
                        <button
                          onClick={() => confirmDeleteEvent(originalIndex)}
                          disabled={saving}
                          className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                          Eliminar Permanentemente
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              );
            })}

            {getFilteredAndSortedEvents().length === 0 && (historyData?.events.length || 0) > 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'active' ? 'No hay eventos vigentes' : 'No hay eventos archivados'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  {activeTab === 'active' 
                    ? 'No hay eventos futuros que coincidan con los filtros aplicados'
                    : 'No hay eventos pasados que coincidan con los filtros aplicados'
                  }
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 w-full sm:w-auto"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {(historyData?.events.length || 0) === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay eventos configurados</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">Agrega el primer evento o actividad para comenzar</p>
                <button
                  onClick={addEvent}
                  disabled={saving}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Evento
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Edición */}
        {showForm && editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                {/* Header del Modal */}
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {editingEventIndex === null ? 'Nuevo Evento/Actividad' : 'Editar Evento/Actividad'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {editingEventIndex === null 
                        ? 'Agrega un nuevo evento o actividad de la comunidad'
                        : 'Modifica la información del evento seleccionado'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Formulario en dos columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Columna Izquierda */}
                  <div className="space-y-4">
                    {/* Título */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título del Evento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: Festival de la Comunidad"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Nombre del evento o actividad</p>
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editingEvent.category}
                        onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        required
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Tipo de evento o actividad</p>
                    </div>

                    {/* Tipo de Evento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Evento <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editingEvent.type}
                        onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        required
                      >
                        <option value="">Selecciona el tipo</option>
                        {eventTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Formato del evento</p>
                    </div>

                    {/* Fecha */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha del Evento
                      </label>
                      <input
                        type="date"
                        value={editingEvent.date}
                        onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Fecha del evento (opcional para eventos recurrentes)</p>
                    </div>

                    {/* Hora */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora del Evento
                      </label>
                      <input
                        type="time"
                        value={editingEvent.time}
                        onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hora de inicio del evento</p>
                    </div>

                    {/* Ubicación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ubicación
                      </label>
                      <input
                        type="text"
                        value={editingEvent.location}
                        onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: Plaza Principal"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lugar donde se realizará el evento</p>
                    </div>

                    {/* Organizador */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organizador
                      </label>
                      <input
                        type="text"
                        value={editingEvent.organizer}
                        onChange={(e) => setEditingEvent({ ...editingEvent, organizer: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: Comité de la Comunidad"
                      />
                      <p className="text-xs text-gray-500 mt-1">Quién organiza el evento</p>
                    </div>

                    {/* Contacto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contacto
                      </label>
                      <input
                        type="text"
                        value={editingEvent.contact}
                        onChange={(e) => setEditingEvent({ ...editingEvent, contact: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: 555-1234 o email@ejemplo.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">Información de contacto</p>
                    </div>

                    {/* Máximo de Participantes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Participantes
                      </label>
                      <input
                        type="number"
                        value={editingEvent.maxParticipants || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: 50"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Límite de participantes (opcional)</p>
                    </div>

                    {/* URL de Imagen */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL de Imagen
                      </label>
                      <input
                        type="url"
                        value={editingEvent.image}
                        onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">URL de la imagen del evento (opcional)</p>
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-4">
                    {/* Evento Recurrente */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingEvent.isRecurring}
                          onChange={(e) => setEditingEvent({ ...editingEvent, isRecurring: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Evento Recurrente</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Marca si este evento se repite</p>
                    </div>

                    {/* Patrón de Recurrencia */}
                    {editingEvent.isRecurring && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Patrón de Recurrencia
                        </label>
                        <select
                          value={editingEvent.recurringPattern || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, recurringPattern: e.target.value })}
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        >
                          <option value="">Selecciona el patrón</option>
                          {recurringPatterns.map((pattern) => (
                            <option key={pattern} value={pattern}>
                              {pattern}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Con qué frecuencia se repite</p>
                      </div>
                    )}

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={editingEvent.description}
                        onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white resize-none"
                        placeholder="Descripción detallada del evento..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Descripción completa del evento</p>
                    </div>

                    {/* Requisitos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requisitos de Participación
                      </label>
                      
                      {/* Lista de requisitos existentes */}
                      {editingEvent.requirements.length > 0 && (
                        <div className="space-y-2 mb-3 max-h-32 sm:max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 sm:p-3 bg-gray-50">
                          {editingEvent.requirements.map((requirement, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border">
                              <span className="flex-1 text-xs sm:text-sm text-gray-700 break-words">{requirement}</span>
                              <button
                                onClick={() => removeRequirement(index)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                                title="Eliminar requisito"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input para agregar nuevo requisito */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newRequirement}
                          onChange={(e) => setNewRequirement(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                          placeholder="Nuevo requisito..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addRequirement();
                            }
                          }}
                        />
                        <button
                          onClick={addRequirement}
                          className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
                          title="Agregar requisito"
                        >
                          <Plus className="w-4 h-4 mr-1 sm:mr-0" />
                          <span className="sm:hidden text-sm">Agregar</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Agrega requisitos para participar (opcional)</p>
                    </div>

                    {/* Destacados */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puntos Destacados
                      </label>
                      
                      {/* Lista de destacados existentes */}
                      {editingEvent.highlights.length > 0 && (
                        <div className="space-y-2 mb-3 max-h-32 sm:max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 sm:p-3 bg-gray-50">
                          {editingEvent.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border">
                              <span className="flex-1 text-xs sm:text-sm text-gray-700 break-words">{highlight}</span>
                              <button
                                onClick={() => removeHighlight(index)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                                title="Eliminar destacado"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input para agregar nuevo destacado */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                          placeholder="Nuevo punto destacado..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addHighlight();
                            }
                          }}
                        />
                        <button
                          onClick={addHighlight}
                          className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
                          title="Agregar destacado"
                        >
                          <Plus className="w-4 h-4 mr-1 sm:mr-0" />
                          <span className="sm:hidden text-sm">Agregar</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Agrega puntos destacados del evento (opcional)</p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEvent}
                    disabled={saving}
                    className="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Guardar Evento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      Confirmar eliminación
                    </h3>
                  </div>
                </div>
                <div className="mb-4 sm:mb-6">
                  <p className="text-sm text-gray-600">
                    ¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.
                  </p>
                  {historyData?.events[showDeleteConfirm] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">
                        {historyData.events[showDeleteConfirm].title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {historyData.events[showDeleteConfirm].category} - {historyData.events[showDeleteConfirm].type}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deleteEvent(showDeleteConfirm)}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Archivado */}
        {showArchiveConfirm !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      Confirmar archivado
                    </h3>
                  </div>
                </div>
                <div className="mb-4 sm:mb-6">
                  <p className="text-sm text-gray-600">
                    ¿Deseas archivar este evento? Podrás verlo en la pestaña de archivados.
                  </p>
                  {historyData?.events[showArchiveConfirm] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">
                        {historyData.events[showArchiveConfirm].title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {historyData.events[showArchiveConfirm].category} - {historyData.events[showArchiveConfirm].type}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    onClick={() => setShowArchiveConfirm(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => archiveEvent(showArchiveConfirm)}
                    disabled={saving}
                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Archivando...
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4 mr-2" />
                        Archivar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Desarchivado */}
        {showUnarchiveConfirm !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      Confirmar desarchivado
                    </h3>
                  </div>
                </div>
                <div className="mb-4 sm:mb-6">
                  <p className="text-sm text-gray-600">
                    ¿Deseas mover este evento de vuelta a vigentes?
                  </p>
                  {historyData?.events[showUnarchiveConfirm] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">
                        {historyData.events[showUnarchiveConfirm].title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {historyData.events[showUnarchiveConfirm].category} - {historyData.events[showUnarchiveConfirm].type}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    onClick={() => setShowUnarchiveConfirm(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => unarchiveEvent(showUnarchiveConfirm)}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Moviendo...
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4 mr-2" />
                        Desarchivar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEventsPage;
