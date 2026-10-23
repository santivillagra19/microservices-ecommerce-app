import React, { useState, useEffect } from 'react';
import { Building2, FileText, Users, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { notificationService } from '../services/notificationService';
import { toast } from 'sonner';

export const Empresas = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    cuit: '',
    contactName: '',
    email: '',
    phone: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await notificationService.submitContactForm({
        nombre: formData.contactName,
        email: formData.email,
        telefono: formData.phone,
        empresa: formData.companyName + ' (CUIT: ' + formData.cuit + ')',
        mensaje: formData.message,
        tipoConsulta: 'Venta mayorista / Presupuesto'
      });
      toast.success('Solicitud enviada correctamente', {
        description: 'Un asesor comercial se contactará a la brevedad.',
      });
      setFormData({ companyName: '', cuit: '', contactName: '', email: '', phone: '', message: '' });
    } catch {
      toast.error('Error al enviar solicitud', {
        description: 'Por favor, inténtelo de nuevo más tarde.',
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
        <p className="mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"><span aria-hidden="true" className="h-3 w-1 -skew-x-[25deg] bg-[#f26522]" />Venta mayorista / FerreStore</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Venta mayorista
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
          Equipamos tu industria o constructora con las mejores herramientas del mercado. Cotizaciones rápidas y precios mayoristas.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-5 lg:gap-7">
        {/* Beneficios */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-gray-200 bg-[#f0f0ee] p-6 sm:p-8">
            <h3 className="mb-6 flex items-center gap-3 text-2xl font-semibold tracking-tight text-gray-900">
              <Building2 className="text-[#f26522]" /> Beneficios mayoristas
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
                <ShieldCheck className="w-6 h-6 text-[#f26522] flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold tracking-tight text-gray-900">Descuentos por Volumen</h4>
                  <p className="text-base leading-relaxed text-gray-600 mt-2">Accedé a listas de precios preferenciales para compras mayoristas y licitaciones.</p>
                </div>
              </li>
              <li className="flex items-start gap-4 border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
                <FileText className="w-6 h-6 text-[#f26522] flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold tracking-tight text-gray-900">Facturación A</h4>
                  <p className="text-base leading-relaxed text-gray-600 mt-2">Emitimos Factura A automatizada con todos los requisitos fiscales vigentes.</p>
                </div>
              </li>
              <li className="flex items-start gap-4 border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
                <Users className="w-6 h-6 text-[#f26522] flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold tracking-tight text-gray-900">Asesoramiento Técnico</h4>
                  <p className="text-base leading-relaxed text-gray-600 mt-2">Un ejecutivo de cuentas especializado te ayudará a elegir el equipamiento ideal.</p>
                </div>
              </li>
              <li className="flex items-start gap-4 border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
                <CheckCircle2 className="w-6 h-6 text-[#f26522] flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold tracking-tight text-gray-900">Garantía Extendida</h4>
                  <p className="text-base leading-relaxed text-gray-600 mt-2">Servicio técnico prioritario para que tu obra o fábrica nunca se detenga.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Formulario */}
        <div className="service-form rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 lg:col-span-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f26522]">Tu próximo proyecto</p>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
            Solicitar Presupuesto
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Razón Social / Empresa"
                type="text"
                name="companyName"
                id="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
              />
              <Input
                label="CUIT"
                type="text"
                name="cuit"
                id="cuit"
                required
                value={formData.cuit}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Nombre de Contacto"
                type="text"
                name="contactName"
                id="contactName"
                required
                value={formData.contactName}
                onChange={handleChange}
              />
              <Input
                label="Teléfono"
                type="tel"
                name="phone"
                id="phone"
                required
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Correo Electrónico (Institucional)"
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <Textarea
              label="Herramientas o insumos requeridos"
              id="message"
              name="message"
              rows={5}
              required
              placeholder="Ej: Necesitamos cotizar 5 taladros percutores DeWalt, 2 amoladoras y discos de corte..."
              value={formData.message}
              onChange={handleChange}
              className="resize-none"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="service-submit mt-2 w-full !py-3.5"
              icon={Send}
            >
              {isSubmitting ? 'Enviando solicitud...' : 'Solicitar cotización'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
