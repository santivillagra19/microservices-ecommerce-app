import React, { useState, useEffect } from 'react';
import { Building2, FileText, Users, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success('Solicitud enviada correctamente', {
        description: 'Un asesor comercial se contactará a la brevedad.',
      });
      setIsSubmitting(false);
      setFormData({ companyName: '', cuit: '', contactName: '', email: '', phone: '', message: '' });
    }, 1200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-black text-black uppercase tracking-widest sm:text-4xl">
          Atención a Empresas
        </h1>
        <div className="w-24 h-1 bg-[#f26522] mx-auto mt-4 mb-6"></div>
        <p className="mt-4 text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          Equipamos tu industria o constructora con las mejores herramientas del mercado. Cotizaciones rápidas y precios mayoristas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Beneficios */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-50 p-8 border-l-4 border-[#f26522]">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <Building2 className="text-[#f26522]" /> Beneficios B2B
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-[#f26522] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-wide">Descuentos por Volumen</h4>
                  <p className="text-sm text-gray-600 mt-1">Accedé a listas de precios preferenciales para compras mayoristas y licitaciones.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-[#f26522] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-wide">Facturación A</h4>
                  <p className="text-sm text-gray-600 mt-1">Emitimos Factura A automatizada con todos los requisitos fiscales vigentes.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Users className="w-6 h-6 text-[#f26522] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-wide">Asesoramiento Técnico</h4>
                  <p className="text-sm text-gray-600 mt-1">Un ejecutivo de cuentas especializado te ayudará a elegir el equipamiento ideal.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-[#f26522] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 uppercase tracking-wide">Garantía Extendida</h4>
                  <p className="text-sm text-gray-600 mt-1">Servicio técnico prioritario para que tu obra o fábrica nunca se detenga.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Formulario */}
        <div className="lg:col-span-3 bg-white p-8 border-t-4 border-black shadow-2xl">
          <h2 className="text-2xl font-black text-black uppercase tracking-wider mb-8">
            Solicitar Presupuesto
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                  Razón Social / Empresa
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="mt-2 py-3 px-4 block w-full focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="cuit" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                  CUIT
                </label>
                <input
                  type="text"
                  name="cuit"
                  id="cuit"
                  required
                  value={formData.cuit}
                  onChange={handleChange}
                  className="mt-2 py-3 px-4 block w-full focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactName" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  name="contactName"
                  id="contactName"
                  required
                  value={formData.contactName}
                  onChange={handleChange}
                  className="mt-2 py-3 px-4 block w-full focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 py-3 px-4 block w-full focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                Correo Electrónico (Institucional)
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-2 py-3 px-4 block w-full focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-black text-gray-900 uppercase tracking-wider">
                Herramientas o insumos requeridos
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                placeholder="Ej: Necesitamos cotizar 5 taladros percutores DeWalt, 2 amoladoras y discos de corte..."
                value={formData.message}
                onChange={handleChange}
                className="mt-2 py-3 px-4 block w-full focus:ring-0 focus:border-[#f26522] border-2 border-gray-200 transition-colors resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full !py-4 text-base"
              icon={Send}
            >
              {isSubmitting ? 'ENVIANDO SOLICITUD...' : 'ENVIAR SOLICITUD DE COTIZACIÓN'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
