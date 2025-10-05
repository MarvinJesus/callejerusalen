'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  BookOpen, 
  Calendar, 
  MapPin, 
  Users, 
  Heart,
  Star,
  ArrowRight,
  Clock,
  Camera,
  TreePine,
  Mountain,
  Home,
  Flag
} from 'lucide-react';

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: HistoryPeriod[];
  traditions: CulturalTradition[];
  places: HistoricalPlace[];
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
  category?: string;
  importance?: string;
  order: number;
}

interface HistoricalPlace {
  id?: string;
  name: string;
  description: string;
  year: string;
  significance: string;
  image?: string;
  category?: string;
  order: number;
}

interface HistoryGalleryImage {
  id?: string;
  title?: string;
  description?: string;
  url: string;
  caption?: string;
  category?: string;
  year?: string;
  location?: string;
  photographer?: string;
  isActive?: boolean;
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

const HistoryPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
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
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  // Datos por defecto si no hay datos en Firebase
  const defaultHistoricalPeriods = [
    {
      period: 'Fundación (1950-1960)',
      title: 'Los Primeros Pobladores',
      description: 'Calle Jerusalén fue fundada por un grupo de familias que buscaban un lugar tranquilo para establecerse. Las primeras casas se construyeron con materiales locales y siguiendo las tradiciones arquitectónicas de la región.',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      highlights: [
        'Primeras 12 familias se establecen',
        'Construcción de la primera pulpería',
        'Creación del comité comunal'
      ]
    },
    {
      period: 'Crecimiento (1960-1980)',
      title: 'Expansión y Desarrollo',
      description: 'Durante estas décadas, la comunidad creció significativamente. Se construyeron las primeras escuelas, se establecieron más comercios y se formó la identidad cultural que caracteriza a Calle Jerusalén.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
      highlights: [
        'Construcción de la escuela primaria',
        'Apertura de 5 nuevas pulperías',
        'Creación del festival anual'
      ]
    },
    {
      period: 'Modernización (1980-2000)',
      title: 'Entrada al Siglo XXI',
      description: 'La llegada de servicios básicos modernos transformó la vida en la comunidad. Se pavimentaron las calles principales, llegó la electricidad y se establecieron los servicios de salud.',
      image: 'https://images.unsplash.com/photo-1489599856878-46f6b2b5c6e9?w=400',
      highlights: [
        'Pavimentación de calles principales',
        'Instalación de red eléctrica',
        'Construcción del centro de salud'
      ]
    },
    {
      period: 'Actualidad (2000-Presente)',
      title: 'Comunidad Moderna',
      description: 'Hoy en día, Calle Jerusalén mantiene su esencia tradicional mientras abraza la modernidad. Es un ejemplo de desarrollo sostenible que preserva su patrimonio cultural.',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      highlights: [
        'Implementación de tecnología',
        'Turismo comunitario',
        'Preservación del patrimonio'
      ]
    }
  ];

  const defaultCulturalTraditions = [
    {
      title: 'Fiesta de San Jerónimo',
      description: 'Celebración anual en honor al santo patrono de la comunidad, con procesiones, música tradicional y comida típica.',
      icon: <Flag className="w-6 h-6" />,
      month: 'Septiembre'
    },
    {
      title: 'Feria Artesanal',
      description: 'Exposición de artesanías locales, productos agrícolas y comida tradicional de la región.',
      icon: <Star className="w-6 h-6" />,
      month: 'Marzo'
    },
    {
      title: 'Noche de Cuentos',
      description: 'Tradición oral donde los ancianos comparten historias y leyendas de la comunidad.',
      icon: <BookOpen className="w-6 h-6" />,
      month: 'Todo el año'
    },
    {
      title: 'Día del Maíz',
      description: 'Celebración de la cosecha con platillos tradicionales y ceremonias de agradecimiento.',
      icon: <TreePine className="w-6 h-6" />,
      month: 'Noviembre'
    }
  ];

  const defaultNotablePlaces = [
    {
      name: 'Casa de los Fundadores',
      description: 'La primera casa construida en Calle Jerusalén, ahora convertida en museo comunitario.',
      year: '1952',
      significance: 'Patrimonio Histórico'
    },
    {
      name: 'Pulpería El Progreso',
      description: 'La pulpería más antigua de la comunidad, en funcionamiento desde 1955.',
      year: '1955',
      significance: 'Comercio Tradicional'
    },
    {
      name: 'Mirador de la Cruz',
      description: 'Punto de observación natural que ofrece vistas panorámicas de toda la región.',
      year: 'Natural',
      significance: 'Lugar Sagrado'
    },
    {
      name: 'Escuela Central',
      description: 'Primera escuela de la comunidad, construida con el esfuerzo de todos los vecinos.',
      year: '1965',
      significance: 'Educación Comunitaria'
    }
  ];

