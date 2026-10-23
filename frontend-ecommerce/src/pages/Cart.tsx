import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, Truck } from 'lucide-react';

const price = (value: number) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
}).format(value);

export const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const total = getTotalPrice();

  return (
    <div className="cart-page mx-auto max-w-6xl pb-5 pt-1 sm:pb-10 sm:pt-2">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Tu carrito<span className="text-[#f26522]">.</span></h1>
          {totalItems > 0 && <p className="mt-2 text-base text-gray-500">{totalItems} {totalItems === 1 ? 'producto listo' : 'productos listos'} para tu compra.</p>}
        </div>
        {items.length > 0 && <Link to="/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#f26522]"><ArrowLeft className="h-4 w-4" />Seguir comprando</Link>}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center sm:py-20">
          <span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#f26522]/20 bg-orange-50"><ShoppingBag className="h-9 w-9 text-[#f26522]" strokeWidth={1.5} /></span>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900">Tu carrito está vacío</h2>
          <p className="mx-auto mb-8 max-w-sm text-base leading-relaxed text-gray-500">El próximo proyecto empieza con la herramienta indicada. Encontrala en nuestro catálogo.</p>
          <Link to="/products" className="cart-primary inline-flex min-h-13 items-center justify-center gap-5 rounded-xl bg-[#f26522] px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#df581b]">Ver catálogo<ArrowRight className="h-5 w-5" /></Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
          <section aria-label="Productos en tu carrito" className="min-w-0">
            <ul className="space-y-4">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <Link to={`/products/${product.id}`} aria-label={`Ver ${product.name}`} className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-[#f5f5f4] sm:h-28 sm:w-28">
                      {(product.imageUrls?.[0] || product.imageUrl) ? <img src={product.imageUrls?.[0] || product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-contain p-3 transition-transform hover:scale-105 motion-reduce:transition-none" /> : <ShoppingBag className="h-8 w-8 text-gray-400" strokeWidth={1.5} />}
                    </Link>
                    <div className="min-w-0 flex-1">
                      {product.brand && <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">{product.brand}</p>}
                      <Link to={`/products/${product.id}`} className="text-base font-semibold leading-snug tracking-tight text-gray-900 transition-colors hover:text-[#f26522] sm:text-lg">{product.name}</Link>
                      <p className="mt-2 text-sm text-gray-500">{price(product.price)} <span className="text-gray-400">/ unidad</span></p>
                    </div>
                    <button type="button" onClick={() => removeItem(product.id)} aria-label={`Eliminar ${product.name} del carrito`} className="cart-icon shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" strokeWidth={1.75} /></button>
                  </div>
                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-gray-100 pt-4">
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500">Cantidad</p>
                      <div role="group" aria-label={`Cantidad de ${product.name}`} className="inline-flex items-center overflow-hidden rounded-xl border border-gray-300 bg-gray-50">
                        <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} disabled={quantity <= 1} aria-label={`Reducir cantidad de ${product.name}`} className="cart-icon text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300"><Minus className="h-4 w-4" /></button>
                        <span aria-live="polite" aria-atomic="true" className="min-w-10 px-2 text-center text-base font-semibold tabular-nums text-gray-900">{quantity}</span>
                        <button type="button" onClick={() => updateQuantity(product.id, quantity + 1)} aria-label={`Aumentar cantidad de ${product.name}`} className="cart-icon text-gray-700 hover:bg-gray-200"><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="min-w-0 text-right"><p className="mb-1 text-xs font-medium text-gray-500">Subtotal</p><p className="break-words text-xl font-semibold tracking-tight tabular-nums text-gray-900">{price(product.price * quantity)}</p></div>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={clearCart} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" />Vaciar carrito</button>
          </section>

          <aside aria-labelledby="cart-summary" className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-[0_6px_24px_-8px_rgba(17,24,39,0.14)] lg:sticky lg:top-28">
            <div className="border-b border-gray-200 bg-[#f0f0ee] px-6 py-5"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">Un paso más</p><h2 id="cart-summary" className="text-xl font-semibold tracking-tight text-gray-900">Resumen del pedido</h2></div>
            <div className="p-6">
              <dl className="space-y-4 text-base">
                <div className="flex flex-wrap justify-between gap-2"><dt className="text-gray-600">Subtotal ({totalItems})</dt><dd className="font-medium tabular-nums text-gray-900">{price(total)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-600">Envío</dt><dd className="rounded-md bg-green-50 px-2 py-0.5 text-sm font-medium text-green-700">Gratis</dd></div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-gray-200 pt-5"><dt className="text-lg font-semibold text-gray-900">Total</dt><dd aria-live="polite" aria-atomic="true" className="text-2xl font-semibold tracking-tight tabular-nums text-gray-900">{price(total)}</dd></div>
              </dl>
              <Link to="/checkout" className="cart-primary mt-6 flex min-h-13 w-full items-center justify-between gap-3 rounded-xl bg-[#f26522] px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#df581b]">Continuar al pago<ArrowRight className="h-5 w-5 shrink-0" /></Link>
              <p className="mt-4 text-center text-sm leading-relaxed text-gray-500">Revisá tus datos y elegí cómo pagar en el siguiente paso.</p>
              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5 text-sm text-gray-600"><Truck className="h-5 w-5 shrink-0 text-[#f26522]" strokeWidth={1.5} /><span>De nuestro catálogo a tu próximo proyecto.</span></div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
