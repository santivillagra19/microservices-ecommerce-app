import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types';
import { ShoppingBag, ArrowLeft, ArrowRight, Image as ImageIcon, Minus, Plus, CreditCard, MessageCircle, PackageX } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '../store/cartStore';

const price = (value: number) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
}).format(value);

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let active = true;
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      setQuantity(1);
      setSelectedImage(0);
      try {
        if (!id) throw new Error('Missing product ID');
        const data = await productService.getById(id);
        if (active) setProduct(data);
      } catch {
        if (active) setError('No pudimos cargar este producto. Puede que ya no esté disponible.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProduct();
    return () => { active = false; };
  }, [id]);

  const handleBuy = () => {
    if (product) {
      addItem(product, quantity);
      toast.success(`${quantity}x ${product.name} al carrito`, {
        description: 'Seguí comprando o revisá tu carrito para continuar.',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div role="status" className="mx-auto flex min-h-80 max-w-6xl flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white">
        <span aria-hidden="true" className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-[#f26522] motion-reduce:animate-none" />
        <p className="text-sm text-gray-500">Cargando producto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail mx-auto max-w-6xl rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
        <PackageX aria-hidden="true" className="mx-auto mb-5 h-12 w-12 text-[#c34b15]" strokeWidth={1.5} />
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Producto no disponible</h1>
        <p role="alert" className="mx-auto mt-3 max-w-md text-base leading-relaxed text-gray-500">{error || 'No encontramos el producto que estás buscando.'}</p>
        <Link to="/products" className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#f26522] px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-[#df581b]"><ArrowLeft className="h-4 w-4" />Volver al catálogo</Link>
      </div>
    );
  }

  const images = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];

  return (
    <div className="product-detail mx-auto max-w-6xl pb-5 pt-1 sm:pb-10 sm:pt-2">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <Link to="/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#f26522]"><ArrowLeft className="h-4 w-4" />Volver al catálogo</Link>
        {product.brand && <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600">{product.brand}</span>}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8">
        <section aria-label="Imágenes del producto" className="min-w-0">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-[#f5f5f4]">
            {images[selectedImage] ? <img src={images[selectedImage]} alt={product.name} className="h-full w-full object-contain p-6 sm:p-10" /> : (
              <div className="flex flex-col items-center gap-3 text-gray-400"><ImageIcon aria-hidden="true" className="h-16 w-16" strokeWidth={1} /><span className="text-sm">Sin imagen disponible</span></div>
            )}
            {images.length > 1 && <span className="absolute bottom-4 right-4 rounded-lg border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-medium tabular-nums text-gray-600">{selectedImage + 1} / {images.length}</span>}
          </div>
          {images.length > 1 && (
            <div role="group" aria-label="Elegir imagen del producto" className="mt-4 flex flex-wrap gap-3">
              {images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(index)} aria-label={`Ver imagen ${index + 1} de ${product.name}`} aria-pressed={selectedImage === index} className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-2 transition-colors ${selectedImage === index ? 'border-[#f26522]' : 'border-gray-200 hover:border-gray-400'}`}><img src={image} alt="" loading="lazy" className="h-full w-full object-contain" /></button>)}
            </div>
          )}
        </section>

        <div className="min-w-0 space-y-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">{product.brand || 'Nuestro catálogo'}</p>
            <h1 className="break-words text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">Equipá tu próximo proyecto con la herramienta indicada.</p>
          </div>

          <section aria-labelledby="product-purchase" className="overflow-hidden rounded-2xl border border-gray-300 border-t-[3px] border-t-[#f26522] bg-white shadow-[0_6px_24px_-8px_rgba(17,24,39,0.14)]">
            <div className="border-b border-gray-200 bg-[#f0f0ee] p-5 sm:p-6">
              <h2 id="product-purchase" className="mb-2 text-sm font-medium text-gray-600">Precio por unidad</h2>
              <p className="break-words text-4xl font-semibold tracking-tight tabular-nums text-gray-900">{price(product.price)}</p>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p id="product-quantity" className="mb-2 text-sm font-medium text-gray-600">Cantidad</p>
                  <div role="group" aria-labelledby="product-quantity" className="inline-flex items-center overflow-hidden rounded-xl border border-gray-300 bg-gray-50">
                    <button type="button" onClick={() => setQuantity(quantity - 1)} disabled={quantity <= 1} aria-label="Reducir cantidad" className="flex h-12 w-12 items-center justify-center text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300"><Minus className="h-4 w-4" /></button>
                    <span aria-live="polite" aria-atomic="true" className="min-w-12 px-2 text-center text-lg font-semibold tabular-nums text-gray-900">{quantity}</span>
                    <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Aumentar cantidad" className="flex h-12 w-12 items-center justify-center text-gray-700 transition-colors hover:bg-gray-200"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="min-w-0 text-right"><p className="mb-2 text-sm text-gray-500">Subtotal</p><p aria-live="polite" aria-atomic="true" className="break-words text-xl font-semibold tabular-nums text-gray-900">{price(product.price * quantity)}</p></div>
              </div>
              <button type="button" onClick={handleBuy} className="flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#f26522] px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#df581b]"><ShoppingBag className="h-5 w-5 shrink-0" strokeWidth={1.5} />Agregar al carrito</button>
              <Link to="/cart" className="flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#c34b15]">Ver mi carrito<ArrowRight className="h-4 w-4" /></Link>
              <div className="flex items-start gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600"><CreditCard aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#c34b15]" strokeWidth={1.5} /><p className="leading-relaxed">Elegí Mercado Pago, transferencia o efectivo al finalizar la compra.</p></div>
            </div>
          </section>

          <Link to="/contact" className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-[#f26522]/50 sm:p-5"><MessageCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#c34b15]" strokeWidth={1.5} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-gray-900">¿Tenés dudas sobre este producto?</span><span className="mt-1 block text-sm leading-relaxed text-gray-500">Consultanos por disponibilidad, entrega y garantía.</span></span><ArrowRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /></Link>
        </div>
      </div>

      <section aria-labelledby="product-description" className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f0f0ee] px-5 py-5 sm:px-7"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">Conocé el producto</p><h2 id="product-description" className="text-xl font-semibold tracking-tight text-gray-900">Descripción y detalles</h2></div>
        <div className="p-5 sm:p-7"><p className="max-w-3xl whitespace-pre-line break-words text-base leading-8 text-gray-600">{product.description || 'Consultanos para conocer más detalles de este producto.'}</p></div>
      </section>
    </div>
  );
};
