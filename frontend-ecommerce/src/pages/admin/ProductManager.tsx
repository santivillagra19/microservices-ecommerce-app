import React, { useEffect, useState, useRef } from 'react';
import { productService } from '../../services/productService';
import { api } from '../../services/api';
import type { Product } from '../../types';
import { Button } from '../../components/ui/Button';
import { Edit2, Trash2, Plus, X, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

export const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProduct.id) {
        await productService.update(currentProduct.id, currentProduct);
      } else {
        await productService.create(currentProduct as Omit<Product, 'id'>);
      }
      setIsEditing(false);
      setCurrentProduct({});
      fetchProducts();
    } catch (error) {
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      await productService.delete(id);
      fetchProducts();
    } catch (error) {
    }
  };

  const openEditor = (product?: Product) => {
    let initialImageUrls = product?.imageUrls || [];
    if (initialImageUrls.length === 0 && product?.imageUrl) {
      initialImageUrls = [product.imageUrl];
    }
    setCurrentProduct(product ? { ...product, imageUrls: initialImageUrls } : { name: '', description: '', price: 0, imageUrls: [] });
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{currentProduct.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <Button variant="secondary" onClick={() => setIsEditing(false)} icon={X}>Cancelar</Button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentProduct.name || ''}
              onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentProduct.description || ''}
              onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentProduct.price || 0}
              onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentProduct.category || ''}
              onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Marca (Brand)</label>
            <input
              type="text"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={currentProduct.brand || ''}
              onChange={(e) => setCurrentProduct({ ...currentProduct, brand: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes del Producto</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                if (files.length === 0) return;
                
                const uploadPromises = files.map(async (file) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await api.post('/product/image', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    return res.data.url;
                  } catch (err) {
                    return null;
                  }
                });
                
                const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);
                setCurrentProduct(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploadedUrls] }));
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Arrastra y suelta imágenes aquí, o haz clic para seleccionar</p>
              <input 
                id="file-upload" 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  if (!e.target.files) return;
                  const files = Array.from(e.target.files);
                  const uploadPromises = files.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await api.post('/product/image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      return res.data.url;
                    } catch (err) {
                      return null;
                    }
                  });
                  const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);
                  setCurrentProduct(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploadedUrls] }));
                }} 
              />
            </div>
            
            {/* Miniaturas */}
            {currentProduct.imageUrls && currentProduct.imageUrls.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {currentProduct.imageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    
                    {/* Botón Eliminar */}
                    <button 
                      type="button"
                      onClick={() => setCurrentProduct(prev => ({
                        ...prev, 
                        imageUrls: prev.imageUrls?.filter((_, i) => i !== idx)
                      }))}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Botones de Reordenar */}
                    <div className="absolute bottom-1 left-0 w-full flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentProduct(prev => {
                              const newUrls = [...(prev.imageUrls || [])];
                              const temp = newUrls[idx - 1];
                              newUrls[idx - 1] = newUrls[idx];
                              newUrls[idx] = temp;
                              return { ...prev, imageUrls: newUrls };
                            });
                          }}
                          className="bg-gray-800/70 text-white p-1 rounded hover:bg-gray-800"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      )}
                      {idx < (currentProduct.imageUrls?.length || 0) - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentProduct(prev => {
                              const newUrls = [...(prev.imageUrls || [])];
                              const temp = newUrls[idx + 1];
                              newUrls[idx + 1] = newUrls[idx];
                              newUrls[idx] = temp;
                              return { ...prev, imageUrls: newUrls };
                            });
                          }}
                          className="bg-gray-800/70 text-white p-1 rounded hover:bg-gray-800"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit">Guardar Producto</Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Gestión de Productos</h3>
        <Button onClick={() => openEditor()} icon={Plus}>Añadir Producto</Button>
      </div>
      
      {loading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditor(product)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit2 className="h-4 w-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
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










