import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, ChevronDown, Menu, X } from 'lucide-react';
import useStore from '@/store/useStore';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CustomerLayout() {
  const { user, cart, logout } = useStore();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await axios.get(`${API}/collections`);
      const data = response.data;
      setCollections(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-[#8B1B4A]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-20">
            <button
              data-testid="mobile-menu-toggle"
              className="md:hidden text-[#8B1B4A]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" data-testid="nav-logo" className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/vs-fashion-logo.png"
                  alt="VS Fashion"
                  className="h-14 w-14 object-contain"
                />
              </div>
              <span className="text-2xl font-bold hidden sm:inline" style={{ fontFamily: 'Playfair Display', color: '#8B1B4A' }}>
                VS FASHION
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" data-testid="nav-home" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium">
                Home
              </Link>
              <Link to="/new-arrivals" data-testid="nav-new-arrivals" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium">
                New Arrivals
              </Link>
              <Link to="/best-sellers" data-testid="nav-best-sellers" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium">
                Best Seller
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger data-testid="nav-collections-trigger" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors flex items-center gap-1 font-medium">
                  Collection <ChevronDown size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  {collections.map((coll) => (
                    <DropdownMenuItem key={coll.id} data-testid={`nav-collection-${coll.id}`}>
                      <Link to={`/collection/${coll.id}`} className="w-full hover:text-[#8B1B4A]">
                        {coll.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/about" data-testid="nav-about" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium">
                About Us
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/cart" data-testid="nav-cart-icon" className="relative text-gray-700 hover:text-[#8B1B4A] transition-colors">
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#8B1B4A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger data-testid="nav-user-menu" className="text-gray-700 hover:text-[#8B1B4A] transition-colors">
                    <User size={20} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white">
                    <DropdownMenuItem data-testid="nav-user-dashboard">
                      <Link to="/dashboard" className="w-full hover:text-[#8B1B4A]">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="nav-user-logout" onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-2">
                  <Link to="/register" data-testid="nav-register-btn" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium">
                    Register
                  </Link>
                  <span className="text-gray-400">|</span>
                  <Link to="/login" data-testid="nav-login-btn" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium">
                    Login
                  </Link>
                </div>
              )}

              <Link to="/admin/login" data-testid="nav-admin-login" className="hidden text-xs px-4 py-2 border border-[#8B1B4A] hover:bg-[#8B1B4A] hover:text-white transition-all uppercase tracking-widest">
                Admin
              </Link>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 flex flex-col gap-4">
              <Link to="/" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A]" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/new-arrivals" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A]" onClick={() => setMobileMenuOpen(false)}>
                New Arrivals
              </Link>
              <Link to="/best-sellers" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A]" onClick={() => setMobileMenuOpen(false)}>
                Best Seller
              </Link>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold mb-2 text-[#8B1B4A]">Collections</p>
                {collections.map((coll) => (
                  <Link
                    key={coll.id}
                    to={`/collection/${coll.id}`}
                    className="block pl-4 py-1 text-xs text-gray-600 hover:text-[#8B1B4A]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {coll.name}
                  </Link>
                ))}
              </div>
              <Link to="/about" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A]" onClick={() => setMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link to="/admin/login" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A]" onClick={() => setMobileMenuOpen(false)}>
                Admin Login
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-[#8B1B4A] text-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
              VS Fashion
            </h3>
            <p className="text-sm text-white/80">
              Handcrafted elegance for the modern woman
            </p>
          </div>
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-4 font-semibold">Contact</h4>
            <p className="text-sm text-white/80">Email: vsfashiiiion@gmail.com</p>
            <p className="text-sm text-white/80 mt-2">Phone: +91 84219 68737</p>
          </div>
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-4 font-semibold">Information</h4>
            <div className="flex flex-col gap-2">
              <Link to="/terms" data-testid="footer-terms-link" className="text-sm text-white/80 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/privacy" data-testid="footer-privacy-link" className="text-sm text-white/80 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/refund" data-testid="footer-refund-link" className="text-sm text-white/80 hover:text-white transition-colors">
                Refund Policy
              </Link>
              <Link to="/shipping" data-testid="footer-shipping-link" className="text-sm text-white/80 hover:text-white transition-colors">
                Shipping Policy
              </Link>
              <Link to="/faq" data-testid="footer-faq-link" className="text-sm text-white/80 hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle Admin Link */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8 pt-8 border-t border-white/20 text-center">
          <Link
            to="/admin/login"
            data-testid="footer-admin-link"
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
            style={{ letterSpacing: '0.1em' }}
          >
            · Admin ·
          </Link>
        </div>
      </footer>
    </div>
  );
}
