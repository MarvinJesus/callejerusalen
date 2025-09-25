'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Camera, AlertTriangle, Filter, Search } from 'lucide-react';

// Importar MapComponent dinámicamente para evitar problemas de SSR
const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});

interface MapPoint {
  id: string;
  name: string;
  type: 'place' | 'service' | 'camera' | 'alert';
  coordinates: [number, number];
  description: string;
  address?: string;
  phone?: string;
  website?: string;
  status?: 'online' | 'offline' | 'maintenance';
}

const MapPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<MapPoint[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['place', 'service', 'camera']);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo para puntos del mapa
  const samplePoints: MapPoint[] = [
    // Lugares
    {
      id: '1',
      name: 'Parque Central',
      type: 'place',
      coordinates: [19.4326, -99.1332],
      description: 'Hermoso parque con áreas verdes y juegos infantiles',
      address: 'Calle Principal #123'
    },
    {
      id: '2',
      name: 'Cancha de Fútbol',
      type: 'place',
      coordinates: [19.4336, -99.1342],
      description: 'Cancha de fútbol 7 con césped sintético',
      address: 'Avenida Deportiva #456'
    },
    {
      id: '3',
      name: 'Biblioteca Comunitaria',
      type: 'place',
      coordinates: [19.4316, -99.1322],
      description: 'Biblioteca con amplia colección de libros',
      address: 'Plaza Cultural #789'
    },
    
    // Servicios
    {
      id: '4',
      name: 'Restaurante El Buen Sabor',
      type: 'service',
      coordinates: [19.4306, -99.1312],
      description: 'Comida tradicional mexicana',
      address: 'Calle Principal #123',
      phone: '+1 (555) 123-4567',
      website: 'www.elbuensabor.com'
    },
    {
      id: '5',
      name: 'Supermercado La Familia',
      type: 'service',
      coordinates: [19.4296, -99.1302],
      description: 'Supermercado con productos frescos',
      address: 'Plaza Comercial #789',
      phone: '+1 (555) 456-7890'
    },
    {
      id: '6',
      name: 'Clínica San José',
      type: 'service',
      coordinates: [19.4286, -99.1292],
      description: 'Clínica médica con servicios de consulta general',
      address: 'Calle Salud #321',
      phone: '+1 (555) 321-9876'
    },
    
    // Cámaras
    {
      id: '7',
      name: 'Cámara - Entrada Principal',
      type: 'camera',
      coordinates: [19.4326, -99.1332],
      description: 'Monitoreo de la entrada principal',
      status: 'online'
    },
    {
      id: '8',
      name: 'Cámara - Parque Central',
      type: 'camera',
      coordinates: [19.4326, -99.1332],
      description: 'Monitoreo del parque central',
      status: 'online'
    },
    {
      id: '9',
      name: 'Cámara - Estacionamiento',
      type: 'camera',
      coordinates: [19.4336, -99.1342],
      description: 'Monitoreo del estacionamiento',
      status: 'offline'
    },
    
    // Alertas
    {
      id: '10',
      name: 'Alerta - Actividad Sospechosa',
      type: 'alert',
      coordinates: [19.4336, -99.1342],
      description: 'Reporte de actividad sospechosa en el estacionamiento'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setAllPoints(samplePoints);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = allPoints;

    // Filtrar por tipo
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(point => selectedTypes.includes(point.type));
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(point =>
        point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        point.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPoints(filtered);
  }, [allPoints, selectedTypes, searchTerm]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getTypeStats = () => {
    return {
      places: allPoints.filter(p => p.type === 'place').length,
      services: allPoints.filter(p => p.type === 'service').length,
      cameras: allPoints.filter(p => p.type === 'camera').length,
      alerts: allPoints.filter(p => p.type === 'alert').length,
    };
  };

  const stats = getTypeStats();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Restringido
            </h2>
            <p className="text-gray-600">
              Necesitas iniciar sesión para acceder a esta página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mapa Interactivo
          </h1>
          <p className="text-gray-600">
            Explora lugares, servicios, cámaras de seguridad y alertas en la comunidad
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Lugares</p>
                <p className="text-xl font-bold text-blue-600">{stats.places}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Servicios</p>
                <p className="text-xl font-bold text-green-600">{stats.services}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Cámaras</p>
                <p className="text-xl font-bold text-purple-600">{stats.cameras}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Alertas</p>
                <p className="text-xl font-bold text-red-600">{stats.alerts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar en el mapa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTypeToggle('place')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTypes.includes('place')
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Lugares ({stats.places})</span>
              </button>

              <button
                onClick={() => handleTypeToggle('service')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTypes.includes('service')
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Servicios ({stats.services})</span>
              </button>

              {userProfile?.role === 'comunidad' && (
                <button
                  onClick={() => handleTypeToggle('camera')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTypes.includes('camera')
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Cámaras ({stats.cameras})</span>
                </button>
              )}

              {userProfile?.role === 'comunidad' && (
                <button
                  onClick={() => handleTypeToggle('alert')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTypes.includes('alert')
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Alertas ({stats.alerts})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          ) : (
            <MapComponent
              points={filteredPoints}
              center={[19.4326, -99.1332]}
              zoom={15}
              height="500px"
              showControls={true}
            />
          )}
        </div>

        {/* Points List */}
        {filteredPoints.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Puntos en el Mapa ({filteredPoints.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPoints.map(point => (
                <div key={point.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{point.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      point.type === 'place' ? 'bg-blue-100 text-blue-800' :
                      point.type === 'service' ? 'bg-green-100 text-green-800' :
                      point.type === 'camera' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {point.type === 'place' ? 'Lugar' :
                       point.type === 'service' ? 'Servicio' :
                       point.type === 'camera' ? 'Cámara' : 'Alerta'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {point.description}
                  </p>
                  
                  {point.address && (
                    <p className="text-xs text-gray-500 mb-1">
                      📍 {point.address}
                    </p>
                  )}
                  
                  {point.phone && (
                    <p className="text-xs text-gray-500 mb-1">
                      📞 {point.phone}
                    </p>
                  )}
                  
                  {point.status && (
                    <p className="text-xs text-gray-500">
                      Estado: {point.status === 'online' ? 'En línea' : 
                               point.status === 'offline' ? 'Desconectado' : 'Mantenimiento'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
