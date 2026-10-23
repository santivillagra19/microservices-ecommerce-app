import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Banner } from '../services/contentService';

const sentenceCase = (text: string) => {
  const lower = text.toLocaleLowerCase('es-AR');
  return lower.charAt(0).toLocaleUpperCase('es-AR') + lower.slice(1);
};

export const HeroCarousel = ({ banners }: { banners: Banner[] }) => {
  const [selected, setSelected] = useState(0);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion || focused || banners.length < 2) return;
    const timer = window.setTimeout(() => setSelected((selected + 1) % banners.length), 5000);
    return () => window.clearTimeout(timer);
  }, [selected, banners.length, focused, reducedMotion]);

  if (!banners.length) return null;

  return (
    <section onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }} aria-label="Destacados de FerreStore" aria-roledescription="carrusel" className="hero-carousel overflow-hidden bg-[#242426]">
      <div className="overflow-hidden">
        <div className="grid">
          {banners.map((banner, index) => (
            <div key={banner.id} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${banners.length}`} aria-hidden={index !== selected} inert={index !== selected} data-active={index === selected} className={`hero-slide relative col-start-1 row-start-1 grid min-h-[360px] min-w-0 grid-cols-1 sm:min-h-[400px] md:min-h-0 transition-opacity duration-[1000ms] ease-in-out motion-reduce:transition-none md:grid-cols-[0.95fr_1.05fr] ${index === selected ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}`}>
              <div className="relative z-10 flex flex-col items-start justify-center bg-gradient-to-r from-black/85 via-black/65 to-black/25 px-6 py-7 sm:px-10 sm:py-9 md:bg-gradient-to-br md:from-[#303033] md:via-[#28282b] md:to-[#202022] md:py-12 lg:px-12 lg:py-16">
                <div className="mb-4 flex items-center gap-3 md:mb-6">
                  <span aria-hidden="true" className="flex gap-1"><span className="h-4 w-1 -skew-x-[25deg] bg-[#f26522]" /><span className="h-4 w-1 -skew-x-[25deg] bg-[#f26522]" /></span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-300">Hechas para trabajar</span>
                </div>
                <h1 className="max-w-lg text-3xl font-bold min-[380px]:text-4xl leading-[1.06] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">{sentenceCase(banner.title)}<span className="text-[#f26522]">.</span></h1>
                <p className="mb-6 mt-4 max-w-sm md:mb-8 md:mt-5 text-base leading-relaxed text-gray-300 sm:text-lg">{sentenceCase(banner.subtitle)}</p>
                <Link to="/products" className="group/cta inline-flex min-h-12 w-full md:min-h-14 items-center justify-between gap-6 rounded-xl border border-orange-300/25 bg-[#f26522] px-5 py-3 text-base md:px-6 md:py-4 font-semibold text-white shadow-[0_8px_24px_-8px_rgba(242,101,34,0.5)] transition-colors hover:bg-[#ff7533] sm:w-auto sm:min-w-56 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f26522]">
                  Ver catálogo <ArrowRight className="h-5 w-5 transition-transform group-hover/cta:translate-x-1 motion-reduce:transition-none" strokeWidth={1.75} />
                </Link>
              </div>
              <div className="absolute inset-0 overflow-hidden bg-zinc-800 md:relative md:inset-auto md:min-h-full">
                <img src={banner.image} alt={banner.title} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" className="hero-slide-image absolute inset-0 h-full w-full object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <span aria-hidden="true" className="absolute right-5 top-5 hidden h-9 w-9 md:block border-r-2 border-t-2 border-[#f26522]" />
                <span aria-hidden="true" className="absolute bottom-5 left-5 hidden h-9 w-9 md:block border-b-2 border-l-2 border-[#f26522]" />
                <div className="absolute bottom-6 left-10 right-6 hidden items-end md:flex justify-between gap-4 text-white">
                  <span className="text-xs font-medium uppercase tracking-[0.15em]">Del taller a la obra</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
