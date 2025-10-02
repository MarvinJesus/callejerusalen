'use client';

import React, { useState, useEffect } from 'react';
import { Heart, ArrowLeft, Calendar, MapPin, Users, Star, Share2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface CulturalTradition {
  id?: string;
  name: string;
  description: string;
  category: string;
  image: string;
  importance: string;
  practices: string[];
  order: number;
}

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: any[];
  traditions: CulturalTradition[];
  places: any[];
  gallery: any[];
  exploreLinks: any[];
  isActive: boolean;
}

const TraditionDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [tradition, setTradition] = useState<CulturalTradition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistoryData();
  }, []);

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
      
      // Buscar la tradición específica
      const traditionIndex = parseInt(params.id as string);
      if (data.historyData.traditions && data.historyData.traditions[traditionIndex]) {
        setTradition(data.historyData.traditions[traditionIndex]);
      } else {
        setError('Tradición no encontrada');
      }
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'Muy Importante':
        return 'bg-red-100 text-red-800';
      case 'Importante':
        return 'bg-orange-100 text-orange-800';
      case 'Moderada':
        return 'bg-yellow-100 text-yellow-800';
      case 'Básica':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Festividades':
        return '🎉';
      case 'Gastronomía':
        return '🍽️';
      case 'Música y Danza':
        return '🎵';
      case 'Artesanías':
        return '🎨';
      case 'Religión':
        return '⛪';
      case 'Costumbres':
        return '👥';
      case 'Lenguaje':
        return '💬';
      default:
        return '📚';
    }
  };

  const shareTradition = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tradition?.name,
          text: tradition?.description,
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
              <p className="text-gray-600">Cargando tradición...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tradition) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Heart className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tradición no encontrada</h2>
            <p className="text-gray-600 mb-4">{error || 'La tradición que buscas no existe'}</p>
            <Link
              href="/visitantes/historia/tradiciones"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Tradiciones
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
                href="/visitantes/historia/tradiciones"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver a Tradiciones
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{tradition.name}</h1>
                <p className="text-gray-600 mt-1">Tradición cultural de Calle Jerusalén</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={shareTradition}
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
            {tradition.image && (
              <div className="mb-8">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={tradition.image}
                    alt={tradition.name}
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
                  {getCategoryIcon(tradition.category)} {tradition.category}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getImportanceColor(tradition.importance)}`}>
                  <Star className="w-4 h-4 mr-1" />
                  {tradition.importance}
                </span>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sobre esta tradición</h2>
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                  {tradition.description}
                </p>
              </div>
            </div>

            {/* Prácticas y Costumbres */}
            {tradition.practices && tradition.practices.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
                  Prácticas y Costumbres
                </h3>
                <div className="space-y-4">
                  {tradition.practices.map((practice, index) => (
                    <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{practice}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Información de la Tradición */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Heart className="w-5 h-5 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Categoría</p>
                    <p className="text-sm text-gray-600">{tradition.category}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Importancia</p>
                    <p className="text-sm text-gray-600">{tradition.importance}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Prácticas</p>
                    <p className="text-sm text-gray-600">{tradition.practices.length} registradas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tradiciones Relacionadas */}
            {historyData?.traditions && historyData.traditions.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Otras Tradiciones</h3>
                <div className="space-y-3">
                  {historyData.traditions
                    .filter((t, index) => t.category === tradition.category && index !== parseInt(params.id as string))
                    .slice(0, 3)
                    .map((relatedTradition, index) => (
                      <Link
                        key={index}
                        href={`/visitantes/historia/tradiciones/${historyData.traditions.indexOf(relatedTradition)}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{relatedTradition.name}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{relatedTradition.description}</p>
                      </Link>
                    ))}
                </div>
                <Link
                  href="/visitantes/historia/tradiciones"
                  className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todas las tradiciones
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraditionDetailPage;
