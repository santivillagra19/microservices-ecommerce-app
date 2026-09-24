import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';
import { Button } from '../../components/ui/Button';

export const OrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getAll();
      setOrders(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!currentOrder.id) {
        await orderService.create({
          orderLineItemsList: [{
            sku: currentOrder.sku || '',
            price: currentOrder.price || 0,
            quantity: currentOrder.quantity || 1
          }],
          email: currentOrder.email || '',
          paymentMethod: currentOrder.paymentMethod || 'TRANSFERENCIA'
        });
      }
      setIsEditing(false);
      loadOrders();
    } catch (error) {
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await orderService.delete(id.toString());
      loadOrders();
    } catch (error) {
    }
  };

  const openEditor = () => {
    setCurrentOrder({ sku: '', price: 0, quantity: 1 });
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center mb-6">
          <button onClick={() => setIsEditing(false)} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            Nueva Orden
          </h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700">Código SKU</label>
            <input
              type="text"
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentOrder.sku || ''}
              onChange={(e) => setCurrentOrder({ ...currentOrder, sku: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Unitario</label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentOrder.price || ''}
              onChange={(e) => setCurrentOrder({ ...currentOrder, price: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input
              type="number"
              min="1"
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentOrder.quantity || ''}
              onChange={(e) => setCurrentOrder({ ...currentOrder, quantity: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email del Cliente</label>
            <input
              type="email"
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentOrder.email || ''}
              onChange={(e) => setCurrentOrder({ ...currentOrder, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
            <select
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentOrder.paymentMethod || 'TRANSFERENCIA'}
              onChange={(e) => setCurrentOrder({ ...currentOrder, paymentMethod: e.target.value })}
            >
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
              <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Gestión de Órdenes</h2>
        <Button onClick={openEditor} icon={Plus}>
          Nueva Orden
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Cargando órdenes...</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No hay órdenes registradas</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order: any) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{order.id}</div>
                    <div className="text-xs text-gray-400">{order.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderLineItemsList?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.orderStatus}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
