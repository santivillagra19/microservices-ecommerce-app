import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { InventoryPage } from './pages/Inventory';
import { Login } from './pages/Login';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Empresas } from './pages/Empresas';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" richColors theme="light" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="checkout/success" element={<CheckoutSuccess />} />
          <Route path="checkout/failure" element={<CheckoutSuccess />} />
          <Route path="checkout/pending" element={<CheckoutSuccess />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="contact" element={<Contact />} />
          <Route path="empresas" element={<Empresas />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
