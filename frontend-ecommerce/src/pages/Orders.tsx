import { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import type { Order as ApiOrder, Product } from '../types';

type OrderStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface OrderItemView {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderView {
  id: number;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  items: OrderItemView[];
}

const statusConfig = {
  PROCESSING: { label: 'En preparación', icon: Package, color: 'text-blue-600', barIndex: 1 },
  SHIPPED: { label: 'En camino', icon: Truck, color: 'text-purple-600', barIndex: 2 },
  DELIVERED: { label: 'Entregado', icon: CheckCircle2, color: 'text-green-600', barIndex: 3 },
  CANCELLED: { label: 'Cancelado', icon: XCircle, color: 'text-red-600', barIndex: 0 },
} satisfies Record<OrderStatus, { label: string; icon: typeof Package; color: string; barIndex: number }>;

const money = (value: number) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
}).format(value);

const statusFromApi = (status: string): OrderStatus => {
  switch (String(status || '').toUpperCase()) {
    case 'SHIPPED': return 'SHIPPED';
    case 'DELIVERED': return 'DELIVERED';
    case 'CANCELLED': return 'CANCELLED';
    // PLACED and CONFIRMED are the backend's active order states.
    default: return 'PROCESSING';
  }
};

const toViewOrder = (order: ApiOrder, productsBySku: Record<string, Product>): OrderView => {
  const items = order.orderLineItemsList ?? [];
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: statusFromApi(order.orderStatus),
    total: items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    items: items.map(item => {
      const product = productsBySku[item.sku];
      return {
        id: String(item.id),
        name: product?.name || `Producto ${item.sku}`,
        quantity: item.quantity,
        price: Number(item.price),
        image: product?.imageUrls?.[0] || product?.imageUrl,
      };
    }),
  };
};

export const Orders = () => {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const [apiOrders, products] = await Promise.all([
          orderService.getAll(),
          productService.getAll().catch(() => []),
        ]);
        if (!active) return;
        const productsBySku = Object.fromEntries(products.map(product => [product.id, product]));
        setOrders(apiOrders.map(order => toViewOrder(order, productsBySku)));
      } catch {
        if (active) setError('No pudimos cargar tus pedidos. Revisá tu sesión e intentá nuevamente.');
      } finally {
        if (active) setLoading(false);
      }
    };

    window.scrollTo(0, 0);
    loadOrders();
    return () => { active = false; };
  }, [reloadKey]);

  const renderProgressBar = (status: OrderStatus) => {
    const currentIndex = statusConfig[status].barIndex;
    const steps = [
      { id: 'PLACED', label: 'Compra' },
      { id: 'PROCESSING', label: 'Preparación' },
      { id: 'SHIPPED', label: 'Envío' },
      { id: 'DELIVERED', label: 'Entrega' },
    ];

    if (status === 'CANCELLED') {
      return <p className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"><XCircle className="h-4 w-4" />Este pedido fue cancelado.</p>;
    }

    return (
      <div className="relative mt-6">
        <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-gray-200"><div style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }} className="bg-[#f26522] transition-all duration-500" /></div>
        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 sm:text-sm">{steps.map((step, index) => <div key={step.id} className={`w-1/4 text-center ${index <= currentIndex ? 'text-gray-900' : ''}`}>{step.label}</div>)}</div>
      </div>
    );
  };

  if (loading) {
    return <div role="status" className="flex min-h-80 items-center justify-center"><span aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#f26522] motion-reduce:animate-none" /><span className="sr-only">Cargando pedidos...</span></div>;
  }

  return (
    <div className="orders-page mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">Tu actividad</p><h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Mis pedidos<span className="text-[#f26522]">.</span></h1><p className="mt-2 text-base text-gray-500">Consultá el estado de tus compras y su progreso de entrega.</p></div><Link to="/products"><Button variant="primary" icon={ShoppingBag} className="orders-action orders-action-primary">Seguir comprando</Button></Link></div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"><XCircle className="mx-auto h-10 w-10 text-red-600" strokeWidth={1.5} /><h2 className="mt-4 text-lg font-semibold text-gray-900">No pudimos cargar tus pedidos</h2><p className="mt-2 text-sm text-gray-600">{error}</p><button type="button" onClick={() => setReloadKey(key => key + 1)} className="mt-6 min-h-11 rounded-xl bg-[#f26522] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#df581b] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f26522]">Intentar nuevamente</button></div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center sm:py-20"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f26522]/20 bg-orange-50"><Package className="h-8 w-8 text-[#f26522]" strokeWidth={1.5} /></span><h2 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">Todavía no tenés pedidos</h2><p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-gray-500">Cuando hagas una compra, vas a poder consultar acá el detalle y el progreso de la entrega.</p><Link to="/products" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f26522] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#df581b]">Ir al catálogo<ShoppingBag className="h-4 w-4" /></Link></div>
      ) : (
        <div className="space-y-6">{orders.map(order => { const status = statusConfig[order.status]; const StatusIcon = status.icon; return (
          <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_6px_24px_-8px_rgba(17,24,39,0.14)]">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-[#f0f0ee] px-5 py-5 sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Número de pedido</p><p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</p></div><div className="text-right"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Total</p><p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{money(order.total)}</p></div></header>
            <div className="border-b border-gray-100 px-5 py-6 sm:px-7"><div className="flex items-center gap-3"><StatusIcon className={`h-6 w-6 ${status.color}`} strokeWidth={1.75} /><h2 className="text-lg font-semibold text-gray-900">{status.label}</h2></div>{renderProgressBar(order.status)}</div>
            <div className="px-5 py-5 sm:px-7"><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Artículos del pedido</h3><ul className="divide-y divide-gray-100">{order.items.map(item => <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">{item.image ? <img src={item.image} alt="" className="h-full w-full object-contain p-2" /> : <Package className="h-6 w-6 text-gray-400" />}</span><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-gray-900">{item.name}</p><p className="mt-1 text-sm text-gray-500">Cantidad: {item.quantity}</p></div><p className="break-words text-right text-sm font-semibold tabular-nums text-gray-900">{money(item.price * item.quantity)}</p></li>)}</ul></div>
            <footer className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-7"><Link to="/products" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#f26522]/50 hover:bg-orange-50 hover:text-[#c34b15] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f26522]">Volver a comprar<ShoppingBag className="h-4 w-4" /></Link></footer>
          </article>
        ); })}</div>
      )}
    </div>
  );
};
