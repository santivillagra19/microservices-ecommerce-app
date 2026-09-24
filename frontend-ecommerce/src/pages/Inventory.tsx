import { useEffect, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import type { Inventory, Product } from '../types';
import { AlertCircle } from 'lucide-react';

export const InventoryPage = () => {
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventoryData, productsData] = await Promise.all([
          inventoryService.getAll(),
          productService.getAll()
        ]);
        
        const map = new Map<string, Product>();
        productsData.forEach(p => map.set(p.id, p));
        setProductsMap(map);
        
        setInventoryList(inventoryData);
      } catch (err) {
        setError('Error al cargar el inventario. El servicio podría estar inactivo.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm flex items-center gap-3">
        <AlertCircle className="h-5 w-5" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Estado del Inventario</h2>
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad en Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventoryList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron registros de inventario.
                </td>
              </tr>
            ) : (
              inventoryList.map((item) => {
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.quantity > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                          En Stock
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                          Agotado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};