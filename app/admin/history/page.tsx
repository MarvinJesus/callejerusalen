'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Edit, Eye, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: HistoryPeriod[];
  traditions: CulturalTradition[];
  places: HistoricalPlace[];
  events: CommunityEvent[];
  services: any[]; // Servicios locales
  sections: any[]; // Secciones de la guía
  gallery: HistoryGalleryImage[];
  exploreLinks: ExploreLink[];
  isActive: boolean;
}

interface HistoryPeriod {
  id?: string;
  period: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
  order: number;
}

interface CulturalTradition {
  id?: string;
  title: string;
  description: string;
  icon: string;
  month: string;
  order: number;
}

interface HistoricalPlace {
  id?: string;
  name: string;
  description: string;
  year: string;
  significance: string;
  order: number;
}

interface HistoryGalleryImage {
  id?: string;
  url: string;
  caption?: string;
  order: number;
}

interface ExploreLink {
  id?: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  color: string;
  order: number;
}

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

const AdminHistoryPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/history');
      
      if (!response.ok) {
        if (response.status === 404) {
          // No hay datos, crear estructura por defecto
          setHistoryData({
            title: 'Historia de Calle Jerusalén',
            subtitle: 'Descubre la rica historia y tradiciones que han moldeado nuestra comunidad a lo largo de los años.',
            periods: [],
            traditions: [],
            places: [],
            events: [],
            services: [],
            sections: [],
            gallery: [],
            exploreLinks: [],
            isActive: true,
          });
        } else {
          throw new Error('Error al cargar datos de historia');
        }
        return;
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
      alert('Datos de historia guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar datos de historia:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar datos de historia');
    } finally {
      setSaving(false);
    }
  };

  const updateHistoryData = (updates: Partial<HistoryPageData>) => {
    setHistoryData(prev => prev ? { ...prev, ...updates } : null);
  };

  const previewHistory = () => {
    window.open('/visitantes/historia', '_blank');
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando datos de historia...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={loadHistoryData}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute 
      allowedRoles={['admin', 'super_admin']} 
      requiredPermissions={['community.view', 'community.edit']}
      requireAllPermissions={false}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/admin-dashboard"
                  className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Volver al Dashboard
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Historia</h1>
                  <p className="text-gray-600">Administra el contenido de la página de historia</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {userProfile?.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}
                </span>
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Acciones */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <BookOpen className="w-8 h-8 text-primary-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Editor de Historia</h2>
                  <p className="text-gray-600">Edita el contenido de la página de historia de visitantes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={previewHistory}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vista Previa
                </button>
                <button
                  onClick={saveHistoryData}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Editor de Contenido */}
          {historyData && (
            <div className="space-y-8">
              {/* Información Básica */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título Principal
                    </label>
                    <input
                      type="text"
                      value={historyData.title}
                      onChange={(e) => updateHistoryData({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                      placeholder="Historia de Calle Jerusalén"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={historyData.subtitle}
                      onChange={(e) => updateHistoryData({ subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                      placeholder="Descubre la rica historia..."
                    />
                  </div>
                </div>
              </div>

              {/* Secciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Nuestra Historia */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuestra Historia</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Períodos históricos con imágenes y descripciones
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {historyData.periods.length}
                  </div>
                  <p className="text-gray-500 text-sm">períodos configurados</p>
                  <button
                    onClick={() => router.push('/admin/history/periods')}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestionar Períodos
                  </button>
                </div>

                {/* Tradiciones Culturales */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tradiciones Culturales</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Celebraciones y tradiciones de la comunidad
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {historyData.traditions.length}
                  </div>
                  <p className="text-gray-500 text-sm">tradiciones configuradas</p>
                  <button
                    onClick={() => router.push('/admin/history/traditions')}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestionar Tradiciones
                  </button>
                </div>

                {/* Eventos y Actividades */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos y Actividades</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Eventos comunitarios y actividades culturales
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {historyData.events?.length || 0}
                  </div>
                  <p className="text-gray-500 text-sm">eventos configurados</p>
                  <button
                    onClick={() => router.push('/admin/history/events')}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestionar Eventos
                  </button>
                </div>

                {/* Lugares Históricos */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lugares Históricos</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Sitios importantes de la comunidad
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {historyData.places.length}
                  </div>
                  <p className="text-gray-500 text-sm">lugares configurados</p>
                  <button
                    onClick={() => router.push('/admin/history/places')}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestionar Lugares
                  </button>
                </div>

                {/* Galería Histórica */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Galería Histórica</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Fotos históricas de la comunidad
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {historyData.gallery.length}
                  </div>
                  <p className="text-gray-500 text-sm">imágenes configuradas</p>
                  <button
                    onClick={() => router.push('/admin/history/gallery')}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestionar Galería
                  </button>
                </div>

                {/* Servicios Locales */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios Locales</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Directorio de servicios de la comunidad
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {historyData.services?.length || 0}
                  </div>
                  <p className="text-gray-500 text-sm">servicios configurados</p>
                  <button
                    onClick={() => router.push('/admin/history/services')}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestionar Servicios
                  </button>
                </div>

                {/* Guía de Visitantes */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Guía de Visitantes</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Información y recursos para visitantes
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {historyData.sections?.length || 0}
                  </div>
                  <p className="text-gray-500 text-sm">secciones configuradas</p>
                  <button
                    onClick={() => router.push('/admin/history/guide')}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestionar Guía
                  </button>
                </div>

                {/* Explora Más */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Explora Más</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Enlaces relacionados y navegación
                  </p>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    {historyData.exploreLinks.length}
                  </div>
                  <p className="text-gray-500 text-sm">enlaces configurados</p>
                  <button
                    onClick={() => router.push('/admin/history/explore')}
                    className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestionar Enlaces
                  </button>
                </div>

                {/* Estado de la Página */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de la Página</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Control de visibilidad pública
                  </p>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={historyData.isActive}
                      onChange={(e) => updateHistoryData({ isActive: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Página activa (visible para visitantes)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminHistoryPage;
