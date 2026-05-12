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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
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

            <div className="flex items-center gap-6 md:gap-4">
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
            <p className="text-sm text-white/80 mt-2">
              Address: Gulab shrushti by Rajendra buttepatil <br />
              3rd floor 301, Kothrud, Pune, Maharashtra 411038
            </p>
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
              <Link to="/contact" data-testid="footer-contact-link" className="text-sm text-white/80 hover:text-white transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle Admin Link */}

      </footer>

      {/* Floating WhatsApp Widget */}
      <a
        href="https://wa.me/918421968737"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
        aria-label="Chat on WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          stroke="currentColor"
          strokeWidth="0"
          fill="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="absolute right-full mr-4 bg-white text-gray-800 px-3 py-1 rounded shadow-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          Chat with us
        </span>
      </a>
    </div>
  );
}
