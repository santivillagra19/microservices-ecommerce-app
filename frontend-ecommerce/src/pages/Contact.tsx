import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { notificationService } from '../services/notificationService';
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

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await notificationService.submitContactForm({
        nombre: formData.name,
        email: formData.email,
        mensaje: formData.message,
        tipoConsulta: 'Contacto General'
      });
      toast.success('Mensaje enviado', {
        description: 'Nos pondremos en contacto contigo a la brevedad.',
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error('Error al enviar el mensaje', {
        description: 'Por favor, inténtalo de nuevo más tarde.',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <Input
              label="Nombre Completo"
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleChange}
            />

            <Input
              label="Correo Electrónico"
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <Textarea
              label="Mensaje"
              id="message"
              name="message"
              rows={4}
              required
              value={formData.message}
              onChange={handleChange}
              className="resize-none"
            />

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
