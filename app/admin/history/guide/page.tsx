'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Heart,
  Info,
  Users,
  Shield,
  Clock,
  Navigation,
  Calendar,
  Wifi,
  ParkingCircle,
  MapPin,
  Phone,
  CheckCircle
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { VisitorsGuideData, GuideSection, GuideAmenity, GuideTip, EmergencyContact } from '@/lib/history-service';

const GuideAdminPage: React.FC = () => {
  const [guideData, setGuideData] = useState<VisitorsGuideData>({
    title: 'Guía para Visitantes',
    subtitle: 'Todo lo que necesitas saber para disfrutar al máximo tu visita a nuestra comunidad.',
    sections: [],
    amenities: [],
    tips: [],
    emergencyContacts: [],
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'sections' | 'amenities' | 'tips' | 'contacts'>('sections');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formType, setFormType] = useState<'section' | 'amenity' | 'tip' | 'contact'>('section');

  const availableIcons = [
    'Heart', 'Info', 'Users', 'Shield', 'AlertTriangle', 'Clock', 'Navigation', 
    'Calendar', 'Wifi', 'ParkingCircle', 'MapPin', 'Phone', 'CheckCircle'
  ];

  useEffect(() => {
    loadGuideData();
  }, []);

  const loadGuideData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/guide');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de la guía');
      }

      const data = await response.json();
      setGuideData(data.guideData);
    } catch (error) {
      console.error('Error al cargar datos de la guía:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGuideData = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guideData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar datos de la guía');
      }

      const result = await response.json();
      setGuideData(result.guideData);
      alert('Guía de visitantes actualizada exitosamente');
    } catch (error) {
      console.error('Error al guardar datos de la guía:', error);
      alert('Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (type: 'section' | 'amenity' | 'tip' | 'contact') => {
    setFormType(type);
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: any, type: 'section' | 'amenity' | 'tip' | 'contact') => {
    setFormType(type);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteItem = (id: string, type: 'section' | 'amenity' | 'tip' | 'contact') => {
    if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      const newData = { ...guideData };
      
      switch (type) {
        case 'section':
          newData.sections = newData.sections.filter((item: GuideSection) => item.id !== id);
          break;
        case 'amenity':
          newData.amenities = newData.amenities.filter((item: GuideAmenity) => item.id !== id);
          break;
        case 'tip':
          newData.tips = newData.tips.filter((item: GuideTip) => item.id !== id);
          break;
        case 'contact':
          newData.emergencyContacts = newData.emergencyContacts.filter((item: EmergencyContact) => item.id !== id);
          break;
      }
      
      setGuideData(newData);
    }
  };

  const handleSaveItem = (itemData: any) => {
    const newData = { ...guideData };
    const now = new Date();
    
    if (editingItem) {
      // Actualizar elemento existente
      switch (formType) {
        case 'section':
          newData.sections = newData.sections.map((item: GuideSection) => 
            item.id === editingItem.id ? { ...item, ...itemData, updatedAt: now } : item
          );
          break;
        case 'amenity':
          newData.amenities = newData.amenities.map((item: GuideAmenity) => 
            item.id === editingItem.id ? { ...item, ...itemData, updatedAt: now } : item
          );
          break;
        case 'tip':
          newData.tips = newData.tips.map((item: GuideTip) => 
            item.id === editingItem.id ? { ...item, ...itemData, updatedAt: now } : item
          );
          break;
        case 'contact':
          newData.emergencyContacts = newData.emergencyContacts.map((item: EmergencyContact) => 
            item.id === editingItem.id ? { ...item, ...itemData, updatedAt: now } : item
          );
          break;
      }
    } else {
      // Crear nuevo elemento
      const newItem = {
        ...itemData,
        id: Date.now().toString(),
        order: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      
      switch (formType) {
        case 'section':
          newData.sections.push(newItem as GuideSection);
          break;
        case 'amenity':
          newData.amenities.push(newItem as GuideAmenity);
          break;
        case 'tip':
          newData.tips.push(newItem as GuideTip);
          break;
        case 'contact':
          newData.emergencyContacts.push(newItem as EmergencyContact);
          break;
      }
    }
    
    setGuideData(newData);
    setShowForm(false);
    setEditingItem(null);
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

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de la guía...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Administrar Guía de Visitantes</h1>
                <p className="text-gray-600 mt-2">Gestiona el contenido de la guía para visitantes</p>
              </div>
              <button
                onClick={saveGuideData}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          {/* Información general */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={guideData.title}
                  onChange={(e) => setGuideData({ ...guideData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={guideData.subtitle}
                  onChange={(e) => setGuideData({ ...guideData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'sections', label: 'Secciones', count: guideData.sections.length },
                  { id: 'amenities', label: 'Comodidades', count: guideData.amenities.length },
                  { id: 'tips', label: 'Consejos', count: guideData.tips.length },
                  { id: 'contacts', label: 'Contactos de Emergencia', count: guideData.emergencyContacts.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Tab content */}
              {activeTab === 'sections' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Secciones de la Guía</h3>
                    <button
                      onClick={() => handleAddItem('section')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Sección
                    </button>
                  </div>
                  <div className="space-y-4">
                    {guideData.sections.map((section) => (
                      <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                              {getIconComponent(section.icon)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{section.title}</h4>
                              <p className="text-sm text-gray-500">{section.content.length} elementos</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditItem(section, 'section')}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(section.id!, 'section')}
                              className="p-2 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'amenities' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Comodidades</h3>
                    <button
                      onClick={() => handleAddItem('amenity')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Comodidad
                    </button>
                  </div>
                  <div className="space-y-4">
                    {guideData.amenities.map((amenity) => (
                      <div key={amenity.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                              {getIconComponent(amenity.icon)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{amenity.name}</h4>
                              <p className="text-sm text-gray-500">{amenity.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              amenity.available 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {amenity.available ? 'Disponible' : 'No disponible'}
                            </span>
                            <button
                              onClick={() => handleEditItem(amenity, 'amenity')}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(amenity.id!, 'amenity')}
                              className="p-2 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'tips' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Consejos Útiles</h3>
                    <button
                      onClick={() => handleAddItem('tip')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Consejo
                    </button>
                  </div>
                  <div className="space-y-4">
                    {guideData.tips.map((tip) => (
                      <div key={tip.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                              {getIconComponent(tip.icon)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{tip.title}</h4>
                              <p className="text-sm text-gray-500">{tip.description}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditItem(tip, 'tip')}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(tip.id!, 'tip')}
                              className="p-2 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Contactos de Emergencia</h3>
                    <button
                      onClick={() => handleAddItem('contact')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Contacto
                    </button>
                  </div>
                  <div className="space-y-4">
                    {guideData.emergencyContacts.map((contact) => (
                      <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              contact.isEmergency ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              <Phone className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{contact.name}</h4>
                              <p className="text-sm text-gray-500">{contact.phone}</p>
                              <p className="text-sm text-gray-500">{contact.availableHours}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              contact.isEmergency 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {contact.isEmergency ? 'Emergencia' : 'General'}
                            </span>
                            <button
                              onClick={() => handleEditItem(contact, 'contact')}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(contact.id!, 'contact')}
                              className="p-2 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Formulario */}
        {showForm && (
          <GuideForm
            type={formType}
            item={editingItem}
            availableIcons={availableIcons}
            onSave={handleSaveItem}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

// Componente del formulario
interface GuideFormProps {
  type: 'section' | 'amenity' | 'tip' | 'contact';
  item: any;
  availableIcons: string[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

const GuideForm: React.FC<GuideFormProps> = ({ type, item, availableIcons, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      // Valores por defecto
      setFormData({
        title: '',
        description: '',
        icon: 'Info',
        content: [''],
        name: '',
        phone: '',
        availableHours: '',
        isEmergency: false,
        available: true,
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Procesar datos según el tipo
    let processedData = { ...formData };
    
    if (type === 'section') {
      processedData.content = formData.content.filter((item: string) => item.trim() !== '');
    }
    
    onSave(processedData);
  };

  const addContentItem = () => {
    setFormData({
      ...formData,
      content: [...(formData.content || []), '']
    });
  };

  const removeContentItem = (index: number) => {
    const newContent = formData.content.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      content: newContent
    });
  };

  const updateContentItem = (index: number, value: string) => {
    const newContent = [...formData.content];
    newContent[index] = value;
    setFormData({
      ...formData,
      content: newContent
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {item ? 'Editar' : 'Agregar'} {
                type === 'section' ? 'Sección' :
                type === 'amenity' ? 'Comodidad' :
                type === 'tip' ? 'Consejo' : 'Contacto'
              }
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'section' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icono
                  </label>
                  <select
                    value={formData.icon || 'Info'}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido *
                  </label>
                  {formData.content?.map((item: string, index: number) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateContentItem(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder={`Elemento ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeContentItem(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addContentItem}
                    className="mt-2 px-3 py-2 text-primary-600 hover:text-primary-800 text-sm"
                  >
                    + Agregar elemento
                  </button>
                </div>
              </>
            )}

            {type === 'amenity' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icono
                  </label>
                  <select
                    value={formData.icon || 'Info'}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available || false}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                    Disponible
                  </label>
                </div>
              </>
            )}

            {type === 'tip' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icono
                  </label>
                  <select
                    value={formData.icon || 'Info'}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {type === 'contact' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horarios de Disponibilidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.availableHours || ''}
                    onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
                    placeholder="Ej: 24/7 o Lunes a Viernes 8:00 AM - 6:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isEmergency"
                    checked={formData.isEmergency || false}
                    onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isEmergency" className="ml-2 block text-sm text-gray-900">
                    Es contacto de emergencia
                  </label>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Save className="w-4 h-4 mr-2 inline" />
                {item ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuideAdminPage;









