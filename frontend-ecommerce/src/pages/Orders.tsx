import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, Clock, ChevronRight, MapPin, Calendar, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
  trackingNumber?: string;
  estimatedDelivery?: string;
  items: OrderItem[];
}

const mockOrders: Order[] = [
  {
    id: 'ORD-2023-8945',
    date: '2023-11-15T10:30:00Z',
    total: 345000,
    status: 'SHIPPED',
    trackingNumber: 'OCA-9988776655',
    estimatedDelivery: '2023-11-18',
    items: [
      {
        id: '1',
        name: 'Taladro Percutor Inalámbrico DeWalt 20V',
        quantity: 1,
        price: 280000,
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&q=80'
      },
      {
        id: '2',
        name: 'Set de Puntas Atornillador Bosch 32 piezas',
        quantity: 1,
        price: 65000,
        image: 'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?auto=format&fit=crop&w=300&q=80'
      }
    ]
  },
  {
    id: 'ORD-2023-8210',
    date: '2023-10-02T14:15:00Z',
    total: 185000,
    status: 'DELIVERED',
    trackingNumber: 'OCA-1122334455',
    items: [
      {
        id: '3',
        name: 'Amoladora Angular Makita 850W',
        quantity: 1,
        price: 185000,
        image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=300&q=80'
      }
    ]
  },
  {
    id: 'ORD-2023-9102',
    date: '2023-11-20T09:00:00Z',
    total: 45000,
    status: 'PROCESSING',
    estimatedDelivery: '2023-11-25',
    items: [
      {
        id: '4',
        name: 'Cinta Métrica Stanley 5m',
        quantity: 3,
        price: 15000,
        image: 'https://images.unsplash.com/photo-1584844143431-7e8dbdb8e622?auto=format&fit=crop&w=300&q=80'
      }
    ]
  }
];

const statusConfig = {
  PENDING: { label: 'Pendiente de Pago', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500', barIndex: 0 },
  PROCESSING: { label: 'En Preparación', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500', barIndex: 1 },
  SHIPPED: { label: 'En Camino', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500', barIndex: 2 },
  DELIVERED: { label: 'Entregado', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500', barIndex: 3 }
};

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Simular carga desde API
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 800);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderProgressBar = (status: OrderStatus) => {
    const currentIndex = statusConfig[status].barIndex;
    const steps = [
      { id: 'PENDING', label: 'Compra' },
      { id: 'PROCESSING', label: 'Preparación' },
      { id: 'SHIPPED', label: 'Envío' },
      { id: 'DELIVERED', label: 'Entrega' }
    ];

    return (
      <div className="mt-6 relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: \`\${(currentIndex / (steps.length - 1)) * 100}%\` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#f26522] transition-all duration-500"
          ></div>
        </div>
        <div className="flex justify-between text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">
          {steps.map((step, idx) => (
            <div key={step.id} className={\`text-center w-1/4 \${idx <= currentIndex ? 'text-black' : ''}\`}>
              {step.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#f26522]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-widest sm:text-4xl">
            Mis Pedidos
          </h1>
          <div className="w-16 h-1 bg-[#f26522] mt-4"></div>
        </div>
        <Link to="/products">
          <Button variant="secondary" icon={ShoppingBag}>
            Seguir Comprando
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-bold text-gray-900 uppercase">No tenés pedidos aún</h3>
          <p className="mt-2 text-gray-500">Parece que todavía no realizaste ninguna compra en nuestra tienda.</p>
          <div className="mt-6">
            <Link to="/products">
              <Button variant="primary">Ir a la Tienda</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const StatusIcon = statusConfig[order.status].icon;
            return (
              <div key={order.id} className="bg-white border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cabecera del Pedido */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha del Pedido</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4 text-[#f26522]" /> {formatDate(order.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</p>
                      <p className="font-bold text-gray-900 mt-1">${order.total.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nº de Pedido</p>
                    <p className="font-mono font-bold text-gray-900 mt-1">{order.id}</p>
                  </div>
                </div>

                {/* Cuerpo del Pedido: Estado y Seguimiento */}
                <div className="px-6 py-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusIcon className={\`w-6 h-6 \${statusConfig[order.status].color}\`} />
                    <h3 className="text-lg font-black uppercase tracking-wide text-gray-900">
                      {statusConfig[order.status].label}
                    </h3>
                  </div>
                  
                  {order.trackingNumber && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Código de seguimiento: <span className="font-mono font-bold text-[#f26522]">{order.trackingNumber}</span>
                    </p>
                  )}
                  {order.estimatedDelivery && order.status !== 'DELIVERED' && (
                    <p className="text-sm text-gray-600 mt-1">
                      Llegada estimada: <span className="font-bold">{formatDate(order.estimatedDelivery)}</span>
                    </p>
                  )}

                  {/* Barra de progreso */}
                  {renderProgressBar(order.status)}
                </div>

                {/* Lista de Productos */}
                <div className="px-6 py-4 bg-white">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Artículos en este envío</h4>
                  <ul className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                      <li key={item.id} className="py-4 flex items-center gap-4">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 object-contain rounded border border-gray-200 bg-gray-50 p-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-sm text-gray-500 mt-1">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900">${(item.price * item.quantity).toLocaleString('es-AR')}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Pie del Pedido */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                  <Button variant="secondary" className="text-xs py-2 px-4">
                    Ver Factura
                  </Button>
                  <Button variant="primary" className="text-xs py-2 px-4">
                    Volver a comprar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
