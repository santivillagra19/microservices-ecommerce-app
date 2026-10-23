import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ProductManager } from './ProductManager';
import { InventoryManager } from './InventoryManager';
import { OrderManager } from './OrderManager';
import { Package, ClipboardList, ShoppingCart } from 'lucide-react';
import { authService } from '../../services/authService';

type Tab = 'products' | 'inventory' | 'orders';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('products');

  if (!authService.hasRole('ADMIN')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
      <div className="admin-page-header mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c34b15]">Espacio interno</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Panel de administración<span className="text-[#f26522]">.</span></h1>
        <p className="mt-2 max-w-2xl text-base text-gray-500">
          Gestiona los productos, el inventario y las órdenes de la tienda.
        </p>
      </div>

      <div className="mb-7">
        <nav className="admin-tabs" aria-label="Secciones de administración">
          <button
            onClick={() => setActiveTab('products')}
            className={`admin-tab ${activeTab === 'products' ? 'admin-tab-active' : ''}`}
            aria-current={activeTab === 'products' ? 'page' : undefined}
          >
            <Package className="h-5 w-5" />
            Productos
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`admin-tab ${activeTab === 'inventory' ? 'admin-tab-active' : ''}`}
            aria-current={activeTab === 'inventory' ? 'page' : undefined}
          >
            <ClipboardList className="h-5 w-5" />
            Inventario
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`admin-tab ${activeTab === 'orders' ? 'admin-tab-active' : ''}`}
            aria-current={activeTab === 'orders' ? 'page' : undefined}
          >
            <ShoppingCart className="h-5 w-5" />
            Órdenes
          </button>
        </nav>
      </div>

      <div className="admin-content">
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'orders' && <OrderManager />}
      </div>
    </div>
  );
};
