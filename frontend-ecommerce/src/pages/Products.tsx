import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types';
import { PackageX, SearchX, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useCartStore } from '../store/cartStore';
import { Select } from '../components/ui/Select';
import { toast } from 'sonner';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || '';
  const brandQuery = searchParams.get('brand') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const filters = {
          ...(searchQuery && { search: searchQuery }),
          ...(categoryQuery && { category: categoryQuery }),
          ...(brandQuery && { brand: brandQuery }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice })
        };
        const data = await productService.getAll(filters);
        setProducts(data);
      } catch (err) {
        setError('Error al cargar los productos. El servicio podría estar inactivo.');
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // debounce para evitar multiples llamadas al tipear precios
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, categoryQuery, brandQuery, minPrice, maxPrice]);

  // Al cambiar la categoría o buscar, subir el scroll automáticamente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryQuery, searchQuery, brandQuery]);

  const handleBuy = (product: Product) => {
    addItem(product, 1);
    toast.success(`${product.name} agregado al carrito`, {
      description: 'Ve al carrito para finalizar la compra.',
      duration: 3000,
    });
  };

  const handleCategoryChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('category', val);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  const handleBrandChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('brand', val);
    else newParams.delete('brand');
    setSearchParams(newParams);
  };

  // Ordenamiento de productos (este se mantiene en cliente por ser sencillo)
  let sortedProducts = [...products];
  sortedProducts.sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm flex items-center gap-3">
        <PackageX className="h-5 w-5" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Botón para mostrar filtros en móvil */}
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-[#f26522] font-medium bg-orange-50 px-4 py-2 rounded-none w-full justify-center"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {/* Sidebar de Filtros */}
      <div className={`w-full md:w-64 shrink-0 space-y-6 bg-white p-5 rounded-none border border-gray-100 h-fit ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="font-bold text-gray-900 text-lg">Filtros</h2>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
          <Select 
            value={categoryQuery}
            onChange={handleCategoryChange}
            options={[
              { value: '', label: 'Todas las categorías' },
              { value: 'Herramientas Eléctricas', label: 'Herramientas Eléctricas' },
              { value: 'Herramientas Manuales', label: 'Herramientas Manuales' },
              { value: 'Medición', label: 'Medición' },
              { value: 'Almacenamiento', label: 'Almacenamiento' },
              { value: 'Equipamiento', label: 'Equipamiento' },
              { value: 'Neumáticas', label: 'Neumáticas' },
              { value: 'Soldadura', label: 'Soldadura' },
              { value: 'Protección', label: 'Protección' }
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
          <Select 
            value={brandQuery}
            onChange={handleBrandChange}
            options={[
              { value: '', label: 'Todas las marcas' },
              { value: 'DeWalt', label: 'DeWalt' },
              { value: 'Makita', label: 'Makita' },
              { value: 'Bosch', label: 'Bosch' },
              { value: 'Stanley', label: 'Stanley' },
              { value: 'Black+Decker', label: 'Black+Decker' },
              { value: 'Truper', label: 'Truper' }
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Precio ($)</label>
          <div className="flex flex-col gap-2">
            <input 
              type="number" 
              placeholder="Mín" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full border border-gray-200 rounded-none px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f26522]"
              min="0"
            />
            <input 
              type="number" 
              placeholder="Máx" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full border border-gray-200 rounded-none px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f26522]"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Ordenar por</label>
          <Select 
            value={sortBy}
            onChange={setSortBy}
            placeholder="Relevancia"
            options={[
              { value: '', label: 'Relevancia' },
              { value: 'price-asc', label: 'Precio: Menor a Mayor' },
              { value: 'price-desc', label: 'Precio: Mayor a Menor' },
              { value: 'name-asc', label: 'Nombre: A - Z' },
              { value: 'name-desc', label: 'Nombre: Z - A' }
            ]}
          />
        </div>
        
        {(categoryQuery || brandQuery || minPrice || maxPrice || sortBy) && (
          <button
            onClick={() => {
              setSearchParams(new URLSearchParams());
              setMinPrice('');
              setMaxPrice('');
              setSortBy('');
            }}
            className="w-full py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-none transition-colors mt-4"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery ? `Resultados para "${searchQuery}"` : 
             categoryQuery ? `Categoría: ${categoryQuery.charAt(0).toUpperCase() + categoryQuery.slice(1)}` : 
             brandQuery ? `Marca: ${brandQuery}` :
             'Nuestro Catálogo de Herramientas'}
          </h2>
          {sortedProducts.length > 0 && (
            <p className="text-gray-500 mt-1 text-sm">Mostrando {sortedProducts.length} productos</p>
          )}
        </div>

        {sortedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-none border border-gray-100 flex flex-col items-center">
            <SearchX className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No tenemos nada que coincida con tu búsqueda. Intenta con otros filtros o explora nuestro catálogo general.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onBuy={handleBuy} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
