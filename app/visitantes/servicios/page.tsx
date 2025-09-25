'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Clock, Star, Search, Filter, Phone, Globe } from 'lucide-react';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  website?: string;
  hours: string;
  rating: number;
  image: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'restaurantes', label: 'Restaurantes' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'tiendas', label: 'Tiendas' },
    { value: 'salud', label: 'Salud' },
    { value: 'bancos', label: 'Bancos' },
  ];

  // Datos de ejemplo para servicios
  const sampleServices: Service[] = [
    {
      id: '1',
      name: 'Restaurante El Buen Sabor',
      description: 'Comida tradicional mexicana con ingredientes frescos y ambiente familiar.',
      category: 'restaurantes',
      address: 'Calle Principal #123',
      phone: '+1 (555) 123-4567',
      website: 'www.elbuensabor.com',
      hours: '7:00 AM - 10:00 PM',
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      coordinates: { lat: 19.4326, lng: -99.1332 }
    },
    {
      id: '2',
      name: 'Taxi Seguro',
      description: 'Servicio de taxi confiable con conductores certificados y vehículos modernos.',
      category: 'transporte',
      address: 'Avenida Transporte #456',
      phone: '+1 (555) 987-6543',
      hours: '24/7',
      rating: 4.1,
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      coordinates: { lat: 19.4336, lng: -99.1342 }
    },
    {
      id: '3',
      name: 'Supermercado La Familia',
      description: 'Supermercado con productos frescos, farmacia y servicios bancarios.',
      category: 'tiendas',
      address: 'Plaza Comercial #789',
      phone: '+1 (555) 456-7890',
      website: 'www.lafamilia.com',
      hours: '6:00 AM - 11:00 PM',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      coordinates: { lat: 19.4316, lng: -99.1322 }
    },
    {
      id: '4',
      name: 'Clínica San José',
      description: 'Clínica médica con servicios de consulta general y emergencias.',
      category: 'salud',
      address: 'Calle Salud #321',
      phone: '+1 (555) 321-9876',
      hours: '8:00 AM - 8:00 PM',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400',
      coordinates: { lat: 19.4306, lng: -99.1312 }
    },
    {
      id: '5',
      name: 'Banco Nacional',
      description: 'Sucursal bancaria con cajeros automáticos y servicios financieros completos.',
      category: 'bancos',
      address: 'Avenida Financiera #654',
      phone: '+1 (555) 654-3210',
      website: 'www.bancanacional.com',
      hours: '9:00 AM - 4:00 PM',
      rating: 4.2,
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
      coordinates: { lat: 19.4296, lng: -99.1302 }
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setServices(sampleServices);
      setFilteredServices(sampleServices);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = services;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory]);

  // Permitir acceso a todos los usuarios (incluyendo visitantes no registrados)
  // No hay restricciones de acceso para la página de servicios

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Servicios Locales
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Encuentra los mejores servicios cerca de ti. Desde restaurantes y tiendas 
            hasta servicios de salud, transporte y bancarios.
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
                  placeholder="Buscar servicios..."
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

        {/* Lista de servicios */}
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
        ) : filteredServices.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map(service => (
              <div key={service.id} className="card-theme overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{service.rating}</span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {categories.find(cat => cat.value === service.category)?.label}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors duration-300">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="space-y-3 text-sm text-gray-500 mb-6">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span>{service.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary-500" />
                      <span>{service.hours}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-primary-500" />
                      <span>{service.phone}</span>
                    </div>
                    {service.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-primary-500" />
                        <a 
                          href={`https://${service.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          {service.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button className="flex-1 btn-theme-primary">
                      Ver en Mapa
                    </button>
                    <a 
                      href={`tel:${service.phone}`}
                      className="flex-1 btn-theme-secondary text-center"
                    >
                      Llamar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron servicios
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

export default ServicesPage;


