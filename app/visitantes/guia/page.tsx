'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Shield, 
  Heart,
  Info,
  AlertTriangle,
  CheckCircle,
  Star,
  Navigation,
  Calendar,
  Wifi,
  ParkingCircle
} from 'lucide-react';
import { VisitorsGuideData } from '@/lib/history-service';

const VisitorsGuidePage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [guideData, setGuideData] = useState<VisitorsGuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuideData();
  }, []);

  const loadGuideData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/guide');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de la guía');
      }

      const data = await response.json();
      setGuideData(data.guideData);
    } catch (error) {
      console.error('Error al cargar datos de la guía:', error);
      setError('Error al cargar la guía de visitantes');
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Heart: <Heart className="w-6 h-6" />,
      Info: <Info className="w-6 h-6" />,
      Users: <Users className="w-6 h-6" />,
      Shield: <Shield className="w-6 h-6" />,
      AlertTriangle: <AlertTriangle className="w-6 h-6" />,
      Clock: <Clock className="w-6 h-6" />,
      Navigation: <Navigation className="w-6 h-6" />,
      Calendar: <Calendar className="w-6 h-6" />,
      Wifi: <Wifi className="w-6 h-6" />,
      ParkingCircle: <ParkingCircle className="w-6 h-6" />,
      MapPin: <MapPin className="w-6 h-6" />,
      Phone: <Phone className="w-6 h-6" />,
      CheckCircle: <CheckCircle className="w-6 h-6" />,
    };
    return icons[iconName] || <Info className="w-6 h-6" />;
  };

  const getIconComponentSmall = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Heart: <Heart className="w-5 h-5" />,
      Info: <Info className="w-5 h-5" />,
      Users: <Users className="w-5 h-5" />,
      Shield: <Shield className="w-5 h-5" />,
      AlertTriangle: <AlertTriangle className="w-5 h-5" />,
      Clock: <Clock className="w-5 h-5" />,
      Navigation: <Navigation className="w-5 h-5" />,
      Calendar: <Calendar className="w-5 h-5" />,
      Wifi: <Wifi className="w-5 h-5" />,
      ParkingCircle: <ParkingCircle className="w-5 h-5" />,
      MapPin: <MapPin className="w-5 h-5" />,
      Phone: <Phone className="w-5 h-5" />,
      CheckCircle: <CheckCircle className="w-5 h-5" />,
    };
    return icons[iconName] || <Info className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando guía de visitantes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !guideData) {
    return (
      <div className="min-h-screen bg-theme">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar la guía</h2>
            <p className="text-gray-600 mb-4">{error || 'No se pudieron cargar los datos'}</p>
            <button
              onClick={loadGuideData}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {guideData.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {guideData.subtitle}
          </p>
        </div>

        {/* Secciones de la guía */}
        {guideData.sections && guideData.sections.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {guideData.sections.filter(section => section.isActive).map((section) => (
              <div key={section.id} className="card-theme">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                    {getIconComponent(section.icon)}
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Comodidades */}
        {guideData.amenities && guideData.amenities.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Comodidades Disponibles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {guideData.amenities.filter(amenity => amenity.isActive).map((amenity) => (
                <div key={amenity.id} className="card-theme text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    {getIconComponent(amenity.icon)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {amenity.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {amenity.description}
                  </p>
                  <div className={`flex items-center justify-center space-x-1 ${
                    amenity.available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {amenity.available ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consejos útiles */}
        {guideData.tips && guideData.tips.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Consejos Útiles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {guideData.tips.filter(tip => tip.isActive).map((tip) => (
                <div key={tip.id} className="card-theme">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                      {getIconComponentSmall(tip.icon)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {tip.title}
                      </h3>
                      <p className="text-gray-600">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enlaces rápidos */}
        <div className="card-theme">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Enlaces Rápidos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/visitantes/lugares" 
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <MapPin className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-blue-900">Lugares</span>
            </Link>
            <Link 
              href="/visitantes/servicios" 
              className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <Users className="w-6 h-6 text-green-600" />
              <span className="font-medium text-green-900">Servicios</span>
            </Link>
            <Link 
              href="/visitantes/eventos" 
              className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200"
            >
              <Calendar className="w-6 h-6 text-orange-600" />
              <span className="font-medium text-orange-900">Eventos</span>
            </Link>
            <Link 
              href="/visitantes/contacto" 
              className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
            >
              <Phone className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-purple-900">Contacto</span>
            </Link>
          </div>
        </div>

        {/* Información de contacto de emergencia */}
        {guideData.emergencyContacts && guideData.emergencyContacts.length > 0 && (
          <div className="mt-12 card-theme bg-red-50 border-red-200">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h3 className="text-2xl font-semibold text-red-900">
                Contacto de Emergencia
              </h3>
            </div>
            <p className="text-red-800 mb-4">
              En caso de emergencia, contacta inmediatamente a:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {guideData.emergencyContacts.filter(contact => contact.isActive).map((contact) => (
                <div key={contact.id} className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{contact.name}</h4>
                  <p className="text-2xl font-bold text-red-600">{contact.phone}</p>
                  <p className="text-sm text-gray-600">{contact.availableHours}</p>
                  {contact.description && (
                    <p className="text-sm text-gray-500 mt-1">{contact.description}</p>
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

export default VisitorsGuidePage;
