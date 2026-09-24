import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { contentService, type StoreInfo } from '../services/contentService';
import { toast } from 'sonner';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchStoreInfo = async () => {
      try {
        const info = await contentService.getStoreInfo();
        setStoreInfo(info);
      } catch (err) {
      }
    };
    fetchStoreInfo();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission to an endpoint
    setTimeout(() => {
      toast.success('Mensaje enviado', {
        description: 'Nos pondremos en contacto contigo a la brevedad.',
      });
      setIsSubmitting(false);
      setFormData({ name: '', email: '', message: '' });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-black uppercase tracking-widest sm:text-4xl">
          Contáctanos
        </h1>
        <div className="w-24 h-1 bg-[#f26522] mx-auto mt-4 mb-6"></div>
        <p className="mt-4 text-lg text-gray-500 font-medium">
          ¿Tienes alguna duda o consulta? Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="bg-gray-50 p-8 rounded-none border border-gray-200">
          <h2 className="text-2xl font-black text-black uppercase tracking-wider mb-8">
            Información de Contacto
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-[#f26522]" />
              </div>
              <div className="ml-3 text-gray-600">
                <p className="font-bold text-gray-900 uppercase text-sm tracking-wider">Dirección</p>
                <p className="mt-1">{storeInfo ? storeInfo.address : 'Cargando...'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Phone className="h-6 w-6 text-[#f26522]" />
              </div>
              <div className="ml-3 text-gray-600">
                <p className="font-bold text-gray-900 uppercase text-sm tracking-wider">Teléfono</p>
                <p className="mt-1">{storeInfo ? storeInfo.phone : 'Cargando...'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-[#f26522]" />
              </div>
              <div className="ml-3 text-gray-600">
                <p className="font-bold text-gray-900 uppercase text-sm tracking-wider">Email</p>
                <p className="mt-1">{storeInfo ? storeInfo.email : 'Cargando...'}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-[#f26522]" />
              </div>
              <div className="ml-3 text-gray-600">
                <p className="font-bold text-gray-900 uppercase text-sm tracking-wider">Horario de Atención</p>
                <p className="mt-1">{storeInfo ? storeInfo.schedule : 'Cargando...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-none border-t-4 border-[#f26522] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                Nombre Completo
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="py-3 px-4 block w-full shadow-sm focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 rounded-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="py-3 px-4 block w-full shadow-sm focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 rounded-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                Mensaje
              </label>
              <div className="mt-1">
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="py-3 px-4 block w-full shadow-sm focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 rounded-none transition-colors resize-none"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full !py-4"
                icon={Send}
              >
                {isSubmitting ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
