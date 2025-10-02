'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import InteractiveMap from '@/components/InteractiveMap';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Clock, Star, Search, Filter, Eye, Navigation } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Place {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  hours: string;
  rating: number;
  image: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const PlacesPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showMap, setShowMap] = useState(false);

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'miradores', label: 'Miradores' },
    { value: 'pulperias', label: 'Pulperías' },
    { value: 'parques', label: 'Parques' },
    { value: 'cultura', label: 'Cultura' },
    { value: 'naturaleza', label: 'Naturaleza' },
    { value: 'historia', label: 'Históricos' },
  ];

  // Datos de ejemplo para lugares
  const samplePlaces: Place[] = [
    {
      id: '1',
      name: 'Mirador de la Cruz',
      description: 'Punto de observación natural que ofrece vistas panorámicas espectaculares de toda la región. Lugar sagrado y de peregrinación.',
      category: 'miradores',
      address: 'Cerro de la Cruz, Calle Jerusalén',
      hours: '5:00 AM - 8:00 PM',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      coordinates: { lat: 19.4326, lng: -99.1332 }
    },
    {
      id: '2',
      name: 'Pulpería El Progreso',
      description: 'La pulpería más antigua de Calle Jerusalén, en funcionamiento desde 1955. Ofrece productos tradicionales y es un punto de encuentro comunitario.',
      category: 'pulperias',
      address: 'Calle Principal #45',
      hours: '6:00 AM - 9:00 PM',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      coordinates: { lat: 19.4336, lng: -99.1342 }
    },
    {
      id: '3',
      name: 'Parque Central',
      description: 'Hermoso parque con áreas verdes, juegos infantiles y pista de caminata. Centro de actividades comunitarias.',
      category: 'parques',
      address: 'Plaza Central, Calle Jerusalén',
      hours: '6:00 AM - 10:00 PM',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      coordinates: { lat: 19.4316, lng: -99.1322 }
    },
    {
      id: '4',
      name: 'Casa de los Fundadores',
      description: 'La primera casa construida en Calle Jerusalén (1952), ahora convertida en museo comunitario. Patrimonio histórico de la comunidad.',
      category: 'historia',
      address: 'Calle de los Fundadores #1',
      hours: '9:00 AM - 5:00 PM',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      coordinates: { lat: 19.4306, lng: -99.1312 }
    },
    {
      id: '5',
      name: 'Mirador del Valle',
      description: 'Mirador natural con vista al valle circundante. Ideal para fotografía y contemplación de la naturaleza.',
      category: 'miradores',
      address: 'Sendero del Valle, Calle Jerusalén',
      hours: '24 horas',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      coordinates: { lat: 19.4296, lng: -99.1302 }
    },
    {
      id: '6',
      name: 'Pulpería La Esperanza',
      description: 'Pulpería familiar que ofrece productos frescos, artesanías locales y comida tradicional. Ambiente acogedor y familiar.',
      category: 'pulperias',
      address: 'Calle de la Esperanza #23',
      hours: '7:00 AM - 8:00 PM',
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      coordinates: { lat: 19.4286, lng: -99.1292 }
    },
    {
      id: '7',
      name: 'Jardín Botánico Comunitario',
      description: 'Jardín con especies nativas de la región, senderos interpretativos y área de conservación. Ideal para ecoturismo.',
      category: 'naturaleza',
      address: 'Calle Verde #78',
      hours: '7:00 AM - 7:00 PM',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      coordinates: { lat: 19.4276, lng: -99.1282 }
    },
    {
      id: '8',
      name: 'Casa Cultural',
      description: 'Centro cultural que alberga exposiciones, talleres y eventos comunitarios. Promueve las tradiciones locales.',
      category: 'cultura',
      address: 'Plaza Cultural #12',
      hours: '8:00 AM - 8:00 PM',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      coordinates: { lat: 19.4266, lng: -99.1272 }
    }
  ];

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/places');
      
      if (!response.ok) {
        throw new Error('Error al cargar lugares');
      }
      
      const data = await response.json();
      console.log('Lugares cargados desde API:', data.places);
      setPlaces(data.places || []);
      setFilteredPlaces(data.places || []);
    } catch (error) {
      console.error('Error al cargar lugares:', error);
      // En caso de error, mostrar mensaje de error en lugar de usar datos de ejemplo
      setPlaces([]);
      setFilteredPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = places;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(place => place.category === selectedCategory);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(place =>
        (place.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (place.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPlaces(filtered);
  }, [places, searchTerm, selectedCategory]);

  // Permitir acceso a todos los usuarios (incluyendo visitantes no registrados)
  // No hay restricciones de acceso para la página de lugares

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Lugares de Interés en Calle Jerusalén
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explora los lugares únicos de nuestra comunidad. Desde miradores con vistas espectaculares 
            hasta pulperías tradicionales y sitios históricos llenos de cultura.
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
                  placeholder="Buscar lugares..."
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

            {/* Botón para mostrar/ocultar mapa */}
            <button
              onClick={() => setShowMap(!showMap)}
              className="btn-theme-secondary flex items-center space-x-2"
            >
              {showMap ? <Eye className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
              <span>{showMap ? 'Ocultar Mapa' : 'Ver Mapa'}</span>
            </button>
          </div>
        </div>

        {/* Mapa Interactivo */}
        {showMap && (
          <div className="card-theme mb-8">
            <InteractiveMap 
              places={filteredPlaces}
              selectedPlace={selectedPlace}
              onPlaceSelect={setSelectedPlace}
            />
          </div>
        )}

        {/* Lista de lugares */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlaces.map(place => (
              <div key={place.id} className="card-theme overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{place.rating}</span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {categories.find(cat => cat.value === place.category)?.label}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors duration-300">
                    {place.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {place.description}
                  </p>
                  
                  <div className="space-y-3 text-sm text-gray-500 mb-6">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span>{place.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary-500" />
                      <span>{place.hours}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/visitantes/lugares/${place.id}`}
                      className="flex-1 btn-theme-primary flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Link>
                    <button 
                      onClick={() => {
                        setSelectedPlace(place);
                        setShowMap(true);
                      }}
                      className="flex-1 btn-theme-secondary"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Mapa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron lugares
            </h3>
            <p className="text-gray-600">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacesPage;


