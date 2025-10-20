'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Edit, Trash2, Plus, ArrowLeft, X, Check, AlertCircle, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface CulturalTradition {
  id?: string;
  name: string;
  description: string;
  category: string;
  image: string;
  importance: string;
  practices: string[];
  order: number;
}

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: any[];
  traditions: CulturalTradition[];
  places: any[];
  gallery: any[];
  exploreLinks: any[];
  isActive: boolean;
}

const AdminTraditionsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTradition, setEditingTradition] = useState<CulturalTradition | null>(null);
  const [editingTraditionIndex, setEditingTraditionIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newPractice, setNewPractice] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialHistoryData, setInitialHistoryData] = useState<HistoryPageData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const categories = [
    'Festividades',
    'Gastronomía',
    'Música y Danza',
    'Artesanías',
    'Religión',
    'Costumbres',
    'Lenguaje',
    'Otros'
  ];

  const importanceLevels = [
    'Muy Importante',
    'Importante',
    'Moderada',
    'Básica'
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
      setInitialHistoryData(data.historyData);
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const saveHistoryData = async () => {
    if (!historyData) return;

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar datos de historia');
      }

      const data = await response.json();
      console.log('Datos de historia guardados:', data);
      toast.success('Datos de historia guardados exitosamente');
      setInitialHistoryData(historyData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error al guardar datos de historia:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar datos de historia');
      toast.error('Error al guardar datos de historia');
    } finally {
      setSaving(false);
    }
  };

  const updateHistoryData = (updates: Partial<HistoryPageData>) => {
    setHistoryData(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(initialHistoryData));
      return updated;
    });
  };

  const addTradition = () => {
    const newTradition: CulturalTradition = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      category: '',
      image: '',
      importance: '',
      practices: [],
      order: 0,
    };
    setEditingTradition(newTradition);
    setEditingTraditionIndex(null);
    setShowForm(true);
    setNewPractice('');
  };

  const editTradition = (tradition: CulturalTradition, index: number) => {
    setEditingTradition({ ...tradition });
    setEditingTraditionIndex(index);
    setShowForm(true);
    setNewPractice('');
  };

  const confirmDeleteTradition = (index: number) => {
    setShowDeleteConfirm(index);
  };

  const deleteTradition = async (index: number) => {
    if (!historyData || index < 0 || index >= historyData.traditions.length) {
      toast.error('Índice de tradición inválido');
      return;
    }
    
    try {
      setSaving(true);
      
      const updatedTraditions = historyData.traditions.filter((_, i) => i !== index);
      
      const reorderedTraditions = updatedTraditions.map((tradition, newIndex) => ({
        ...tradition,
        order: newIndex + 1
      }));
      
      const updatedHistoryData = { ...historyData, traditions: reorderedTraditions };
      setHistoryData(updatedHistoryData);

      console.log('Eliminando tradición en índice:', index);
      console.log('Tradiciones restantes:', reorderedTraditions);

      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la tradición');
      }

      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      setShowDeleteConfirm(null);
      toast.success('Tradición eliminada exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar tradición:', error);
      toast.error(error.message || 'Error al eliminar la tradición');
      setHistoryData(historyData);
    } finally {
      setSaving(false);
    }
  };

  const saveTradition = async () => {
    if (!editingTradition || !historyData) return;

    if (!editingTradition.name.trim() || !editingTradition.description.trim() || !editingTradition.category.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      const updatedTraditions = [...historyData.traditions];
      
      if (editingTraditionIndex === null) {
        const newTradition = { 
          ...editingTradition,
          order: updatedTraditions.length + 1
        };
        delete newTradition.id;
        updatedTraditions.push(newTradition);
        
        console.log('Agregando nueva tradición:', newTradition);
      } else {
        if (editingTraditionIndex >= 0 && editingTraditionIndex < updatedTraditions.length) {
          const originalOrder = updatedTraditions[editingTraditionIndex].order;
          const updatedTradition = { 
            ...editingTradition, 
            order: originalOrder 
          };
          
          updatedTraditions[editingTraditionIndex] = updatedTradition;
          
          console.log(`Actualizando tradición en índice ${editingTraditionIndex}:`, updatedTradition);
        } else {
          throw new Error('Índice de tradición inválido para edición');
        }
      }

      const updatedHistoryData = { ...historyData, traditions: updatedTraditions };
      setHistoryData(updatedHistoryData);

      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la tradición');
      }

      setShowForm(false);
      setEditingTradition(null);
      setEditingTraditionIndex(null);
      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      
      toast.success('Tradición guardada exitosamente');
    } catch (error: any) {
      console.error('Error al guardar tradición:', error);
      toast.error(error.message || 'Error al guardar la tradición');
    } finally {
      setSaving(false);
    }
  };

  const addPractice = () => {
    if (!newPractice.trim() || !editingTradition) return;
    
    setEditingTradition({
      ...editingTradition,
      practices: [...editingTradition.practices, newPractice.trim()]
    });
    setNewPractice('');
  };

  const removePractice = (index: number) => {
    if (!editingTradition) return;
    
    setEditingTradition({
      ...editingTradition,
      practices: editingTradition.practices.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando tradiciones culturales...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 sm:py-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link
                href="/admin/history"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Volver a Historia
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tradiciones Culturales</h1>
                <p className="text-sm sm:text-base text-gray-600">Gestiona las tradiciones culturales de Calle Jerusalén</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <UserMenu />
              {hasChanges && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Cambios sin guardar</span>
                  </div>
                  <button
                    onClick={saveHistoryData}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Lista de Tradiciones */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tradiciones Configuradas</h2>
            <button
              onClick={addTradition}
              disabled={saving}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tradición
            </button>
          </div>

          <div className="space-y-4">
            {historyData?.traditions.map((tradition, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 w-fit">
                        {tradition.category}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                        {tradition.importance}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                        #{tradition.order}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">{tradition.name}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 break-words overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4',
                      maxHeight: '4.2em'
                    }}>
                      {tradition.description}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {tradition.practices.length} prácticas
                      </span>
                      {tradition.image && (
                        <span className="flex items-center text-green-600">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          Con imagen
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-4 lg:flex-shrink-0">
                    <button
                      onClick={() => editTradition(tradition, index)}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      title="Editar tradición"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => confirmDeleteTradition(index)}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      title="Eliminar tradición"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {historyData?.traditions.length === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay tradiciones configuradas</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">Agrega la primera tradición cultural para comenzar</p>
                <button
                  onClick={addTradition}
                  disabled={saving}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Tradición
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Edición */}
        {showForm && editingTradition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                {/* Header del Modal */}
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {editingTraditionIndex === null ? 'Nueva Tradición Cultural' : 'Editar Tradición Cultural'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {editingTraditionIndex === null 
                        ? 'Agrega una nueva tradición cultural de Calle Jerusalén'
                        : 'Modifica la información de la tradición seleccionada'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Formulario en una sola columna */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Tradición <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingTradition.name}
                      onChange={(e) => setEditingTradition({ ...editingTradition, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      placeholder="Ej: Fiesta de San Juan"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Nombre de la tradición cultural</p>
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingTradition.category}
                      onChange={(e) => setEditingTradition({ ...editingTradition, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Categoría de la tradición</p>
                  </div>

                  {/* Importancia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nivel de Importancia <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingTradition.importance}
                      onChange={(e) => setEditingTradition({ ...editingTradition, importance: e.target.value })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      required
                    >
                      <option value="">Selecciona el nivel de importancia</option>
                      {importanceLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Importancia de la tradición en la comunidad</p>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editingTradition.description}
                      onChange={(e) => setEditingTradition({ ...editingTradition, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white resize-none"
                      placeholder="Descripción detallada de la tradición cultural..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Descripción completa de la tradición</p>
                  </div>

                  {/* URL de Imagen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de Imagen
                    </label>
                    <input
                      type="url"
                      value={editingTradition.image}
                      onChange={(e) => setEditingTradition({ ...editingTradition, image: e.target.value })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL de la imagen representativa (opcional)</p>
                  </div>

                  {/* Prácticas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prácticas y Costumbres
                    </label>
                    
                    {/* Lista de prácticas existentes */}
                    {editingTradition.practices.length > 0 && (
                      <div className="space-y-2 mb-3 max-h-32 sm:max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 sm:p-3 bg-gray-50">
                        {editingTradition.practices.map((practice, index) => (
                          <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border">
                            <span className="flex-1 text-xs sm:text-sm text-gray-700 break-words">{practice}</span>
                            <button
                              onClick={() => removePractice(index)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                              title="Eliminar práctica"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input para agregar nueva práctica */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newPractice}
                        onChange={(e) => setNewPractice(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Nueva práctica o costumbre..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addPractice();
                          }
                        }}
                      />
                      <button
                        onClick={addPractice}
                        className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
                        title="Agregar práctica"
                      >
                        <Plus className="w-4 h-4 mr-1 sm:mr-0" />
                        <span className="sm:hidden text-sm">Agregar</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Agrega prácticas y costumbres específicas (opcional)</p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveTradition}
                    disabled={saving}
                    className="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Guardar Tradición
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      Confirmar eliminación
                    </h3>
                  </div>
                </div>
                <div className="mb-4 sm:mb-6">
                  <p className="text-sm text-gray-600">
                    ¿Estás seguro de que quieres eliminar esta tradición cultural? Esta acción no se puede deshacer.
                  </p>
                  {historyData?.traditions[showDeleteConfirm] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">
                        {historyData.traditions[showDeleteConfirm].name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {historyData.traditions[showDeleteConfirm].category}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deleteTradition(showDeleteConfirm)}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTraditionsPage;


















