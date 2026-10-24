import { useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CreditCard, Info, Landmark, MessageCircle, Package, XCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { useCartStore } from '../store/cartStore';

export const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const orderNumber = searchParams.get('orderNumber')?.trim();
  const paymentStatus = searchParams.get('collection_status') || searchParams.get('status');
  const failed = pathname.endsWith('/failure') || searchParams.get('failure') === 'true' || ['rejected', 'cancelled'].includes(paymentStatus || '');
  const pending = pathname.endsWith('/pending') || searchParams.get('pending') === 'true' || ['pending', 'in_process'].includes(paymentStatus || '');
  const transfer = !failed && !pending && searchParams.get('method') === 'TRANSFERENCIA' && !!orderNumber;
  const { clearCart } = useCartStore();

  useEffect(() => {
    // El retorno de Mercado Pago no confirma el cobro: conservar el carrito hasta verificarlo en el backend.
    if (transfer) clearCart();
  }, [clearCart, transfer]);

  const content = failed ? {
    Icon: XCircle,
    label: 'Pago no completado',
    title: 'Podés volver a intentarlo',
    description: 'El pago fue rechazado o cancelado. Tu carrito sigue disponible para que revises los datos y elijas cómo pagar.',
    next: 'Volvé al checkout para revisar tus datos o elegir otro método de pago.',
    color: 'border-red-200 bg-red-50 text-red-700',
  } : transfer ? {
    Icon: Landmark,
    label: 'Pendiente de pago',
    title: 'Pedido pendiente de pago',
    description: 'Tu pedido quedó registrado y permanece pendiente hasta que confirmemos la acreditación de la transferencia o el pago en efectivo. Conservá el número de pedido para cualquier consulta.',
    next: 'Si elegiste transferencia, el pedido queda pendiente hasta que se verifique la acreditación. Para pagar en efectivo, contactanos y coordinamos.',
    color: 'border-orange-200 bg-orange-50 text-[#c34b15]',
  } : {
    Icon: Clock,
    label: pending ? 'Pago en revisión' : 'Confirmación pendiente',
    title: pending ? 'Tu pago está en proceso' : 'Esperamos la confirmación del pago',
    description: pending ? 'Todavía no tenemos la confirmación de acreditación. Conservá el número de pedido para consultar su estado.' : 'La vuelta desde Mercado Pago no confirma la acreditación. Revisá el estado de la operación en Mercado Pago antes de intentar pagar otra vez.',
    next: 'Si ya realizaste el pago, evitá repetirlo. Podés consultar la operación en Mercado Pago o contactarnos con tu número de pedido.',
    color: 'border-orange-200 bg-orange-50 text-[#c34b15]',
  };
  const { Icon } = content;

  return (
    <div className="checkout-result mx-auto max-w-5xl pb-5 pt-1 sm:pb-10 sm:pt-2">
      <Link to="/products" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#f26522]"><ArrowLeft className="h-4 w-4" />Volver al catálogo</Link>

      <section aria-labelledby="checkout-result-title" className="overflow-hidden rounded-2xl border border-gray-300 border-t-[3px] border-t-[#f26522] bg-white shadow-[0_6px_24px_-8px_rgba(17,24,39,0.14)]">
        <div className={`border-b border-gray-200 bg-[#f0f0ee] px-5 text-center sm:px-10 ${transfer ? 'py-5 sm:py-6' : 'py-8 sm:py-10'}`}>
          {!transfer && <span className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border ${content.color}`}><Icon aria-hidden="true" className="h-8 w-8" strokeWidth={1.5} /></span>}
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${content.color}`}>{content.label}</span>
          <h1 id="checkout-result-title" className="mx-auto mt-4 max-w-xl text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">{content.title}<span className="text-[#f26522]">.</span></h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600">{content.description}</p>
        </div>

        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
          <div className="min-w-0 space-y-6">
            {transfer && (
              <section aria-labelledby="transfer-details" className="overflow-hidden rounded-2xl border-2 border-[#f26522] bg-orange-50/40 shadow-[0_6px_24px_-8px_rgba(242,101,34,0.25)]">
                <div className="border-b border-orange-200 bg-orange-50 px-5 py-5 sm:px-6"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">Siguiente paso · Completar el pago</p><h2 id="transfer-details" className="flex items-center gap-3 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl"><Landmark aria-hidden="true" className="h-6 w-6 shrink-0 text-[#c34b15]" />Datos para la transferencia</h2></div>
                <div className="space-y-5 p-5 sm:p-6">
                  <dl className="space-y-5">
                    <div className="rounded-xl border border-orange-200 bg-white p-4"><dt className="mb-2 text-sm font-semibold text-gray-600">CBU</dt><dd className="break-all font-mono text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl">0000000000000000000000</dd></div>
                    <div className="rounded-xl border border-orange-200 bg-white p-4"><dt className="mb-2 text-sm font-semibold text-gray-600">Alias</dt><dd className="break-all text-xl font-semibold text-gray-900 sm:text-2xl">FERRETERIA.TOOLS.OK</dd></div>
                    <div><dt className="mb-1 text-sm font-medium text-gray-600">Titular</dt><dd className="text-base font-medium text-gray-900">Herramientas SA (Cuenta Ficticia)</dd></div>
                  </dl>
                  <p className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm leading-relaxed text-orange-900"><Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />Este es un proyecto de presentación. Los datos son ficticios; no realices transferencias reales.</p>
                </div>
              </section>
            )}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600"><Package aria-hidden="true" className="h-4 w-4 text-[#c34b15]" />Número de pedido</div>
              {orderNumber ? <p className="break-all font-mono text-base font-semibold tracking-wide text-gray-900">{orderNumber}</p> : <p className="text-sm leading-relaxed text-gray-600">No recibimos un número de pedido. Si realizaste un pago, contactanos con el comprobante para que podamos identificarlo.</p>}
              <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-4 text-sm text-gray-600">{transfer ? <Landmark aria-hidden="true" className="h-4 w-4 shrink-0" /> : <CreditCard aria-hidden="true" className="h-4 w-4 shrink-0" />}{transfer ? 'Transferencia o efectivo' : 'Mercado Pago'}</div>
            </div>

            <div><h2 className="text-lg font-semibold tracking-tight text-gray-900">Cómo continuar</h2><p className="mt-2 text-sm leading-relaxed text-gray-600">{content.next}</p></div>
          </div>

          <aside aria-label="Ayuda y próximos pasos" className="min-w-0">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <MessageCircle aria-hidden="true" className="mb-3 h-6 w-6 text-[#c34b15]" strokeWidth={1.5} />
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Te acompañamos</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">Si tenés dudas sobre el pago o la entrega, escribinos con tu número de pedido.</p>
              <Link to="/contact" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#c34b15] hover:text-[#9a3b11]">Contactar a la tienda<ArrowRight className="h-4 w-4" /></Link>
            </div>
            <Link to={failed ? '/checkout' : transfer && authService.isAuthenticated() ? '/order' : '/products'} className="mt-5 flex min-h-13 items-center justify-between gap-3 rounded-xl bg-[#f26522] px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#df581b]">{failed ? 'Intentar nuevamente' : transfer && authService.isAuthenticated() ? 'Ver mis órdenes' : 'Seguir comprando'}<ArrowRight className="h-5 w-5 shrink-0" /></Link>
            {failed && <Link to="/cart" className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Revisar mi carrito</Link>}
          </aside>
        </div>
      </section>
    </div>
  );
};
