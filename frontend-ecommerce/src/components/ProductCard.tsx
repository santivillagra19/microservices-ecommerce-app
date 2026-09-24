import React, { useEffect, useState } from 'react';
import { ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product, Inventory } from '../types';
import { Button } from './ui/Button';
import { inventoryService } from '../services/inventoryService';

interface ProductCardProps {
  product: Product;
  onBuy?: (product: Product) => void;
}

// Promesa compartida para evitar múltiples llamadas a la API al renderizar muchas tarjetas
let inventoryPromise: Promise<Inventory[]> | null = null;

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onBuy }) => {
  const [stock, setStock] = useState<number | null>(null);

  useEffect(() => {
    if (!inventoryPromise) {
      inventoryPromise = inventoryService.getAll();
    }
    inventoryPromise.then(data => {
      const item = data.find(i => i.sku === product.id);
      // Asumimos que si no está en el inventario, el stock es 0
      setStock(item ? item.quantity : 0);
    }).catch(() => {
      // En caso de error, podríamos asumir que hay stock para no bloquear la compra, o 0.
      setStock(1); 
    });
  }, [product.id]);

  const isOutOfStock = stock === 0;

  return (
    <div className={`group bg-white border border-gray-100 rounded-none overflow-hidden transition-all duration-300 flex flex-col h-full ${isOutOfStock ? 'opacity-70 grayscale' : 'hover:shadow-xl hover:-translate-y-1'}`}>
      {/* Contenedor de la imagen */}
      <Link 
        to={isOutOfStock ? '#' : `/products/${product.id}`} 
        className={`relative w-full aspect-[4/3] bg-gray-50 overflow-hidden border-b border-gray-100 block ${isOutOfStock ? 'cursor-not-allowed' : ''}`}
        onClick={(e) => isOutOfStock && e.preventDefault()}
      >
        {(product.imageUrls?.[0] || product.imageUrl) ? (
          <img 
            src={product.imageUrls?.[0] || product.imageUrl} 
            alt={product.name} 
            className={`w-full h-full object-contain p-2 transition-transform duration-500 ease-out ${!isOutOfStock && 'group-hover:scale-105'}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-xs font-medium uppercase tracking-wider opacity-70">Sin imagen</span>
          </div>
        )}
        
        {/* Etiqueta de Sin Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <span className="bg-red-600 text-white font-bold px-4 py-2 uppercase tracking-widest text-sm transform -rotate-12 shadow-lg">
              Sin stock
            </span>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <Link 
          to={isOutOfStock ? '#' : `/products/${product.id}`}
          onClick={(e) => isOutOfStock && e.preventDefault()}
          className={isOutOfStock ? 'cursor-not-allowed' : ''}
        >
          <h3 className={`text-lg font-bold line-clamp-1 mb-2 transition-colors ${isOutOfStock ? 'text-gray-500' : 'text-gray-800 group-hover:text-[#f26522]'}`}>
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-500 text-sm mb-5 line-clamp-2 leading-relaxed flex-grow">
          {product.description}
        </p>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
          <span className={`text-2xl font-black tracking-tight ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
            ${product.price.toFixed(2)}
          </span>
          <Button 
            variant="primary" 
            icon={ShoppingBag} 
            onClick={() => !isOutOfStock && onBuy && onBuy(product)}
            disabled={isOutOfStock}
            className={`rounded-none px-5 py-2 transition-all ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-gray-900 hover:bg-gray-800 shadow-md hover:shadow-lg'}`}
          >
            {isOutOfStock ? 'Agotado' : 'Comprar'}
          </Button>
        </div>
      </div>
    </div>
  );
});


