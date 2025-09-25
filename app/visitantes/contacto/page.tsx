'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular envío de mensaje
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Mensaje enviado correctamente');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      toast.error('Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  // Permitir acceso a todos los usuarios (incluyendo visitantes no registrados)
  // No hay restricciones de acceso para la página de contacto

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contacto
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ponte en contacto con la administración de la comunidad. 
            Estamos aquí para ayudarte y responder a tus consultas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Información de contacto */}
          <div className="space-y-6">
            <div className="card-theme">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Información de Contacto
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">info@callejerusalen.com</p>
                    <p className="text-gray-600">admin@callejerusalen.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Teléfono</h3>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                    <p className="text-gray-600">+1 (555) 987-6543 (Emergencias)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dirección</h3>
                    <p className="text-gray-600">
                      Calle Jerusalén #123<br />
                      Colonia Centro<br />
                      Ciudad, Estado 12345
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Horarios de Atención</h3>
                    <p className="text-gray-600">
                      Lunes - Viernes: 8:00 AM - 6:00 PM<br />
                      Sábados: 9:00 AM - 2:00 PM<br />
                      Domingos: Cerrado
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="card-theme bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                ¿Necesitas ayuda inmediata?
              </h3>
              <p className="text-blue-800 mb-4">
                Para emergencias o reportes urgentes, contacta directamente a:
              </p>
              <div className="space-y-2 text-blue-700">
                <p><strong>Seguridad:</strong> +1 (555) 911-0000</p>
                <p><strong>Mantenimiento:</strong> +1 (555) 911-0001</p>
                <p><strong>Administración:</strong> +1 (555) 911-0002</p>
              </div>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="card-theme">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Envíanos un Mensaje
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-theme"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-theme"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="input-theme"
                >
                  <option value="">Selecciona un asunto</option>
                  <option value="informacion">Información General</option>
                  <option value="queja">Queja o Sugerencia</option>
                  <option value="servicios">Servicios Comunitarios</option>
                  <option value="eventos">Eventos</option>
                  <option value="seguridad">Seguridad</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="input-theme resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-theme-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>{loading ? 'Enviando...' : 'Enviar Mensaje'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <div className="card-theme">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Preguntas Frecuentes
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Cómo puedo reportar un problema de seguridad?
                </h3>
                <p className="text-gray-600">
                  Puedes usar el botón de pánico en la aplicación (si eres residente) o contactar directamente al número de emergencias: +1 (555) 911-0000.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Dónde puedo encontrar información sobre eventos comunitarios?
                </h3>
                <p className="text-gray-600">
                  La información sobre eventos se publica en el tablón de anuncios digital y se envía por email a todos los residentes registrados.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Cómo puedo acceder a las cámaras de seguridad?
                </h3>
                <p className="text-gray-600">
                  Solo los residentes registrados pueden acceder a las cámaras de seguridad. Debes cambiar tu rol a "Residente" en tu perfil.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¿Qué servicios están disponibles para visitantes?
                </h3>
                <p className="text-gray-600">
                  Los visitantes pueden acceder a información sobre lugares de recreación, servicios locales, y contactar a la administración.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;


