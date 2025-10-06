'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  Star, 
  Navigation, 
  ExternalLink,
  Calendar,
  Globe,
  Mail,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { LocalService } from '@/lib/history-service';

const ServiceDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  
  const [service, setService] = useState<LocalService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedServices, setRelatedServices] = useState<LocalService[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (serviceId) {
      loadServiceDetails();
    }
  }, [serviceId]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar servicios');
      }

      const data = await response.json();
      const services = data.historyData?.services || [];
      
      const foundService = services.find((s: LocalService) => s.id === serviceId);
      
      if (!foundService) {
        throw new Error('Servicio no encontrado');
      }

      setService(foundService);
      
      // Cargar servicios relacionados (misma categoría, excluyendo el actual)
      const related = services
        .filter((s: LocalService) => 
          s.id !== serviceId && 
          s.category === foundService.category && 
          s.isActive
        )
        .slice(0, 3);
      
      setRelatedServices(related);
      
    } catch (error) {
      console.error('Error al cargar detalles del servicio:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar el servicio');
    } finally {
      setLoading(false);
    }
  };

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

  const handleViewOnMap = () => {
    if (service?.latitude !== undefined && service?.longitude !== undefined) {
      const lat = service.latitude;
      const lng = service.longitude;
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else if (service?.address) {
      const encodedAddress = encodeURIComponent(service.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.name,
          text: service?.description,
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles del servicio...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <MapPin className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Servicio no encontrado'}
          </h2>
          <p className="text-gray-600 mb-4">
            El servicio que buscas no existe o no está disponible.
          </p>
          <Link
            href="/visitantes/servicios"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Servicios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/visitantes/servicios"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver a Servicios
            </Link>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Compartir"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información básica */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Imagen principal */}
              {service.image && (
                <div className="relative h-64 md:h-80 bg-gray-200 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(service.category)}`}>
                      {service.category}
                    </span>
                  </div>
                  {service.rating && service.rating > 0 && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center bg-white bg-opacity-90 rounded-full px-3 py-1">
                        <div className="flex items-center">
                          {renderStars(service.rating)}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">{service.rating}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
                    <p className="text-gray-600 text-lg leading-relaxed">{service.description}</p>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Dirección</h3>
                        <p className="text-gray-600">{service.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Horarios</h3>
                        <p className="text-gray-600">{service.hours}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Phone className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Teléfono</h3>
                        <p className="text-gray-600">{service.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleViewOnMap}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Ver en Mapa
                  </button>
                  <button
                    onClick={() => handleCallService(service.phone)}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Llamar Ahora
                  </button>
                </div>
              </div>
            </div>

            {/* Servicios relacionados */}
            {relatedServices.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Otros {service.category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedServices.map((relatedService) => (
                    <Link
                      key={relatedService.id}
                      href={`/visitantes/servicios/${relatedService.id}`}
                      className="group block bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors"
                    >
                      {relatedService.image && (
                        <div className="h-32 bg-gray-200 overflow-hidden">
                          <img
                            src={relatedService.image}
                            alt={relatedService.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                          {relatedService.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {relatedService.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Información de contacto destacada */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-primary-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service.phone}</p>
                    <p className="text-xs text-gray-500">Teléfono</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service.address}</p>
                    <p className="text-xs text-gray-500">Dirección</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-primary-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service.hours}</p>
                    <p className="text-xs text-gray-500">Horarios</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleCallService(service.phone)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar
                </button>
              </div>
            </div>

            {/* Categoría */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categoría</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(service.category)}`}>
                {service.category}
              </span>
              <Link
                href={`/visitantes/servicios?category=${encodeURIComponent(service.category)}`}
                className="block mt-3 text-sm text-primary-600 hover:text-primary-700"
              >
                Ver más {service.category.toLowerCase()}
              </Link>
            </div>

            {/* Calificación */}
            {service.rating && service.rating > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Calificación</h3>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {renderStars(service.rating)}
                  </div>
                  <span className="ml-2 text-lg font-medium text-gray-900">{service.rating}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de imagen */}
      {showImageModal && service.image && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={service.image}
              alt={service.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetailPage;
