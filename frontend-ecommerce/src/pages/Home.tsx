import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Zap, Shield, Truck } from 'lucide-react';
import { HeroCarousel } from '../components/HeroCarousel';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { productService } from '../services/productService';
import { contentService, mockBanners, mockCategorías } from '../services/contentService';
import type { Banner, Category } from '../services/contentService';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types';
import { Button } from '../components/ui/Button';
import { useCartStore } from '../store/cartStore';

export const Home = () => {
  const addItem = useCartStore((state) => state.addItem);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>(mockBanners);
  const [categories, setCategories] = useState<Category[]>(mockCategorías);
  const [loading, setLoading] = useState(true);

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
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleBuy = (product: Product) => {
    addItem(product, 1);
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

      <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-[#242426]">
        <HeroCarousel banners={banners} />

        {/* Features Bar (Industrial style) */}
        <section className="w-full border-t border-white/10 bg-[#202022] text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="flex items-center gap-4 p-6 justify-center md:justify-start">
                <Truck className="h-7 w-7 shrink-0 text-[#f26522]" />
                <div>
                  <h3 className="text-base font-semibold tracking-tight">Envío a Obra</h3>
                  <p className="mt-1 text-sm text-gray-400">Entregas rápidas y seguras</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 justify-center md:justify-start">
                <Shield className="h-7 w-7 shrink-0 text-[#f26522]" />
                <div>
                  <h3 className="text-base font-semibold tracking-tight">Garantía Oficial</h3>
                  <p className="mt-1 text-sm text-gray-400">Respaldo directo de fábrica</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 justify-center md:justify-start">
                <Zap className="h-7 w-7 shrink-0 text-[#f26522]" />
                <div>
                  <h3 className="text-base font-semibold tracking-tight">Potencia Asegurada</h3>
                  <p className="mt-1 text-sm text-gray-400">Herramientas de alto rendimiento</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

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
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
            <div>
              <p className="mb-3 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                <span aria-hidden="true" className="flex gap-1"><span className="h-3 w-1 -skew-x-[25deg] bg-[#f26522]" /><span className="h-3 w-1 -skew-x-[25deg] bg-[#f26522]" /></span>
                Para cada trabajo
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Categorías principales</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link to={`/products?category=${cat.path}`} key={cat.path} className="group overflow-hidden rounded-2xl border border-zinc-700 bg-[#242426] transition-[border-color,box-shadow] duration-300 hover:border-[#f26522]/70 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f26522]">
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
                  <img src={cat.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none" />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#242426]/50 via-transparent to-transparent" />
                  <span aria-hidden="true" className="absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-[#f26522]" />
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 p-5 sm:p-6">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold leading-snug tracking-tight text-white">{cat.name}</h3>
                    <span className="mt-2 block text-sm text-gray-400 transition-colors group-hover:text-gray-200">Ver productos</span>
                  </div>
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f26522]/35 bg-[#f26522]/10 text-orange-400 transition-colors group-hover:bg-[#f26522] group-hover:text-white group-focus-visible:bg-[#f26522] group-focus-visible:text-white">
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" strokeWidth={1.75} />
                  </span>
                </div>
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
          aria-labelledby="newsletter-title"
          className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-2xl border border-gray-200 bg-[#f0f0ee] p-6 text-gray-900 sm:p-10 lg:flex-row lg:items-center lg:p-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-lg">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white">
                <Mail className="h-5 w-5 text-[#f26522]" strokeWidth={1.5} />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">Novedades FerreStore</span>
            </div>
            <h2 id="newsletter-title" className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">Sé el primero en enterarte</h2>
            <p className="text-sm leading-relaxed text-gray-500">Lanzamientos, novedades y ofertas para tu próximo proyecto. Directo a tu correo.</p>
          </div>
          <div className="w-full max-w-md">
            <label htmlFor="newsletter-email" className="mb-2 block text-xs font-medium text-gray-600">Tu correo electrónico</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 transition-colors hover:border-gray-300 focus:border-[#f26522]/70 focus:outline-none focus:ring-2 focus:ring-[#f26522]/30"
              />
              <button type="button" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#f26522] bg-[#f26522] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d95316] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f26522]">
                Suscribirme <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </motion.section>

      </div>
    </motion.div>
  );
};
