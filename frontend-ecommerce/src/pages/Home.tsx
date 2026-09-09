import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingCart } from 'lucide-react';

export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-primary-50 p-4 rounded-full mb-6">
        <ShoppingCart className="h-12 w-12 text-primary-600" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
        Welcome to MicroShop
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mb-8">
        Your next-generation ecommerce experience powered by microservices. Explore our catalog, check inventory in real-time, and place orders seamlessly.
      </p>
      <div className="flex gap-4">
        <Link to="/products" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 text-base font-medium rounded-sm shadow-sm flex items-center gap-2 transition-colors">
          Browse Products
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/inventory" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 text-base font-medium rounded-sm shadow-sm transition-colors">
          View Inventory
        </Link>
      </div>
    </div>
  );
};
