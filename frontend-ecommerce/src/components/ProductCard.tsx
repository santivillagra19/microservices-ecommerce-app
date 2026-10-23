import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { inventoryService } from '../services/inventoryService';

interface ProductCardProps {
  product: Product;
  onBuy?: (product: Product) => void;
  stock?: number | null;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onBuy, stock: suppliedStock }) => {
  const [fetchedStock, setFetchedStock] = useState<number | null>(null);

  useEffect(() => {
    if (suppliedStock !== undefined) return;
    let active = true;
    inventoryService.getAll().then(data => {
      if (active) setFetchedStock(data.find(item => item.sku === product.id)?.quantity ?? 0);
    }).catch(() => {
      if (active) setFetchedStock(null);
    });
    return () => { active = false; };
  }, [product.id, suppliedStock]);

  const stock = suppliedStock === undefined ? fetchedStock : suppliedStock;
  const isOutOfStock = stock !== null && stock <= 0;
  const canBuy = stock !== null && stock > 0;
  const image = product.imageUrls?.[0] || product.imageUrl;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white transition-[border-color,box-shadow] duration-300 hover:border-gray-300 hover:shadow-[0_12px_32px_-20px_rgba(0,0,0,0.25)]">
      <Link to={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#f5f5f4] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#f26522]" aria-label={`Ver ${product.name}`}>
        {image ? (
          <img src={image} alt={product.name} loading="lazy" className={`h-full w-full object-contain p-7 transition-transform duration-500 motion-reduce:transition-none ${isOutOfStock ? 'opacity-60 grayscale' : 'group-hover:scale-105 group-focus-within:scale-105'}`} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <ImageIcon className="h-10 w-10" strokeWidth={1} />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
        {isOutOfStock && (
          <span className="absolute left-0 top-5 inline-flex items-center gap-2.5 rounded-r-sm border border-l-0 border-gray-300/70 bg-[#e7e7e5]/95 py-2 pl-4 pr-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600">
            <span className="flex items-center gap-[3px]" aria-hidden="true">
              <span className="h-3 w-px -skew-x-[25deg] bg-gray-400" />
              <span className="h-3 w-px -skew-x-[25deg] bg-gray-400" />
            </span>
            Sin stock
          </span>
        )}
        <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-500 transition-colors group-hover:text-gray-900" aria-hidden="true">
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">{product.brand || 'Herramientas'}</p>
        <Link to={`/products/${product.id}`} className="rounded-sm focus-visible:outline-2 focus-visible:outline-[#f26522]">
          <h3 className="line-clamp-2 min-h-12 text-base font-semibold leading-6 tracking-tight text-gray-900 transition-colors hover:text-[#f26522]">{product.name}</h3>
        </Link>
        <p className="mb-5 mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">{product.description}</p>
        <div className="mt-auto border-t border-gray-100 pt-4">
          <p className={`mb-4 text-2xl font-semibold tracking-tight tabular-nums ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
            <span className="mr-1 text-base font-normal">$</span>{product.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <button type="button" onClick={() => canBuy && onBuy?.(product)} disabled={!canBuy} aria-label={canBuy ? `Comprar ${product.name}` : `${product.name}: ${isOutOfStock ? 'sin stock' : 'stock no disponible'}`} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors enabled:hover:bg-[#f26522] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f26522] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            {isOutOfStock ? 'Sin stock' : canBuy ? 'Comprar' : 'Stock no disponible'}
          </button>
        </div>
      </div>
    </article>
  );
});
