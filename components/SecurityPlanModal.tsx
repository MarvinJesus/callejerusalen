'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Phone, MapPin, Clock, Briefcase, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface SecurityPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SecurityPlanModal: React.FC<SecurityPlanModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, userProfile, securityPlan } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    address: '',
    availability: '',
    skills: [] as string[],
    otherSkills: '',
    agreedToTerms: false,
  });

  // Verificar si el usuario ya está inscrito SOLO cuando el modal se abre
  useEffect(() => {
    if (isOpen && securityPlan) {
      toast.error('Ya tienes una solicitud al Plan de Seguridad');
      onClose();
    }
  }, [isOpen, securityPlan, onClose]);

  const availabilityOptions = [
    { value: 'full_time', label: 'Tiempo Completo', description: 'Disponible la mayor parte del tiempo' },
    { value: 'part_time', label: 'Medio Tiempo', description: 'Disponible en ciertos momentos' },
    { value: 'emergencies_only', label: 'Solo Emergencias', description: 'Disponible solo en situaciones críticas' },
    { value: 'weekends', label: 'Fines de Semana', description: 'Disponible principalmente sábados y domingos' },
  ];

  const skillsOptions = [
    { value: 'first_aid', label: 'Primeros Auxilios', icon: '🩹' },
    { value: 'doctor', label: 'Médico/Enfermero', icon: '⚕️' },
    { value: 'firefighter', label: 'Bombero', icon: '🚒' },
    { value: 'security', label: 'Seguridad/Policía', icon: '🚓' },
    { value: 'electrical', label: 'Electricista', icon: '⚡' },
    { value: 'plumber', label: 'Plomero', icon: '🔧' },
    { value: 'other', label: 'Otro', icon: '✨' },
  ];

  const handleSkillToggle = (skill: string) => {
    if (formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: formData.skills.filter(s => s !== skill)
      });
    } else {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreedToTerms) {
      toast.error('Debes aceptar los términos del Plan de Seguridad');
      return;
    }

    if (!formData.phoneNumber || !formData.address || !formData.availability) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.skills.length === 0) {
      toast.error('Selecciona al menos una habilidad o característica');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/security-plan/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.uid,
          agreedToTerms: formData.agreedToTerms,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          availability: formData.availability,
          skills: formData.skills,
          otherSkills: formData.otherSkills,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al inscribirse en el plan');
      }

      toast.success('¡Te has inscrito exitosamente en el Plan de Seguridad!');
      onSuccess();
      onClose();
      
      // Recargar la página para actualizar el estado
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error al inscribirse:', err);
      toast.error(err instanceof Error ? err.message : 'Error al inscribirse en el plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Plan de Seguridad de la Comunidad</h2>
                <p className="text-sm text-green-100">Completa tu inscripción</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información del Usuario (Solo lectura) */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Tu Información
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                    <div className="mt-1 px-4 py-2 bg-white/50 rounded-lg border border-blue-200">
                      <p className="text-gray-900 font-medium">{userProfile?.displayName || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Correo Electrónico</label>
                    <div className="mt-1 px-4 py-2 bg-white/50 rounded-lg border border-blue-200">
                      <p className="text-gray-900 font-medium">{user?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-green-600" />
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Calle Jerusalén #123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Disponibilidad */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  Disponibilidad <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availabilityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.availability === option.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="availability"
                        value={option.value}
                        checked={formData.availability === option.value}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        className="mt-1"
                        required
                      />
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      {formData.availability === option.value && (
                        <Check className="absolute top-4 right-4 w-5 h-5 text-green-600" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Habilidades y Características */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-orange-600" />
                  Habilidades y Características <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona las habilidades o conocimientos con los que cuentas para ayudar a la comunidad
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {skillsOptions.map((skill) => (
                    <button
                      key={skill.value}
                      type="button"
                      onClick={() => handleSkillToggle(skill.value)}
                      className={`relative p-4 border-2 rounded-xl transition-all ${
                        formData.skills.includes(skill.value)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{skill.icon}</div>
                      <p className="text-sm font-medium text-gray-900">{skill.label}</p>
                      {formData.skills.includes(skill.value) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Campo para "Otro" */}
                {formData.skills.includes('other') && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especifica otras habilidades
                    </label>
                    <input
                      type="text"
                      value={formData.otherSkills}
                      onChange={(e) => setFormData({ ...formData, otherSkills: e.target.value })}
                      placeholder="Ej: Carpintero, Mecánico, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                  </div>
                )}
              </div>

              {/* Términos y Condiciones */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Términos del Plan</h3>
                <div className="max-h-40 overflow-y-auto bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-semibold">Al inscribirte en el Plan de Seguridad, aceptas:</p>
                    <ul className="list-decimal list-inside space-y-1 ml-2">
                      <li>Utilizar las herramientas de seguridad de manera responsable</li>
                      <li>Reportar incidentes de forma veraz y oportuna</li>
                      <li>Respetar la privacidad de otros miembros</li>
                      <li>No hacer uso indebido del botón de pánico</li>
                      <li>Mantener actualizada tu información de contacto</li>
                      <li>Colaborar con las autoridades cuando sea necesario</li>
                    </ul>
                  </div>
                </div>

                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                    className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    required
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    He leído y acepto los términos del Plan de Seguridad de la Comunidad Calle Jerusalén
                  </span>
                </label>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.agreedToTerms}
              className={`px-6 py-2 rounded-lg font-semibold text-white transition-all flex items-center space-x-2 ${
                loading || !formData.agreedToTerms
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Inscribiendo...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Inscribirme en el Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPlanModal;

