import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-8">Parece que aún no has agregado herramientas a tu carrito.</p>
        <Link to="/products">
          <Button variant="primary" icon={ArrowLeft}>
            Volver a la tienda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu Carrito</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Lista de productos */}
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex flex-col sm:flex-row bg-white p-4 rounded-none border border-gray-100 shadow-sm gap-4 items-center relative">
              <Link to={`/products/${item.product.id}`} className="w-24 h-24 bg-gray-50 rounded-none overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                {(item.product.imageUrls?.[0] || item.product.imageUrl) ? (
                  <img src={item.product.imageUrls?.[0] || item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain p-2 hover:scale-110 transition-transform" />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                )}
              </Link>
              
              <div className="flex-1 text-center sm:text-left w-full">
                <Link to={`/products/${item.product.id}`}>
                  <h3 className="font-bold text-lg text-gray-900 hover:text-[#f26522] transition-colors line-clamp-1">{item.product.name}</h3>
                </Link>
                <p className="text-gray-500 text-sm mb-3">${item.product.price.toFixed(2)} c/u</p>
                <div className="flex items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center border border-gray-200 rounded-none overflow-hidden">
                    <button 
                      onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold text-gray-900">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.product.id)}
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-colors p-2 rounded-none"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="text-xl font-black text-gray-900 sm:w-32 text-center sm:text-right mt-2 sm:mt-0">
                ${(item.product.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
          
          <div className="flex justify-start pt-4">
            <button 
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-2 transition-colors px-4 py-2 rounded-none hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Vaciar carrito completo
            </button>
          </div>
        </div>

        {/* Resumen de la compra */}
        <div className="w-full lg:w-96">
          <div className="bg-white p-6 rounded-none border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del pedido</h2>
            
            <div className="space-y-4 text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} productos)</span>
                <span className="font-semibold text-gray-900">${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-sm">Gratis</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-[#f26522]">${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>

            <Link to="/checkout" className="w-full">
              <Button 
                variant="primary" 
                className="w-full py-4 text-lg font-bold shadow-md hover:shadow-lg transition-all rounded-none flex justify-center items-center"
              >
                Proceder al pago
              </Button>
            </Link>
            <div className="mt-4 text-center">
              <Link to="/products" className="text-gray-500 hover:text-[#f26522] text-sm font-medium transition-colors">
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


