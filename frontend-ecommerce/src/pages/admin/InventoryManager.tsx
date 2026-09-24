import React, { useEffect, useState } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import type { Inventory, Product } from '../../types';
import { Button } from '../../components/ui/Button';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

export const InventoryManager = () => {
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Inventory>>({});
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [inventoryData, productsData] = await Promise.all([
        inventoryService.getAll(),
        productService.getAll()
      ]);
      
      const map = new Map<string, Product>();
      productsData.forEach(p => map.set(p.id, p));
      setProductsMap(map);
      
      setInventoryList(inventoryData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentItem.id) {
        await inventoryService.update(currentItem.id, currentItem);
      } else {
        await inventoryService.add(currentItem as Omit<Inventory, 'id'>);
      }
      setIsEditing(false);
      setCurrentItem({});
      fetchInventory();
    } catch (error) {
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro de inventario?')) return;
    try {
      await inventoryService.delete(id);
      fetchInventory();
    } catch (error) {
    }
  };

  const openEditor = (item?: Inventory) => {
    setCurrentItem(item || { sku: '', quantity: 0 });
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{currentItem.id ? 'Editar Inventario' : 'Nuevo Registro'}</h3>
          <Button variant="secondary" onClick={() => setIsEditing(false)} icon={X}>Cancelar</Button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SKU (ID del Producto)</label>
            <input
              type="text"
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentItem.sku || ''}
              onChange={(e) => setCurrentItem({ ...currentItem, sku: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input
              type="number"
              required
              min="0"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentItem.quantity || 0}
              onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value, 10) })}
            />
          </div>
          <Button type="submit">Guardar Inventario</Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Gestión de Inventario</h3>
        <Button onClick={() => openEditor()} icon={Plus}>Añadir Registro</Button>
      </div>
      
      {loading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryList.map(item => {
                const product = productsMap.get(item.sku);
                return (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product?.imageUrl || (product?.imageUrls && product.imageUrls[0]) ? (
                        <img 
                          className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200" 
                          src={product.imageUrl || product.imageUrls?.[0]} 
                          alt={product.name} 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-gray-500 text-xs border border-gray-300">
                          No img
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {product ? product.name : 'Producto Desconocido'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{item.quantity} {item.quantity > 0 ? (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          En Stock
                        </span>
                      ) : (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Agotado
                        </span>
                      )}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditor(item)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit2 className="h-4 w-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};