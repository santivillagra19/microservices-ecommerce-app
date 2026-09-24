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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Panel de Administración</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestiona los productos, el inventario y las órdenes de la tienda.
        </p>
      </div>

      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('products')}
            className={`${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Package className="h-5 w-5" />
            Productos
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <ClipboardList className="h-5 w-5" />
            Inventario
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <ShoppingCart className="h-5 w-5" />
            Órdenes
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'orders' && <OrderManager />}
      </div>
    </div>
  );
};
