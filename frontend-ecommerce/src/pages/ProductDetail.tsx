import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types';
import { ShoppingBag, ArrowLeft, Image as ImageIcon, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { useCartStore } from '../store/cartStore';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await productService.getById(id);
        setProduct(data);
      } catch (err) {
        setError('Error al cargar el producto. Puede que no exista.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleBuy = () => {
    if (product) {
      addItem(product, quantity);
      toast.success(`${quantity}x ${product.name} al carrito`, {
        description: 'Sigue comprando o ve al carrito.',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center text-[#f26522] hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a productos
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm">
          {error || 'Producto no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button 
        onClick={() => navigate('/products')}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al catálogo
      </button>

      <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 lg:p-12">
          
          {/* Columna de Imagen */}
          <div className="flex flex-col">
            <div className="w-full aspect-square bg-gray-50 rounded-none overflow-hidden border border-gray-100 flex items-center justify-center relative">
              {(product.imageUrls?.[0] || product.imageUrl) ? (
                <img 
                  src={product.imageUrls?.[0] || product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-20 h-20 mb-4 opacity-50" />
                  <span className="text-sm font-medium uppercase tracking-wider opacity-70">Sin imagen disponible</span>
                </div>
              )}
            </div>
          </div>

          {/* Columna de Detalles */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              {product.name}
            </h1>
            
            <div className="text-4xl font-black text-[#f26522] mb-6">
              ${product.price.toFixed(2)}
            </div>

            <div className="prose prose-sm sm:prose text-gray-500 mb-8">
              <p className="leading-relaxed text-lg">
                {product.description}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-8 mb-8">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Cantidad</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-200 rounded-none overflow-hidden">
                  <button 
                    onClick={handleDecreaseQuantity}
                    className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center font-semibold text-lg text-gray-900">
                    {quantity}
                  </span>
                  <button 
                    onClick={handleIncreaseQuantity}
                    className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">Unidades</span>
              </div>
            </div>

            <div className="mt-auto flex gap-4">
              <Button 
                variant="primary" 
                icon={ShoppingBag} 
                onClick={handleBuy}
                className="w-full py-4 text-lg rounded-none shadow-lg hover:shadow-xl transition-all font-bold"
              >
                Añadir al carrito
              </Button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Información Adicional</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Stock disponible</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span> Envío gratis a partir de $50.00</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span> Garantía de 12 meses</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};


