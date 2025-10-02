'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, Calendar, MapPin, Camera, Tag, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HistoryGalleryImage {
  id?: string;
  title: string;
  description: string;
  url: string;
  caption?: string;
  category: string;
  year?: string;
  location?: string;
  photographer?: string;
  source?: string;
  tags: string[];
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: any[];
  traditions: any[];
  places: any[];
  events: any[];
  gallery: HistoryGalleryImage[];
  exploreLinks: any[];
  isActive: boolean;
}

const GalleryAdminPage: React.FC = () => {
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingImage, setEditingImage] = useState<HistoryGalleryImage | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [newTag, setNewTag] = useState('');

  const categories = [
    'Fotografías Históricas',
    'Documentos',
    'Artefactos',
    'Edificios',
    'Personas',
    'Eventos',
    'Calles y Plazas',
    'Tradiciones',
    'Otros'
  ];

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de historia');
      }

      const data = await response.json();
      setHistoryData(data.historyData);
    } catch (error: any) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const saveImage = async () => {
    if (!editingImage || !historyData) return;

    // Validar campos requeridos
    if (!editingImage.title.trim() || !editingImage.url.trim() || !editingImage.category.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      // Crear una copia del array de imágenes
      const updatedGallery = [...historyData.gallery];
      
      if (editingImageIndex === null) {
        // Es una imagen nueva - usar push() para agregarla al final
        const newImage = { 
          ...editingImage,
          order: updatedGallery.length + 1 // Asignar orden automáticamente
        };
        delete newImage.id; // Remover ID temporal
        updatedGallery.push(newImage);
        
        console.log('Agregando nueva imagen:', newImage);
      } else {
        // Es una imagen existente - actualizar en su posición específica
        if (editingImageIndex >= 0 && editingImageIndex < updatedGallery.length) {
          // Mantener el orden original de la imagen existente
          const originalOrder = updatedGallery[editingImageIndex].order;
          const updatedImage = { 
            ...editingImage, 
            order: originalOrder 
          };
          
          // Reemplazar SOLO la imagen en la posición específica
          updatedGallery[editingImageIndex] = updatedImage;
          
          console.log(`Actualizando imagen en índice ${editingImageIndex}:`, updatedImage);
        } else {
          throw new Error('Índice de imagen inválido para edición');
        }
      }

      const updatedHistoryData = { ...historyData, gallery: updatedGallery };
      setHistoryData(updatedHistoryData);

      // Guardar en el servidor
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar datos de historia');
      }

      toast.success(editingImageIndex === null ? 'Imagen agregada exitosamente' : 'Imagen actualizada exitosamente');
      setShowForm(false);
      setEditingImage(null);
      setEditingImageIndex(null);
    } catch (error: any) {
      console.error('Error al guardar imagen:', error);
      toast.error(error.message || 'Error al guardar la imagen');
    } finally {
      setSaving(false);
    }
  };

  const editImage = (image: HistoryGalleryImage, index: number) => {
    setEditingImage({ ...image });
    setEditingImageIndex(index); // Guardar el índice específico
    setShowForm(true);
    setNewTag('');
  };

  const deleteImage = async (index: number) => {
    if (!historyData || index < 0 || index >= historyData.gallery.length) {
      toast.error('Índice de imagen inválido');
      return;
    }
    
    try {
      setSaving(true);
      
      // Crear una copia del array y eliminar la imagen en el índice especificado
      const updatedGallery = historyData.gallery.filter((_, i) => i !== index);
      
      // Reasignar órdenes para mantener la secuencia
      const reorderedGallery = updatedGallery.map((image, newIndex) => ({
        ...image,
        order: newIndex + 1
      }));
      
      const updatedHistoryData = { ...historyData, gallery: reorderedGallery };
      setHistoryData(updatedHistoryData);

      console.log('Eliminando imagen en índice:', index);
      console.log('Imágenes restantes:', reorderedGallery);

      // Guardar en el servidor
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar datos de historia');
      }

      toast.success('Imagen eliminada exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar imagen:', error);
      toast.error(error.message || 'Error al eliminar la imagen');
      // Revertir cambios en caso de error
      setHistoryData(historyData);
    } finally {
      setSaving(false);
    }
  };

  const toggleImageStatus = async (index: number) => {
    if (!historyData || index < 0 || index >= historyData.gallery.length) return;
    
    try {
      setSaving(true);
      
      const updatedGallery = [...historyData.gallery];
      updatedGallery[index] = {
        ...updatedGallery[index],
        isActive: !updatedGallery[index].isActive
      };
      
      const updatedHistoryData = { ...historyData, gallery: updatedGallery };
      setHistoryData(updatedHistoryData);

      // Guardar en el servidor
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar datos de historia');
      }

      toast.success(`Imagen ${updatedGallery[index].isActive ? 'activada' : 'desactivada'} exitosamente`);
    } catch (error: any) {
      console.error('Error al cambiar estado de imagen:', error);
      toast.error('Error al cambiar estado de la imagen');
      setHistoryData(historyData);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim() || !editingImage) return;
    
    const tag = newTag.trim();
    const currentTags = editingImage.tags || [];
    if (!currentTags.includes(tag)) {
      setEditingImage({
        ...editingImage,
        tags: [...currentTags, tag]
      });
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!editingImage) return;
    
    const currentTags = editingImage.tags || [];
    setEditingImage({
      ...editingImage,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fotografías Históricas':
        return '📸';
      case 'Documentos':
        return '📄';
      case 'Artefactos':
        return '🏺';
      case 'Edificios':
        return '🏛️';
      case 'Personas':
        return '👥';
      case 'Eventos':
        return '🎉';
      case 'Calles y Plazas':
        return '🛣️';
      case 'Tradiciones':
        return '🎭';
      default:
        return '🖼️';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando galería...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <ImageIcon className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar la galería</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadHistoryData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Reintentar
            </button>
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Galería Histórica</h1>
              <p className="text-gray-600 mt-1">Gestiona las imágenes y contenido de la galería histórica</p>
            </div>
            <button
              onClick={() => {
                setEditingImage({
                  title: '',
                  description: '',
                  url: '',
                  caption: '',
                  category: '',
                  year: '',
                  location: '',
                  photographer: '',
                  source: '',
                  tags: [],
                  isActive: true,
                  order: 0
                });
                setEditingImageIndex(null);
                setShowForm(true);
                setNewTag('');
              }}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Imagen
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ImageIcon className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Imágenes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {historyData?.gallery.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Imágenes Activas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {historyData?.gallery.filter(img => img.isActive).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Tag className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Categorías</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(historyData?.gallery.map(img => img.category)).size || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Imágenes */}
        {historyData?.gallery.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay imágenes en la galería</h3>
            <p className="text-gray-600 mb-4">Comienza agregando la primera imagen histórica</p>
            <button
              onClick={() => {
                setEditingImage({
                  title: '',
                  description: '',
                  url: '',
                  caption: '',
                  category: '',
                  year: '',
                  location: '',
                  photographer: '',
                  source: '',
                  tags: [],
                  isActive: true,
                  order: 0
                });
                setEditingImageIndex(null);
                setShowForm(true);
                setNewTag('');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primera Imagen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyData?.gallery.map((image, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Imagen */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
                          {getCategoryIcon(image.category)} {image.category}
                        </span>
                        {!image.isActive && (
                          <span className="text-xs font-medium text-red-800 bg-red-100 px-2 py-1 rounded">
                            Inactiva
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {image.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {image.description}
                  </p>

                  {/* Información adicional */}
                  <div className="space-y-2 mb-4 text-xs text-gray-500">
                    {image.year && (
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{image.year}</span>
                      </div>
                    )}
                    {image.location && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{image.location}</span>
                      </div>
                    )}
                    {image.photographer && (
                      <div className="flex items-center">
                        <Camera className="w-3 h-3 mr-1" />
                        <span className="truncate">{image.photographer}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {image.tags && image.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {image.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {image.tags && image.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{image.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editImage(image, index)}
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Editar imagen"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => toggleImageStatus(index)}
                      disabled={saving}
                      className={`inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        image.isActive
                          ? 'text-red-700 bg-red-100 border border-red-300 hover:bg-red-200'
                          : 'text-green-700 bg-green-100 border border-green-300 hover:bg-green-200'
                      }`}
                      title={image.isActive ? 'Desactivar imagen' : 'Activar imagen'}
                    >
                      {image.isActive ? (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
                          deleteImage(index);
                        }
                      }}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-8 mx-auto p-4 sm:p-6 w-full max-w-2xl">
            <div className="relative bg-white rounded-lg shadow-xl">
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {editingImageIndex === null ? 'Agregar Nueva Imagen' : 'Editar Imagen'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingImage(null);
                    setEditingImageIndex(null);
                    setNewTag('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido del Modal */}
              <div className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingImage?.title || ''}
                      onChange={(e) => setEditingImage({ ...editingImage!, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      placeholder="Título de la imagen"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editingImage?.description || ''}
                      onChange={(e) => setEditingImage({ ...editingImage!, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      placeholder="Descripción detallada de la imagen"
                    />
                  </div>

                  {/* URL de la Imagen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de la Imagen <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={editingImage?.url || ''}
                      onChange={(e) => setEditingImage({ ...editingImage!, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingImage?.category || ''}
                      onChange={(e) => setEditingImage({ ...editingImage!, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {getCategoryIcon(category)} {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Año y Ubicación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año
                      </label>
                      <input
                        type="text"
                        value={editingImage?.year || ''}
                        onChange={(e) => setEditingImage({ ...editingImage!, year: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: 1950, 1960s"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ubicación
                      </label>
                      <input
                        type="text"
                        value={editingImage?.location || ''}
                        onChange={(e) => setEditingImage({ ...editingImage!, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Lugar donde se tomó la foto"
                      />
                    </div>
                  </div>

                  {/* Fotógrafo y Fuente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fotógrafo
                      </label>
                      <input
                        type="text"
                        value={editingImage?.photographer || ''}
                        onChange={(e) => setEditingImage({ ...editingImage!, photographer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Nombre del fotógrafo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuente
                      </label>
                      <input
                        type="text"
                        value={editingImage?.source || ''}
                        onChange={(e) => setEditingImage({ ...editingImage!, source: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Archivo, colección, etc."
                      />
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={editingImage?.caption || ''}
                      onChange={(e) => setEditingImage({ ...editingImage!, caption: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      placeholder="Texto que aparecerá debajo de la imagen"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(editingImage?.tags || []).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Agregar tag"
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Estado Activo */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingImage?.isActive || false}
                      onChange={(e) => setEditingImage({ ...editingImage!, isActive: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Imagen activa (visible en la galería pública)
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingImage(null);
                    setEditingImageIndex(null);
                    setNewTag('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveImage}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingImageIndex === null ? 'Agregar Imagen' : 'Actualizar Imagen'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryAdminPage;
