import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import useStore from '@/store/useStore';

import CustomerLayout from '@/layouts/CustomerLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ScrollToTop from '@/components/ScrollToTop';

import Home from '@/pages/customer/Home';
import NewArrivals from '@/pages/customer/NewArrivals';
import BestSellers from '@/pages/customer/BestSellers';
import CollectionPage from '@/pages/customer/CollectionPage';
import ProductDetail from '@/pages/customer/ProductDetail';
import Cart from '@/pages/customer/Cart';
import Checkout from '@/pages/customer/Checkout';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import AboutUs from '@/pages/customer/AboutUs';
import TermsConditions from '@/pages/customer/TermsConditions';
import FAQ from '@/pages/customer/FAQ';
import Register from '@/pages/customer/Register';
import Login from '@/pages/customer/Login';
import PrivacyPolicy from '@/pages/customer/PrivacyPolicy';
import RefundPolicy from '@/pages/customer/RefundPolicy';
import ShippingPolicy from '@/pages/customer/ShippingPolicy';
import ContactUs from '@/pages/customer/ContactUs';

import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import CustomerManagement from '@/pages/admin/CustomerManagement';
import CollectionManagement from '@/pages/admin/CollectionManagement';
import ProductManagement from '@/pages/admin/ProductManagement';
import InventoryManagement from '@/pages/admin/InventoryManagement';
import OrderManagement from '@/pages/admin/OrderManagement';
import ContentManagement from '@/pages/admin/ContentManagement';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { token, isAdmin } = useStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="new-arrivals" element={<NewArrivals />} />
            <Route path="best-sellers" element={<BestSellers />} />
            <Route path="collection/:collectionId" element={<CollectionPage />} />
            <Route path="product/:productId" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
            <Route path="about" element={<AboutUs />} />
            <Route path="terms" element={<TermsConditions />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="refund" element={<RefundPolicy />} />
            <Route path="shipping" element={<ShippingPolicy />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="contact" element={<ContactUs />} />
          </Route>
          
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="collections" element={<CollectionManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="content" element={<ContentManagement />} />
          </Route>
        </Routes>
        <Toaster position="top-center" />
      </BrowserRouter>
    </div>
  );
}

export default App;
