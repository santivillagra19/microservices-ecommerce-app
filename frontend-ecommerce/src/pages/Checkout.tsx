import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/Button';
import { orderService } from '../services/orderService';
import { toast } from 'sonner';
import { CreditCard, Landmark } from 'lucide-react';

export const Checkout = () => {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MERCADOPAGO' | 'TRANSFERENCIA'>('MERCADOPAGO');
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderLineItemsList = items.map(item => ({
        sku: item.product.id.toString(), // Handle depending on data structure
        price: item.product.price,
        quantity: item.quantity
      }));

      const request = {
        email,
        nombre,
        telefono,
        direccionEntrega,
        paymentMethod,
        orderLineItemsList
      };

      const response = await orderService.create(request);

      if (paymentMethod === 'MERCADOPAGO' && response.paymentUrl) {
        // Redirect to MP
        window.location.href = response.paymentUrl;
      } else {
        // Transferencia, redirect to success locally
        clearCart();
        navigate(`/checkout/success?orderNumber=${response.orderNumber}&method=TRANSFERENCIA`);
      }
    } catch (error) {
      toast.error('Ocurrió un error al procesar el pago. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleCheckout} className="flex-1 space-y-6">
          <div className="bg-white p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tus Datos</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input type="text" id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 block w-full rounded-none border-gray-300 border p-2 focus:border-[#f26522] focus:ring-[#f26522]" placeholder="Juan Pérez" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-none border-gray-300 border p-2 focus:border-[#f26522] focus:ring-[#f26522]" placeholder="tu@email.com" />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input type="tel" id="telefono" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className="mt-1 block w-full rounded-none border-gray-300 border p-2 focus:border-[#f26522] focus:ring-[#f26522]" placeholder="+54 9 11 1234-5678" />
              </div>
              <div>
                <label htmlFor="direccionEntrega" className="block text-sm font-medium text-gray-700">Dirección de Entrega</label>
                <input type="text" id="direccionEntrega" required value={direccionEntrega} onChange={(e) => setDireccionEntrega(e.target.value)} className="mt-1 block w-full rounded-none border-gray-300 border p-2 focus:border-[#f26522] focus:ring-[#f26522]" placeholder="Calle Falsa 123, CABA" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Método de Pago</h2>
            
            <label className={`block border p-4 cursor-pointer transition-colors ${paymentMethod === 'MERCADOPAGO' ? 'border-[#f26522] bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="MERCADOPAGO" 
                  checked={paymentMethod === 'MERCADOPAGO'}
                  onChange={() => setPaymentMethod('MERCADOPAGO')}
                  className="h-4 w-4 text-[#f26522] focus:ring-[#f26522]" 
                />
                <CreditCard className="ml-3 w-6 h-6 text-gray-400" />
                <span className="ml-3 font-medium text-gray-900">Tarjeta de Crédito / Débito (MercadoPago)</span>
              </div>
            </label>

            <label className={`block border p-4 cursor-pointer transition-colors ${paymentMethod === 'TRANSFERENCIA' ? 'border-[#f26522] bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-center">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="TRANSFERENCIA" 
                  checked={paymentMethod === 'TRANSFERENCIA'}
                  onChange={() => setPaymentMethod('TRANSFERENCIA')}
                  className="h-4 w-4 text-[#f26522] focus:ring-[#f26522]" 
                />
                <Landmark className="ml-3 w-6 h-6 text-gray-400" />
                <span className="ml-3 font-medium text-gray-900">Transferencia o Efectivo</span>
              </div>
            </label>
            
            {paymentMethod === 'TRANSFERENCIA' && (
              <div className="mt-4 bg-orange-50 p-4 border border-orange-200 rounded text-sm text-gray-800 space-y-3">
                <p className="font-bold border-b border-orange-200 pb-2">Datos para la transferencia:</p>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">CBU:</span><span className="col-span-2 font-mono">0000000000000000000000</span>
                  <span className="font-semibold">Alias:</span><span className="col-span-2 font-mono">FERRETERIA.TOOLS.OK</span>
                  <span className="font-semibold">Titular:</span><span className="col-span-2">Herramientas SA (Cuenta Ficticia)</span>
                </div>
                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-center">
                  <p className="font-bold text-green-900">¡Importante!</p>
                  <p className="text-green-800">Una vez hecha la transferencia, envía el comprobante a nuestro WhatsApp:</p>
                  <p className="font-bold text-green-900 text-lg mt-1">+54 9 11 1234-5678</p>
                </div>
                <p className="text-xs text-gray-500 italic text-center mt-2">Nota: Este es un proyecto de presentación, los datos son ficticios.</p>
              </div>
            )}
          </div>

          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || items.length === 0}
            className="w-full py-4 text-lg font-bold"
          >
            {loading ? 'Procesando...' : 'Pagar'}
          </Button>
        </form>

        <div className="w-full lg:w-96">
          <div className="bg-white p-6 border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen</h2>
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1 flex-1 mr-4">{item.quantity}x {item.product.name}</span>
                  <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-black text-[#f26522]">${getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
