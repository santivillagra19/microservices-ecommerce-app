import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
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
      } catch {
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
    } catch {
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
    <div className="service-page mx-auto max-w-6xl py-5 sm:py-10">
      <div className="mb-9 max-w-3xl">
        <p className="mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"><span aria-hidden="true" className="h-3 w-1 -skew-x-[25deg] bg-[#f26522]" />Contacto / FerreStore</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Contáctanos
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-gray-600">
          ¿Tienes alguna duda o consulta? Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-5 lg:gap-7">
        {/* Contact Info */}
        <div className="rounded-2xl border border-gray-200 bg-[#f0f0ee] p-6 sm:p-8 lg:col-span-2">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
            Información de Contacto
          </h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
                <MapPin className="h-4 w-4 text-[#f26522]" />
              </div>
              <div className="ml-4 min-w-0 break-words text-base leading-relaxed text-gray-800">
                <p className="text-sm font-semibold text-gray-600">Dirección</p>
                <p className="mt-1">{storeInfo ? storeInfo.address : 'Cargando...'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
                <Phone className="h-4 w-4 text-[#f26522]" />
              </div>
              <div className="ml-4 min-w-0 break-words text-base leading-relaxed text-gray-800">
                <p className="text-sm font-semibold text-gray-600">Teléfono</p>
                <p className="mt-1">{storeInfo ? storeInfo.phone : 'Cargando...'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
                <Mail className="h-4 w-4 text-[#f26522]" />
              </div>
              <div className="ml-4 min-w-0 break-words text-base leading-relaxed text-gray-800">
                <p className="text-sm font-semibold text-gray-600">Email</p>
                <p className="mt-1">{storeInfo ? storeInfo.email : 'Cargando...'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
                <Clock className="h-4 w-4 text-[#f26522]" />
              </div>
              <div className="ml-4 min-w-0 break-words text-base leading-relaxed text-gray-800">
                <p className="text-sm font-semibold text-gray-600">Horario de Atención</p>
                <p className="mt-1">{storeInfo ? storeInfo.schedule : 'Cargando...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="service-form rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 lg:col-span-3">
          <div className="mb-6 border-b border-gray-100 pb-5"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f26522]">Tu consulta</p><h2 className="text-2xl font-semibold tracking-tight text-gray-900">Contanos qué necesitás</h2></div>
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
                className="service-submit w-full !py-3.5"
                icon={Send}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
