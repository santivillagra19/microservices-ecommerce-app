import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CreditCard, Landmark, ShoppingBag, UserRound } from 'lucide-react';

const price = (value: number) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
}).format(value);

export const Checkout = () => {
  const { items, getTotalPrice } = useCartStore();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(() => authService.getEmail());
  const [telefono, setTelefono] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MERCADOPAGO' | 'TRANSFERENCIA'>('MERCADOPAGO');
  const [loading, setLoading] = useState(false);

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderLineItemsList = items.map(item => ({
        sku: item.product.id.toString(),
        price: item.product.price,
        quantity: item.quantity,
      }));
      const response = await orderService.create({ email, nombre, telefono, direccionEntrega, paymentMethod, orderLineItemsList });
      if (paymentMethod === 'MERCADOPAGO' && response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        navigate(`/checkout/success?orderNumber=${response.orderNumber}&method=TRANSFERENCIA`);
      }
    } catch {
      toast.error('Ocurrió un error al procesar el pago. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page service-page mx-auto max-w-6xl pb-5 pt-1 sm:pb-10 sm:pt-2">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Finalizar compra<span className="text-[#f26522]">.</span></h1>
          <p className="mt-2 text-base text-gray-500">Completá tus datos y elegí cómo pagar.</p>
        </div>
        <Link to="/cart" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#f26522]"><ArrowLeft className="h-4 w-4" />Volver al carrito</Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
        <form onSubmit={handleCheckout} className="min-w-0 space-y-6">
          <section aria-labelledby="checkout-data" className="service-form overflow-hidden rounded-2xl border bg-white">
            <div className="flex items-center gap-4 border-b border-gray-200 bg-[#f0f0ee] px-5 py-5 sm:px-7">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f26522]/25 bg-orange-50 text-[#c34b15]"><UserRound className="h-5 w-5" /></span>
              <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">01 · Información de contacto</p><h2 id="checkout-data" className="text-xl font-semibold tracking-tight text-gray-900">Tus datos</h2></div>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
              <div className="sm:col-span-2"><Input label="Nombre completo" id="nombre" name="nombre" autoComplete="name" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan Pérez" /></div>
              <Input label="Email" type="email" id="email" name="email" autoComplete="off" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
              <Input label="Teléfono" type="tel" id="telefono" name="telefono" autoComplete="tel" required value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+54 9 11 1234-5678" />
              <div className="sm:col-span-2"><Input label="Dirección de entrega" id="direccionEntrega" name="direccionEntrega" autoComplete="street-address" required value={direccionEntrega} onChange={e => setDireccionEntrega(e.target.value)} placeholder="Calle, número, localidad y provincia" /></div>
              <p className="text-sm leading-relaxed text-gray-500 sm:col-span-2">Usaremos estos datos para enviarte la confirmación y coordinar la entrega.</p>
            </div>
          </section>

          <section aria-labelledby="checkout-payment" className="overflow-hidden rounded-2xl border border-gray-300 border-t-[3px] border-t-[#f26522] bg-white shadow-[0_6px_24px_-8px_rgba(17,24,39,0.14)]">
            <div className="flex items-center gap-4 border-b border-gray-200 bg-[#f0f0ee] px-5 py-5 sm:px-7">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f26522]/25 bg-orange-50 text-[#c34b15]"><CreditCard className="h-5 w-5" /></span>
              <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">02 · Elegí cómo pagar</p><h2 id="checkout-payment" className="text-xl font-semibold tracking-tight text-gray-900">Métodos de pago</h2></div>
            </div>
            <div className="space-y-5 p-5 sm:p-7">
              <fieldset className="space-y-3">
                <legend className="sr-only">Seleccioná un método de pago</legend>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-[#f26522] sm:gap-4 sm:p-5 ${paymentMethod === 'MERCADOPAGO' ? 'border-[#f26522] bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-gray-400'}`}>
                  <input type="radio" name="paymentMethod" value="MERCADOPAGO" checked={paymentMethod === 'MERCADOPAGO'} onChange={() => setPaymentMethod('MERCADOPAGO')} className="h-5 w-5 shrink-0 accent-[#f26522]" />
                  <CreditCard aria-hidden="true" className={`h-6 w-6 shrink-0 ${paymentMethod === 'MERCADOPAGO' ? 'text-[#c34b15]' : 'text-gray-500'}`} />
                  <span className="min-w-0"><span className="block text-base font-semibold text-gray-900">Tarjeta de crédito o débito</span><span className="mt-1 block text-sm leading-relaxed text-gray-600">Continuás a Mercado Pago para realizar el pago.</span></span>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-[#f26522] sm:gap-4 sm:p-5 ${paymentMethod === 'TRANSFERENCIA' ? 'border-[#f26522] bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-gray-400'}`}>
                  <input type="radio" name="paymentMethod" value="TRANSFERENCIA" checked={paymentMethod === 'TRANSFERENCIA'} onChange={() => setPaymentMethod('TRANSFERENCIA')} className="h-5 w-5 shrink-0 accent-[#f26522]" />
                  <Landmark aria-hidden="true" className={`h-6 w-6 shrink-0 ${paymentMethod === 'TRANSFERENCIA' ? 'text-[#c34b15]' : 'text-gray-500'}`} />
                  <span className="min-w-0"><span className="block text-base font-semibold text-gray-900">Transferencia o efectivo</span><span className="mt-1 block text-sm leading-relaxed text-gray-600">Registrá tu pedido y coordiná el pago con nosotros.</span></span>
                </label>
              </fieldset>

              {paymentMethod === 'TRANSFERENCIA' && (
                <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4 text-sm text-gray-700 sm:p-5">
                  <h3 className="font-semibold text-gray-900">Datos para la transferencia</h3>
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
                    <dt className="font-medium">CBU</dt><dd className="break-all tabular-nums">0000000000000000000000</dd>
                    <dt className="font-medium">Alias</dt><dd className="break-all">FERRETERIA.TOOLS.OK</dd>
                    <dt className="font-medium">Titular</dt><dd>Herramientas SA (Cuenta Ficticia)</dd>
                  </dl>
                  <p className="border-t border-orange-200 pt-4 leading-relaxed">Enviá el comprobante a nuestro WhatsApp: <span className="whitespace-nowrap font-semibold text-gray-900">+54 9 11 1234-5678</span></p>
                  <p className="text-xs leading-relaxed text-gray-500">Este es un proyecto de presentación. Los datos son ficticios; no realices transferencias reales.</p>
                </div>
              )}
            </div>
          </section>

          <Button type="submit" disabled={loading} className="service-submit w-full gap-3 py-4">
            {loading ? 'Procesando...' : paymentMethod === 'MERCADOPAGO' ? 'Continuar a Mercado Pago' : 'Confirmar pedido'}
            {!loading && <ArrowRight className="h-5 w-5 shrink-0" />}
          </Button>
        </form>

        <aside aria-labelledby="checkout-summary" className="min-w-0 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-[0_6px_24px_-8px_rgba(17,24,39,0.14)] lg:sticky lg:top-28">
          <div className="border-b border-gray-200 bg-[#f0f0ee] px-6 py-5"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">Tu compra</p><h2 id="checkout-summary" className="text-xl font-semibold tracking-tight text-gray-900">Resumen del pedido</h2></div>
          <div className="p-6">
            <ul className="divide-y divide-gray-100">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-start gap-3 py-4 first:pt-0">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {(product.imageUrls?.[0] || product.imageUrl) ? <img src={product.imageUrls?.[0] || product.imageUrl} alt="" className="h-full w-full object-contain p-1.5" /> : <ShoppingBag className="h-5 w-5 text-gray-400" />}
                  </span>
                  <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium leading-snug text-gray-900">{product.name}</p><p className="mt-1 text-xs text-gray-500">Cantidad: {quantity}</p><p className="mt-2 break-words text-sm font-semibold tabular-nums text-gray-900">{price(product.price * quantity)}</p></div>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-gray-200 pt-5"><span className="text-lg font-semibold text-gray-900">Total</span><span className="break-words text-2xl font-semibold tracking-tight tabular-nums text-gray-900">{price(getTotalPrice())}</span></div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">Revisá tu pedido antes de confirmar la compra.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};