  // Función para obtener el icono por nombre
  const getIconByName = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'BookOpen': <BookOpen className="w-6 h-6" />,
      'Calendar': <Calendar className="w-6 h-6" />,
      'MapPin': <MapPin className="w-6 h-6" />,
      'Users': <Users className="w-6 h-6" />,
      'Heart': <Heart className="w-6 h-6" />,
      'Star': <Star className="w-6 h-6" />,
      'Clock': <Clock className="w-6 h-6" />,
      'Camera': <Camera className="w-6 h-6" />,
      'TreePine': <TreePine className="w-6 h-6" />,
      'Mountain': <Mountain className="w-6 h-6" />,
      'Home': <Home className="w-6 h-6" />,
      'Flag': <Flag className="w-6 h-6" />,
    };
    return icons[iconName] || <BookOpen className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando historia...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !historyData) {
    return (
      <div className="min-h-screen bg-theme">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error || 'No se pudieron cargar los datos de historia'}</p>
            <button
              onClick={loadHistoryData}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Usar datos de Firebase siempre que estén disponibles
  const historicalPeriods = historyData.periods || [];
  const culturalTraditions = historyData.traditions || [];
  const notablePlaces = historyData.places || [];
  const galleryImages = historyData.gallery || [];

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {historyData.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {historyData.subtitle}
          </p>
        </div>

        {/* Timeline Histórico - Solo mostrar si hay períodos */}
        {historicalPeriods.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Nuestra Historia
            </h2>
            
            <div className="space-y-12">
              {historicalPeriods.map((period, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}>
                <div className="lg:w-1/2">
                  <div className="card-theme">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-primary-600">{period.period}</span>
                        <h3 className="text-2xl font-semibold text-gray-900">{period.title}</h3>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">{period.description}</p>
                    <ul className="space-y-2">
                      {period.highlights.map((highlight, highlightIndex) => (
                        <li key={highlightIndex} className="flex items-center space-x-2 text-gray-600">
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="relative h-64 lg:h-80 rounded-lg overflow-hidden">
                    <img
                      src={period.image}
                      alt={period.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              ))}
            </div>
          </section>
        )}

        {/* Tradiciones Culturales - Solo mostrar si hay tradiciones */}
        {historyData?.traditions && historyData.traditions.length > 0 && (
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
              Tradiciones Culturales
            </h2>
            <Link
              href="/visitantes/historia/tradiciones"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Ver todas las tradiciones
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyData.traditions.slice(0, 6).map((tradition, index) => (
              <div key={index} className="card-theme">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tradition.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {tradition.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {tradition.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-600 font-medium">
                        {tradition.importance}
                      </span>
                      <Link
                        href={`/visitantes/historia/tradiciones/${index}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Ver detalles →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Lugares Históricos - Solo mostrar si hay lugares */}
        {historyData?.places && historyData.places.length > 0 && (
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
              Lugares Históricos
            </h2>
            <Link
              href="/visitantes/historia/lugares"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Ver todos los lugares
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyData.places.slice(0, 6).map((place, index) => (
              <div key={index} className="card-theme">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {place.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {place.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {place.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium">
                        {place.significance}
                      </span>
                      <Link
                        href={`/visitantes/historia/lugares/${index}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Ver detalles →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Galería de Fotos Históricas - Solo mostrar si hay imágenes activas */}
        {galleryImages.filter(img => img.isActive).length > 0 && (
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Galería Histórica
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages
              .filter(img => img.isActive)
              .sort((a, b) => a.order - b.order)
              .map((image, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                      {image.caption}
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {image.category}
                    </span>
                    {image.year && (
                      <span className="text-xs text-gray-500">
                        {image.year}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {image.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {image.description}
                  </p>
                  
                  {image.location && (
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{image.location}</span>
                    </div>
                  )}
                  
                  {image.photographer && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Camera className="w-3 h-3 mr-1" />
                      <span>{image.photographer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Enlaces Relacionados */}
        <section className="card-theme">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Explora Más
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {historyData.exploreLinks.length > 0 ? (
              historyData.exploreLinks.map((link, index) => (
                <Link 
                  key={index}
                  href={link.url} 
                  className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl hover:from-primary-100 hover:to-primary-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white group-hover:bg-primary-700 transition-colors duration-300">
                    {getIconByName(link.icon)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-800 transition-colors duration-300">
                      {link.title}
                    </h3>
                    <p className="text-sm text-primary-700 group-hover:text-primary-600 transition-colors duration-300">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary-600 group-hover:text-primary-700 group-hover:translate-x-1 transition-all duration-300" />
                </Link>
              ))
            ) : (
              <>
                <Link 
                  href="/visitantes/lugares" 
                  className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 group-hover:text-blue-800 transition-colors duration-300">
                      Lugares de Interés
                    </h3>
                    <p className="text-sm text-blue-700 group-hover:text-blue-600 transition-colors duration-300">
                      Descubre los sitios más importantes de la comunidad
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-300" />
                </Link>
                <Link 
                  href="/visitantes/eventos" 
                  className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white group-hover:bg-green-700 transition-colors duration-300">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 group-hover:text-green-800 transition-colors duration-300">
                      Eventos Culturales
                    </h3>
                    <p className="text-sm text-green-700 group-hover:text-green-600 transition-colors duration-300">
                      Participa en nuestras celebraciones tradicionales
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-600 group-hover:text-green-700 group-hover:translate-x-1 transition-all duration-300" />
                </Link>
                <Link 
                  href="/visitantes/contacto" 
                  className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white group-hover:bg-purple-700 transition-colors duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-purple-900 group-hover:text-purple-800 transition-colors duration-300">
                      Contacto
                    </h3>
                    <p className="text-sm text-purple-700 group-hover:text-purple-600 transition-colors duration-300">
                      Conéctate con nuestra comunidad
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-600 group-hover:text-purple-700 group-hover:translate-x-1 transition-all duration-300" />
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HistoryPage;
