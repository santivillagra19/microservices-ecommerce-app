import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { contentService } from '../services/contentService';
import type { StoreInfo } from '../services/contentService';

export const Footer = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await contentService.getStoreInfo();
        setStoreInfo(info);
      } catch (err) {
      }
    };
    fetchInfo();
  }, []);

  return (
    <footer className="bg-black border-t-4 border-[#f26522] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-black text-2xl text-white uppercase tracking-widest mb-4">FerreStore</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-sm font-medium">
              Tu proveedor de confianza para equipamiento profesional, herramientas eléctricas y materiales de alta calidad para proyectos industriales.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm text-gray-400 font-medium">
              <li><Link to="/" className="hover:text-[#f26522] transition-colors">Inicio</Link></li>
              <li><Link to="/products" className="hover:text-[#f26522] transition-colors">Catálogo Completo</Link></li>
              <li><Link to="/offers" className="hover:text-[#f26522] transition-colors">Ofertas Destacadas</Link></li>
              <li><Link to="/contact" className="hover:text-[#f26522] transition-colors">Atención al Cliente</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white uppercase tracking-wider mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-[#f26522] flex-shrink-0" />
                <span>{storeInfo ? storeInfo.address : 'Cargando...'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#f26522] flex-shrink-0" />
                <span>{storeInfo ? storeInfo.phone : 'Cargando...'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#f26522] flex-shrink-0" />
                <Link to="/contact" className="hover:text-[#f26522] transition-colors">
                  {storeInfo ? storeInfo.email : 'Cargando...'}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 font-medium">
          <p>&copy; {new Date().getFullYear()} FerreStore Industrial - Todos los derechos reservados</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Políticas de Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
