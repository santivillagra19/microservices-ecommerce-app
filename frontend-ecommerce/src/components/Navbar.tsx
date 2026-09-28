// Navbar.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, LogIn, LogOut, Tag, ChevronDown, PenTool, Wrench, Hammer, Search, ShoppingBag, X, Phone, Zap, Menu, Shield, Ruler, Box, Settings, Briefcase, User, ClipboardList } from 'lucide-react';
import { authService } from '../services/authService';
import { productService } from '../services/productService';
import { Button } from './ui/Button';
import type { Product } from '../types';
import { useCartStore } from '../store/cartStore';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [isAdmin, setIsAdmin] = useState(() => authService.hasRole('ADMIN'));
  
  const totalItems = useCartStore((state) => 
    state.items.reduce((total, item) => total + item.quantity, 0)
  );

  useEffect(() => {
    // Cargar productos para el autocompletado de la barra de búsqueda
    productService.getAll()
      .then(setProducts)
      .catch(() => {});
  }, []);

  // Actualizar estado de autenticación y cerrar menú móvil al navegar
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    setIsAdmin(authService.hasRole('ADMIN'));
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Escuchar cambios de almacenamiento
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setIsAdmin(authService.hasRole('ADMIN'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // Session state observer
  }, [isAuthenticated, isAdmin]);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  // Resultados del autocompletado (máximo 5)
  const autocompleteResults = searchQuery.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);

  return (
    <>
      {/* Top Bar Naranja */}
      <div className="bg-[#f26522] text-white text-xs font-bold uppercase tracking-widest text-center py-2 px-4 flex items-center justify-center gap-2">
        <span>🔥 ENVÍO GRATIS A TODO EL PAÍS EN COMPRAS SUPERIORES A $150.000</span>
      </div>

      <nav className="bg-black/75 backdrop-blur-md text-white border-b border-white/10 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3 sm:gap-4">
          
          {/* Menú Izquierdo: Botón Hamburguesa en Mobile + Logo */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-8">
            {/* Botón Hamburguesa visible en mobile (< md) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f26522] transition-colors"
              aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-[#f26522]" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <Wrench className="h-6 w-6 text-[#f26522]" />
              <span className="font-bold text-xl text-white tracking-tight hidden sm:block">FerreStore</span>
            </Link>

            {/* Dropdown de Tienda/Categorías y Ofertas visible en desktop y tablet (>= md) */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <div className="relative group z-40">
                <Link to="/products" className="text-gray-300 hover:text-[#f26522] px-3 py-2 text-sm font-medium flex items-center gap-1 transition-colors">
                  <Package className="h-4 w-4"/> Tienda <ChevronDown className="h-3 w-3 ml-1" />
                </Link>
                <div className="absolute left-0 mt-0 w-56 bg-black/85 backdrop-blur-xl border border-white/10 border-t-2 border-t-[#f26522] rounded-none shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 origin-top-left">
                  <div className="py-1">
                    <Link to="/products" className="block px-5 py-3 text-xs font-black uppercase tracking-wider text-gray-300 hover:bg-white/5 hover:text-[#f26522] transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      VER TODO EL CATÁLOGO
                    </Link>
                    <div className="border-t border-gray-800 my-1"></div>
                    <Link to="/products?category=herramientas-electricas" className="flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <PenTool className="h-4 w-4 mr-3 text-[#f26522]" /> Eléctricas
                    </Link>
                    <Link to="/products?category=herramientas-manuales" className="flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <Hammer className="h-4 w-4 mr-3 text-[#f26522]" /> Manuales
                    </Link>
                    <Link to="/products?category=medicion" className="flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <Ruler className="h-4 w-4 mr-3 text-[#f26522]" /> Medición
                    </Link>
                    <Link to="/products?category=almacenamiento" className="flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <Box className="h-4 w-4 mr-3 text-[#f26522]" /> Almacenamiento
                    </Link>
                    <Link to="/products?category=equipamiento" className="flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <Wrench className="h-4 w-4 mr-3 text-[#f26522]" /> Equipamiento
                    </Link>
                    <Link to="/products?category=neumaticas" className="flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <Settings className="h-4 w-4 mr-3 text-[#f26522]" /> Neumáticas
                    </Link>
                    <Link to="/products?category=soldadura" className="flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <Zap className="h-4 w-4 mr-3 text-[#f26522]" /> Soldadura
                    </Link>
                    <Link to="/products?category=proteccion" className="flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <Shield className="h-4 w-4 mr-3 text-[#f26522]" /> Protección
                    </Link>
                  </div>
                </div>
              </div>

              <Link to="/empresas" className="text-gray-300 hover:text-[#f26522] px-3 py-2 text-sm font-medium flex items-center gap-1 transition-colors">
                <Briefcase className="h-4 w-4"/> Venta a Empresas
              </Link>
              <Link to="/contact" className="text-gray-300 hover:text-[#f26522] px-3 py-2 text-sm font-medium flex items-center gap-1 transition-colors">
                <Phone className="h-4 w-4"/> Contacto
              </Link>
            </div>
          </div>

          {/* Iconos derechos y Búsqueda */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            
            {/* Barra de Búsqueda Fija */}
            <div className="flex items-center relative mr-1 sm:mr-2 flex-1 max-w-[180px] sm:max-w-xs lg:max-w-sm justify-end">
              <form onSubmit={handleSearch} className="relative w-full transition-all z-50">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Buscar herramientas, marcas..."
                  className="block w-full pl-9 pr-8 sm:pr-9 py-1.5 sm:py-2 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-700 hover:border-zinc-500 focus:border-[#f26522] rounded-full leading-5 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f26522]/40 focus:bg-black text-white text-xs sm:text-sm shadow-sm transition-all"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')} 
                    className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {isSearchFocused && searchQuery.trim() !== '' && (
                  <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-neutral-900 text-white border border-gray-800 rounded-lg shadow-2xl overflow-hidden z-50">
                    {autocompleteResults.length > 0 ? (
                      <>
                        <ul className="py-1 divide-y divide-gray-800">
                          {autocompleteResults.map(product => (
                            <li key={product.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery('');
                                  navigate(`/products/${product.id}`);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 hover:text-[#f26522] flex items-center gap-3 transition-colors"
                              >
                                {(product.imageUrls?.[0] || product.imageUrl) ? (
                                  <img src={product.imageUrls?.[0] || product.imageUrl} alt="" className="w-9 h-9 rounded object-contain bg-white p-0.5 border border-gray-700" />
                                ) : (
                                  <div className="w-9 h-9 rounded bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold truncate text-white">{product.name}</div>
                                  <div className="text-xs text-gray-400 truncate">{product.description}</div>
                                </div>
                                <div className="font-black text-[#f26522] whitespace-nowrap">
                                  ${product.price.toFixed(2)}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button 
                          type="submit" 
                          className="w-full text-center py-2.5 text-sm font-bold text-[#f26522] hover:bg-white/5 border-t border-gray-800 transition-colors"
                        >
                          Ver todos los resultados
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        No hay coincidencias para "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Botón Carrito */}
            <Link to="/cart" className="relative p-2 text-gray-300 hover:bg-gray-800 hover:text-[#f26522] rounded-full transition-colors mr-0.5">
              <ShoppingBag className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[#f26522] rounded-full border-2 border-black">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth */}
            {(isAuthenticated || isAdmin) ? (
              <div className="relative group z-50">
                <button className="p-2 text-gray-300 hover:text-[#f26522] hover:bg-white/10 rounded-full transition-colors flex items-center">
                  <User className="h-6 w-6" />
                </button>
                <div className="absolute right-0 mt-0 w-48 bg-black/85 backdrop-blur-xl border border-white/10 border-t-2 border-t-[#f26522] rounded-none shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 origin-top-right">
                  <div className="py-1 flex flex-col">
                    <Link to="/orders" className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <ClipboardList className="h-4 w-4 mr-3 text-[#f26522]" /> Mis pedidos
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                        <Shield className="h-4 w-4 mr-3 text-[#f26522]" /> Panel Admin
                      </Link>
                    )}
                    <div className="border-t border-gray-800 my-1"></div>
                    <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-[#f26522] transition-colors border-l-2 border-transparent hover:border-[#f26522]">
                      <LogOut className="h-4 w-4 mr-3 text-[#f26522]" /> Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={() => navigate('/login')} variant="primary" icon={LogIn} className="py-1.5 px-2.5 sm:px-3 text-xs sm:text-sm">
                <span className="hidden sm:inline">Entrar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable (< md) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black/95 backdrop-blur-md px-4 pt-3 pb-5 transition-all shadow-2xl">
          <div className="space-y-2">
            
            {/* Sección Tienda en Mobile con Acordeón de Categorías */}
            <div className="rounded-lg bg-gray-900/70 border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between pr-2">
                <Link
                  to="/products"
                  className="flex items-center gap-3 px-3 py-3 text-base font-semibold text-white hover:text-[#f26522] transition-colors flex-1"
                >
                  <Package className="h-5 w-5 text-[#f26522]" />
                  <span>Tienda</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                  className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors"
                  aria-label="Ver categorías de tienda"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileCategoriesOpen ? 'rotate-180 text-[#f26522]' : ''}`} />
                </button>
              </div>

              {/* Subcategorías de Tienda */}
              {isMobileCategoriesOpen && (
                <div className="px-3 pb-3 pt-1 space-y-1 border-t border-gray-800 bg-black/50">
                  <Link
                    to="/products"
                    className="block px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-300 hover:text-[#f26522] hover:bg-white/5 rounded transition-colors border-l-2 border-[#f26522]"
                  >
                    VER TODO EL CATÁLOGO
                  </Link>
                  <Link
                    to="/products?category=herramientas-electricas"
                    className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <PenTool className="h-4 w-4 mr-2.5 text-[#f26522]" /> Eléctricas
                  </Link>
                  <Link
                    to="/products?category=herramientas-manuales"
                    className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Hammer className="h-4 w-4 mr-2.5 text-[#f26522]" /> Manuales
                  </Link>
                  <Link
                    to="/products?category=medicion"
                    className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Ruler className="h-4 w-4 mr-2.5 text-[#f26522]" /> Medición
                  </Link>
                  <Link
                    to="/products?category=almacenamiento"
                    className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Box className="h-4 w-4 mr-2.5 text-[#f26522]" /> Almacenamiento
                  </Link>
                  <Link
                    to="/products?category=equipamiento"
                    className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Wrench className="h-4 w-4 mr-2.5 text-[#f26522]" /> Equipamiento
                  </Link>
                  <Link
                    to="/products?category=neumaticas"
                    className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2.5 text-[#f26522]" /> Neumáticas
                  </Link>
                  <Link
                    to="/products?category=soldadura"
                    className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Zap className="h-4 w-4 mr-2.5 text-[#f26522]" /> Soldadura
                  </Link>
                  <Link
                    to="/products?category=proteccion"
                    className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Shield className="h-4 w-4 mr-2.5 text-[#f26522]" /> Protección
                  </Link>
                </div>
              )}
            </div>

            {/* Enlace Venta a Empresas */}
            <Link
              to="/empresas"
              className="flex items-center justify-between px-3 py-3 rounded-lg text-base font-semibold text-white bg-gray-900/70 border border-gray-800 hover:border-[#f26522]/50 hover:text-[#f26522] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-[#f26522]" />
                <span>Venta a Empresas</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#f26522]/20 text-[#f26522] border border-[#f26522]/40">
                B2B
              </span>
            </Link>

            {/* Enlace Contacto */}
            <Link
              to="/contact"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-900/70 hover:text-white transition-colors"
            >
              <Phone className="h-5 w-5 text-gray-400" />
              <span>Contacto</span>
            </Link>

            {isAuthenticated && (
              <div className="pt-4 mt-2 border-t border-gray-800 space-y-2">
                <Link
                  to="/orders"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-900/70 hover:text-white transition-colors"
                >
                  <ClipboardList className="h-5 w-5 text-gray-400" />
                  <span>Mis pedidos</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-orange-400 hover:bg-gray-900/70 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-[#f26522]" />
                    <span>Panel Administrador</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg text-base font-medium text-red-400 hover:bg-gray-900/70 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-5 w-5 text-red-400" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </nav>
    </>
  );
};



