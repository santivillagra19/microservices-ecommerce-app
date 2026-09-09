import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Home, LogIn } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary-600" />
              <span className="font-semibold text-xl text-gray-900 tracking-tight">MicroShop</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                <Home className="h-4 w-4"/> Home
              </Link>
              <Link to="/products" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                <Package className="h-4 w-4"/> Products
              </Link>
              <Link to="/inventory" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-1">
                <Package className="h-4 w-4"/> Inventory
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 text-sm font-medium rounded-sm shadow-sm flex items-center gap-2 transition-colors">
              <LogIn className="h-4 w-4" />
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
