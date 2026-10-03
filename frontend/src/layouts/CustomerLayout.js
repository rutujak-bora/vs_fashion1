import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, ChevronDown, Menu, X, Search, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '@/store/useStore';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const ANNOUNCEMENT_MESSAGES = [
  "🚚 All Maharashtra shipping at ₹80 only",
  "✨ Festive Season New Offers — Explore New Collections",
  "🎉 Use Code WELCOME10 for 10% OFF on your order",
  "🎁 Flat ₹200 OFF on orders above ₹999 with code FESTIVE200",
  "🌸 Premium Handcrafted Kurtis — New Styles Added Daily"
];

export default function CustomerLayout() {
  const { user, cart, wishlist, logout } = useStore();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Announcement Bar State
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  
  // Live Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchCollections();
    fetchAllProducts();

    // Auto-cycle announcements
    const announceTimer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 4000);

    // Close search dropdown on click outside
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(announceTimer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  const fetchAllProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setAllProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading products for live search:', err);
    }
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 0) {
      const filtered = allProducts.filter(p => 
        p.name?.toLowerCase().includes(q.toLowerCase()) ||
        p.color?.toLowerCase().includes(q.toLowerCase()) ||
        p.description?.toLowerCase().includes(q.toLowerCase()) ||
        p.collection_name?.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
      setSearchOpen(true);
    } else {
      setSearchResults([]);
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-[#8B1B4A]/20 shadow-sm">
        {/* Top Announcement Bar */}
        <div className="bg-[#8B1B4A] text-white text-[11px] sm:text-xs tracking-[0.12em] uppercase py-2 px-3 sm:px-6 relative overflow-hidden select-none border-b border-[#73153C]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setAnnouncementIndex((prev) => (prev - 1 + ANNOUNCEMENT_MESSAGES.length) % ANNOUNCEMENT_MESSAGES.length)}
              className="text-white/60 hover:text-white transition-colors p-1 flex-shrink-0"
              aria-label="Previous announcement"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex-1 text-center h-5 relative overflow-hidden mx-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={announcementIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center font-medium"
                >
                  <span className="truncate">{ANNOUNCEMENT_MESSAGES[announcementIndex]}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={() => setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length)}
              className="text-white/60 hover:text-white transition-colors p-1 flex-shrink-0"
              aria-label="Next announcement"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          {/* Top Row: Left (Search / Mobile Toggle), Center (Logo), Right (Utility Icons) */}
          <div className="flex items-center justify-between h-20 md:h-22">
            {/* Left Column: Mobile Menu Toggle & Desktop Live Search */}
            <div className="flex-1 basis-0 flex items-center justify-start gap-3">
              <button
                data-testid="mobile-menu-toggle"
                className="md:hidden text-[#8B1B4A] p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Desktop Header Live Search */}
              <div className="relative hidden md:block" ref={searchRef}>
                <div className="flex items-center bg-gray-100 rounded-full px-3.5 py-2 border border-transparent focus-within:border-[#8B1B4A]/50 focus-within:bg-white transition-all shadow-inner">
                  <Search size={15} className="text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery.trim().length > 0 && setSearchOpen(true)}
                    placeholder="Search kurtis, colors..."
                    className="bg-transparent text-xs w-36 lg:w-48 focus:outline-none text-gray-700 placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="text-gray-400 hover:text-gray-600 ml-1">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Live Search Dropdown */}
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-72 md:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-2">
                    <p className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400 border-b border-gray-50">
                      Search Results ({searchResults.length})
                    </p>
                    {searchResults.map((prod) => (
                      <Link
                        key={prod.id}
                        to={`/product/${prod.id}`}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <img
                          src={prod.images?.[0]
                            ? (prod.images[0].startsWith('http') ? prod.images[0] : `${BACKEND_URL}${prod.images[0]}`)
                            : 'https://via.placeholder.com/60'}
                          alt={prod.name}
                          className="w-10 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-gray-800 truncate" style={{ fontFamily: 'Playfair Display' }}>
                            {prod.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate">{prod.collection_name}</p>
                          <span className="text-xs font-bold text-[#8B1B4A]">
                            ₹{(prod.discount_price || prod.price).toFixed(2)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center Column: Logo Centered Above Menu */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5 sm:gap-3 group">
                <div className="relative">
                  <img
                    src="/vs-fashion-logo.png"
                    alt="VS Fashion"
                    className="h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.12em]" style={{ fontFamily: 'Playfair Display', color: '#8B1B4A' }}>
                  VS FASHION
                </span>
              </Link>
            </div>

            {/* Right Column: User Actions (Wishlist, Cart, Profile/Auth) */}
            <div className="flex-1 basis-0 flex items-center justify-end gap-3.5 sm:gap-4 md:gap-6">
              {/* Wishlist Icon */}
              <Link to="/wishlist" data-testid="nav-wishlist-icon" className="relative text-gray-700 hover:text-[#8B1B4A] transition-colors p-1" title="Wishlist">
                <Heart size={20} />
                {wishlist && wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#8B1B4A] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link to="/cart" data-testid="nav-cart-icon" className="relative text-gray-700 hover:text-[#8B1B4A] transition-colors p-1" title="Cart">
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#8B1B4A] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {cart.length}
                  </span>
                )}
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger data-testid="nav-user-menu" className="text-gray-700 hover:text-[#8B1B4A] transition-colors p-1">
                    <User size={20} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white shadow-lg border border-gray-100">
                    <DropdownMenuItem data-testid="nav-user-dashboard">
                      <Link to="/dashboard" className="w-full hover:text-[#8B1B4A]">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="nav-user-logout" onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link to="/register" data-testid="nav-register-btn" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium">
                    Register
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link to="/login" data-testid="nav-login-btn" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium">
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: All Menu Items Center-Aligned on Center Line */}
          <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-12 py-3 border-t border-gray-100">
            <Link to="/" data-testid="nav-home" className="text-xs uppercase tracking-[0.2em] text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium relative group py-1">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#8B1B4A] transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link to="/new-arrivals" data-testid="nav-new-arrivals" className="text-xs uppercase tracking-[0.2em] text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium relative group py-1">
              New Arrivals
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#8B1B4A] transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link to="/best-sellers" data-testid="nav-best-sellers" className="text-xs uppercase tracking-[0.2em] text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium relative group py-1">
              Best Seller
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#8B1B4A] transition-all duration-300 group-hover:w-full" />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger data-testid="nav-collections-trigger" className="text-xs uppercase tracking-[0.2em] text-gray-700 hover:text-[#8B1B4A] transition-colors flex items-center gap-1 font-medium relative group py-1">
                Collection <ChevronDown size={14} className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#8B1B4A] transition-all duration-300 group-hover:w-full" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white shadow-xl border border-gray-100 p-2 min-w-[200px]">
                {collections.map((coll) => (
                  <DropdownMenuItem key={coll.id} data-testid={`nav-collection-${coll.id}`} className="rounded-md hover:bg-pink-50">
                    <Link to={`/collection/${coll.id}`} className="w-full hover:text-[#8B1B4A] py-1 text-xs tracking-wider">
                      {coll.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/services#customize-order" data-testid="nav-customize-order" className="text-xs uppercase tracking-[0.2em] text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium relative group py-1">
              Customize- Order
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#8B1B4A] transition-all duration-300 group-hover:w-full" />
            </Link>

            <Link to="/services" data-testid="nav-services" className="text-xs uppercase tracking-[0.2em] text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium relative group py-1">
              Our Services
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#8B1B4A] transition-all duration-300 group-hover:w-full" />
            </Link>

            <Link to="/about" data-testid="nav-about" className="text-xs uppercase tracking-[0.2em] text-gray-700 hover:text-[#8B1B4A] transition-colors font-medium relative group py-1">
              About Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#8B1B4A] transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

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
              <Link to="/services#customize-order" className="text-xs uppercase tracking-widest font-semibold text-[#8B1B4A]" onClick={() => setMobileMenuOpen(false)}>
                Customize- Order
              </Link>
              <Link to="/services" className="text-xs uppercase tracking-widest text-gray-700 hover:text-[#8B1B4A]" onClick={() => setMobileMenuOpen(false)}>
                Our Services
              </Link>
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
              <Link to="/services#customize-order" data-testid="footer-customize-link" className="text-sm text-white/80 hover:text-white transition-colors">
                Customize- Order
              </Link>
              <Link to="/services" data-testid="footer-services-link" className="text-sm text-white/80 hover:text-white transition-colors">
                Our Services
              </Link>
              <Link to="/contact" data-testid="footer-contact-link" className="text-sm text-white/80 hover:text-white transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        {/* Popular Searches SEO Keywords Section */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-white/10 text-xs text-white/70">
          <p className="font-semibold text-white/90 mb-2 uppercase tracking-wider text-[11px]">
            Popular Searches & Categories:
          </p>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 leading-relaxed">
            <Link to="/services#customize-order" className="hover:text-white transition-colors">Custom Cloth Order</Link>
            <span className="text-white/30">•</span>
            <Link to="/services#navratri-rent" className="hover:text-white transition-colors">Navratri Cloth on Rent Pune</Link>
            <span className="text-white/30">•</span>
            <Link to="/services#bulk-customize" className="hover:text-white transition-colors">Bulk Customize Orders</Link>
            <span className="text-white/30">•</span>
            <Link to="/services#wedding-stitch" className="hover:text-white transition-colors">Wedding Cloth Stitch Order</Link>
            <span className="text-white/30">•</span>
            <Link to="/new-arrivals" className="hover:text-white transition-colors">Women Kurtis Online</Link>
            <span className="text-white/30">•</span>
            <Link to="/best-sellers" className="hover:text-white transition-colors">Designer Cotton Kurtis</Link>
            <span className="text-white/30">•</span>
            <Link to="/collection/ec09ce33-fa65-4f24-8501-9c1cc5da0d33" className="hover:text-white transition-colors">Halter Neck Kurti</Link>
            <span className="text-white/30">•</span>
            <Link to="/collection/8c3d0666-9bbe-4b6c-9de4-c8bb581c5643" className="hover:text-white transition-colors">Bell Sleeves Kurti</Link>
            <span className="text-white/30">•</span>
            <Link to="/collection/84175d7f-ee45-4a70-b006-98ce9f281fab" className="hover:text-white transition-colors">Straight Cut Kurti with Pants</Link>
            <span className="text-white/30">•</span>
            <Link to="/services#navratri-rent" className="hover:text-white transition-colors">Chaniya Choli on Rent in Pune</Link>
            <span className="text-white/30">•</span>
            <Link to="/services#customize-order" className="hover:text-white transition-colors">Custom Kurti Stitching Pune</Link>
            <span className="text-white/30">•</span>
            <Link to="/services#wedding-stitch" className="hover:text-white transition-colors">Bridal Lehenga & Blouse Stitching</Link>
            <span className="text-white/30">•</span>
            <Link to="/services#bulk-customize" className="hover:text-white transition-colors">Wholesale Kurtis Manufacturer Pune</Link>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-white/50 text-[11px] gap-2">
            <p>© {new Date().getFullYear()} VS Fashion. All rights reserved. Handcrafted Indian Ethnic Wear.</p>
            <p>Pune, Maharashtra, India</p>
          </div>
        </div>

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
