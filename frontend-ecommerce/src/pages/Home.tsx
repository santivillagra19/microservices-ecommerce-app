import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { productService } from '../services/productService';
import { contentService, mockBanners, mockCategorías } from '../services/contentService';
import type { Banner, Category } from '../services/contentService';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types';
import { Button } from '../components/ui/Button';

export const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>(mockBanners);
  const [categories, setCategories] = useState<Category[]>(mockCategorías);
  const [loading, setLoading] = useState(true);
  
  // Embla Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [productsData, bannersData, categoriesData] = await Promise.all([
          productService.getAll(),
          contentService.getBanners(),
          contentService.getCategorías()
        ]);
        setFeaturedProducts(productsData.slice(0, 4));
        setBanners(bannersData);
        setCategories(categoriesData);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleBuy = (product: Product) => {
    toast.success(`${product.name} agregado al carrito`, {
      description: 'Ve al carrito para finalizar la compra.',
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-0 pb-12 w-full max-w-none"
    >
      
      {/* Hero Carousel Section with Embla */}
      <section className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] bg-black overflow-hidden group">
        <div className="overflow-hidden w-full h-full" ref={emblaRef}>
          <div className="flex h-full">
            {banners.map((banner, index) => (
              <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative h-full">
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <img 
                  src={banner.image} 
                  alt={banner.title}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-[#f26522] font-black text-sm sm:text-lg md:text-xl tracking-[0.2em] mb-4 uppercase"
                  >
                    {banner.subtitle}
                  </motion.h2>
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white font-extrabold text-4xl sm:text-6xl md:text-7xl uppercase tracking-tighter mb-8 max-w-4xl drop-shadow-lg"
                  >
                    {banner.title}
                  </motion.h1>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link to="/products" className="bg-[#f26522] hover:bg-[#d95316] text-white px-10 py-4 text-lg font-black uppercase tracking-widest rounded-none transition-colors border-2 border-[#f26522] hover:border-[#d95316]">
                      Ver Catálogo
                    </Link>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        <button 
          onClick={scrollPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-[#f26522] text-white p-3 transition-colors opacity-0 group-hover:opacity-100 hidden sm:block"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={scrollNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-[#f26522] text-white p-3 transition-colors opacity-0 group-hover:opacity-100 hidden sm:block"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </section>

      {/* Features Bar (Industrial style) */}
      <section className="bg-black text-white w-full border-t-4 border-[#f26522]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800">
            <div className="flex items-center gap-4 p-6 justify-center md:justify-start">
              <Truck className="h-10 w-10 text-[#f26522]" />
              <div>
                <h3 className="font-black uppercase tracking-wider text-sm">Envío a Obra</h3>
                <p className="text-gray-400 text-xs mt-1">Entregas rápidas y seguras</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 justify-center md:justify-start">
              <Shield className="h-10 w-10 text-[#f26522]" />
              <div>
                <h3 className="font-black uppercase tracking-wider text-sm">Garantía Oficial</h3>
                <p className="text-gray-400 text-xs mt-1">Respaldo directo de fábrica</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 justify-center md:justify-start">
              <Zap className="h-10 w-10 text-[#f26522]" />
              <div>
                <h3 className="font-black uppercase tracking-wider text-sm">Potencia Asegurada</h3>
                <p className="text-gray-400 text-xs mt-1">Herramientas de alto rendimiento</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Marquee */}
      <section className="bg-white py-10 border-b-2 border-gray-100 overflow-hidden relative flex items-center">
        {/* Gradients to fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16 sm:gap-24 items-center justify-center px-8 sm:px-12">
              <span className="text-3xl sm:text-5xl font-black text-gray-300 uppercase tracking-tighter hover:text-[#f26522] transition-colors cursor-pointer">DeWalt</span>
              <span className="text-3xl sm:text-5xl font-black text-gray-300 uppercase tracking-widest hover:text-blue-600 transition-colors cursor-pointer">Makita</span>
              <span className="text-3xl sm:text-5xl font-black text-gray-300 uppercase tracking-tight hover:text-red-600 transition-colors cursor-pointer">Bosch</span>
              <span className="text-3xl sm:text-5xl font-bold text-gray-300 uppercase tracking-normal hover:text-yellow-500 transition-colors cursor-pointer">Stanley</span>
              <span className="text-3xl sm:text-5xl font-black text-gray-300 uppercase tracking-tighter hover:text-red-600 transition-colors cursor-pointer">Milwaukee</span>
              <span className="text-3xl sm:text-5xl font-black text-gray-300 uppercase tracking-wide hover:text-orange-500 transition-colors cursor-pointer">Black+Decker</span>
              <span className="text-3xl sm:text-5xl font-black text-gray-300 uppercase tracking-widest hover:text-red-500 transition-colors cursor-pointer">Hilti</span>
              <span className="text-3xl sm:text-5xl font-black text-gray-300 uppercase tracking-tighter hover:text-orange-600 transition-colors cursor-pointer">Stihl</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Container para el resto del contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-16 space-y-20">
        
        {/* Categorías Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-black uppercase tracking-tight">Categorías Principales</h2>
            <div className="w-24 h-1 bg-[#f26522] mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, idx) => (
              <Link to={`/products?category=${cat.path}`} key={idx} className="group relative aspect-square bg-gray-900 overflow-hidden flex items-center justify-center border-2 border-transparent hover:border-[#f26522] transition-all">
                <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <span className="relative z-20 font-black uppercase tracking-wider text-center px-4 text-white group-hover:text-[#f26522] transition-colors py-2 text-sm sm:text-base">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Featured Products Section */}
        <motion.section 
          id="destacados" 
          className="scroll-mt-24"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-end mb-10 border-b-2 border-gray-100 pb-4">
            <div>
              <h2 className="text-3xl font-black text-black uppercase tracking-tight">Equipos Destacados</h2>
              <div className="w-16 h-1 bg-[#f26522] mt-4"></div>
            </div>
            <Link to="/products" className="hidden sm:flex text-black hover:text-[#f26522] font-bold items-center gap-1 uppercase tracking-wider text-sm transition-colors">
              Ver Catálogo Completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#f26522]"></div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 uppercase font-bold tracking-widest">
              No hay herramientas destacadas en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onBuy={handleBuy} 
                />
              ))}
            </div>
          )}
          <div className="mt-8 text-center sm:hidden">
            <Button variant="secondary" className="w-full">
              Ver todo el catálogo
            </Button>
          </div>
        </motion.section>

        {/* Newsletter Section */}
        <motion.section 
          className="bg-black text-white p-8 md:p-16 border-t-4 border-[#f26522] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative z-10 text-center md:text-left max-w-xl">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Sé el primero en enterarte</h2>
            <p className="text-gray-400">Suscríbete a nuestro boletín para recibir novedades, lanzamientos y ofertas exclusivas para profesionales.</p>
          </div>
          <div className="relative z-10 w-full max-w-md flex flex-col sm:flex-row gap-0">
            <input 
              type="email" 
              placeholder="Tu correo electrónico" 
              className="flex-grow px-5 py-4 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#f26522] rounded-none"
            />
            <Button variant="primary" className="!bg-[#f26522] hover:!bg-[#d95316] !text-white rounded-none px-8 py-4 font-black uppercase tracking-widest">
              Suscribirme
            </Button>
          </div>
        </motion.section>

      </div>
    </motion.div>
  );
};
