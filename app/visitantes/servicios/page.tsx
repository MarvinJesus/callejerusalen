'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Clock, Phone, Star, Navigation, ExternalLink } from 'lucide-react';
import { LocalService } from '@/lib/history-service';

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<LocalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    'Pulperías',
    'Restaurantes',
    'Artesanías',
    'Transporte',
    'Tiendas',
    'Servicios',
    'Otros'
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar servicios');
      }

      const data = await response.json();
      setServices(data.historyData?.services || []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      setError('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = (service.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    const isActive = service.isActive;
    return matchesSearch && matchesCategory && isActive;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Pulperías': 'bg-blue-100 text-blue-800',
      'Restaurantes': 'bg-green-100 text-green-800',
      'Artesanías': 'bg-purple-100 text-purple-800',
      'Transporte': 'bg-orange-100 text-orange-800',
      'Tiendas': 'bg-pink-100 text-pink-800',
      'Servicios': 'bg-indigo-100 text-indigo-800',
      'Otros': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleCallService = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleViewOnMap = (service: LocalService) => {
    if (service.latitude !== undefined && service.longitude !== undefined) {
      const lat = service.latitude;
      const lng = service.longitude;
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else {
      const encodedAddress = encodeURIComponent(service.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <MapPin className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar servicios</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadServices}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Servicios Locales de Calle Jerusalén
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre los servicios auténticos de nuestra comunidad. Desde pulperías tradicionales 
              hasta talleres de artesanías y servicios comunitarios únicos.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white appearance-none"
                >
                  <option value="">Todos</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Servicios */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory ? 'No se encontraron servicios' : 'No hay servicios disponibles'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory 
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'Los servicios aparecerán aquí cuando estén disponibles'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Imagen */}
                {service.image && (
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                        {service.category}
                      </span>
                    </div>
                    {service.rating && service.rating > 0 && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center bg-white bg-opacity-90 rounded-full px-2 py-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm font-medium text-gray-900">{service.rating}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contenido */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                  
                  {/* Información de contacto */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{service.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{service.hours}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{service.phone}</span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewOnMap(service)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Ver en Mapa
                    </button>
                    <button
                      onClick={() => handleCallService(service.phone)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Llamar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Información adicional */}
        {filteredServices.length > 0 && (
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ¿Conoces algún servicio que no esté listado?
              </h3>
              <p className="text-blue-700 mb-4">
                Ayúdanos a mantener actualizado el directorio de servicios locales. 
                Contacta con nosotros para agregar nuevos servicios.
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <ExternalLink className="w-4 h-4 mr-2" />
                Contactar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;