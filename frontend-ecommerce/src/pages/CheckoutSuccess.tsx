import { useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useCartStore } from '../store/cartStore';

export const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderNumber = searchParams.get('orderNumber');
  const method = searchParams.get('method');
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear cart again just in case (e.g. returning from MP)
    clearCart();
  }, [clearCart]);

  if (method === 'TRANSFERENCIA') {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <Clock className="w-20 h-20 text-orange-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Orden Registrada!</h1>
        <p className="text-gray-600 mb-6">Tu orden <span className="font-bold">{orderNumber}</span> está pendiente de pago.</p>
        
        <div className="bg-gray-50 border border-gray-200 p-6 max-w-md mx-auto text-left space-y-4 mb-8">
          <h3 className="font-bold text-lg border-b pb-2">Datos para la transferencia</h3>
          <p className="text-sm text-gray-600">Por favor, transfiere el total a la siguiente cuenta:</p>
          <div>
            <p className="font-medium">CBU:</p>
            <p className="font-mono bg-white p-2 border">0000000000000000000000</p>
          </div>
          <div>
            <p className="font-medium">Alias:</p>
            <p className="font-mono bg-white p-2 border">FERRETERIA.TOOLS.OK</p>
          </div>
          <div>
            <p className="font-medium">Titular:</p>
            <p className="bg-white p-2 border">Herramientas SA (Cuenta Ficticia)</p>
          </div>
          <p className="text-xs text-gray-500 mt-4">Nota: Este es un proyecto de presentación, los datos son ficticios. No realices ninguna transferencia real.</p>
        </div>

        <Link to="/">
          <Button variant="primary">Volver a la tienda</Button>
        </Link>
      </div>
    );
  }

  if (location.pathname.includes('failure')) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Pago Rechazado o Cancelado</h1>
        <p className="text-gray-600 mb-8">Hubo un problema con tu pago. Orden: <span className="font-bold">{orderNumber}</span></p>
        
        <Link to="/checkout">
          <Button variant="primary">Intentar nuevamente</Button>
        </Link>
      </div>
    );
  }

  if (location.pathname.includes('pending')) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <Clock className="w-20 h-20 text-orange-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Pago Pendiente</h1>
        <p className="text-gray-600 mb-8">Tu pago está en revisión. Orden: <span className="font-bold">{orderNumber}</span></p>
        
        <Link to="/">
          <Button variant="primary">Volver a la tienda</Button>
        </Link>
      </div>
    );
  }

  // Si viene de MercadoPago (success)
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 text-center">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Pago Exitoso!</h1>
      <p className="text-gray-600 mb-8">Tu pago fue procesado correctamente. Orden: <span className="font-bold">{orderNumber}</span></p>
      
      <Link to="/">
        <Button variant="primary">Volver a la tienda</Button>
      </Link>
    </div>
  );
};
