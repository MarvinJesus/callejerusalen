'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Clock, Star, Search, Filter } from 'lucide-react';
import Image from 'next/image';

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

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'recreacion', label: 'Recreación' },
    { value: 'deportes', label: 'Deportes' },
    { value: 'cultura', label: 'Cultura' },
    { value: 'naturaleza', label: 'Naturaleza' },
  ];

  // Datos de ejemplo para lugares
  const samplePlaces: Place[] = [
    {
      id: '1',
      name: 'Parque Central',
      description: 'Hermoso parque con áreas verdes, juegos infantiles y pista de caminata.',
      category: 'recreacion',
      address: 'Calle Principal #123',
      hours: '6:00 AM - 10:00 PM',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      coordinates: { lat: 19.4326, lng: -99.1332 }
    },
    {
      id: '2',
      name: 'Cancha de Fútbol',
      description: 'Cancha de fútbol 7 con césped sintético y iluminación nocturna.',
      category: 'deportes',
      address: 'Avenida Deportiva #456',
      hours: '5:00 AM - 11:00 PM',
      rating: 4.2,
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
      coordinates: { lat: 19.4336, lng: -99.1342 }
    },
    {
      id: '3',
      name: 'Biblioteca Comunitaria',
      description: 'Biblioteca con amplia colección de libros y área de estudio.',
      category: 'cultura',
      address: 'Plaza Cultural #789',
      hours: '8:00 AM - 8:00 PM',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      coordinates: { lat: 19.4316, lng: -99.1322 }
    },
    {
      id: '4',
      name: 'Jardín Botánico',
      description: 'Jardín con especies nativas y senderos para caminar.',
      category: 'naturaleza',
      address: 'Calle Verde #321',
      hours: '7:00 AM - 7:00 PM',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      coordinates: { lat: 19.4306, lng: -99.1312 }
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setPlaces(samplePlaces);
      setFilteredPlaces(samplePlaces);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = places;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(place => place.category === selectedCategory);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.description.toLowerCase().includes(searchTerm.toLowerCase())
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
            Lugares de Recreación
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre los mejores lugares para disfrutar en nuestra comunidad. 
            Desde parques y áreas deportivas hasta espacios culturales y de entretenimiento.
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
          </div>
        </div>

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
                  
                  <button className="w-full btn-theme-primary">
                    Ver en Mapa
                  </button>
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


