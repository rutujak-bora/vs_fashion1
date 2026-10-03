import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ArrowRight, Scissors, Sparkles, Layers, HeartHandshake, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [homeCollections, setHomeCollections] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "VS Fashion | Buy Designer Women's Kurtis, Ethnic Wear & Custom Stitching Online";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bannersRes, productsRes, collectionsRes] = await Promise.all([
        axios.get(`${API}/banners`),
        axios.get(`${API}/products?is_trending=true`),
        axios.get(`${API}/collections?show_on_home=true`)
      ]);

      const banners = Array.isArray(bannersRes.data) ? bannersRes.data : bannersRes.data.data || [];
      if (banners.length > 0) {
        setBanners(banners);
      } else {
        // Fallback to local images if API has no banners
        setBanners([
          {
            id: 'local-1',
            image_url: '/images/Carousel/Carousel img1.jpeg',
            title: 'Welcome to VS Fashion',
            content: 'Discover our latest collections and traditional wear.'
          },
          {
            id: 'local-2',
            image_url: '/images/Carousel/Carousel img2.jpeg',
            title: 'Exquisite Silk Sarees',
            content: 'Elegance for every occasion.'
          },
          {
            id: 'local-3',
            image_url: '/images/Carousel/Carousel img3.jpeg',
            title: 'VS Fashion Exclusive',
            content: 'Meet VS Fashion Exclusive Collection'
          }
        ]);
      }

      const products = productsRes.data;
      const collections = collectionsRes.data;
      setTrendingProducts(Array.isArray(products) ? products : products.data || []);
      setHomeCollections(Array.isArray(collections) ? collections.slice(0, 8) : (collections.data || []).slice(0, 8));
    } catch (error) {
      console.error('Error fetching data:', error);
      // Even on error, provide fallbacks
      setBanners([
        {
          id: 'local-1',
          image_url: '/images/Carousel/Carousel img1.jpeg',
          title: 'Welcome to VS Fashion',
          content: 'Discover our latest collections and traditional wear.'
        },
        {
          id: 'local-2',
          image_url: '/images/Carousel/Carousel img2.jpeg',
          title: 'Exquisite Silk Sarees',
          content: 'Elegance for every occasion.'
        },
        {
          id: 'local-3',
          image_url: '/images/Carousel/Carousel img3.jpeg',
          title: 'Modern Traditional Style',
          content: 'Where heritage meets fashion.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(nextBanner, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div>
      <section className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden" data-testid="hero-carousel">
        {banners.length > 0 ? (
          <>
            <div className="relative h-full">
              <img
                src={banners[currentBanner]?.image_url?.startsWith('http')
                  ? banners[currentBanner]?.image_url
                  : `${BACKEND_URL}${banners[currentBanner]?.image_url}`}
                alt={banners[currentBanner]?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center text-white px-6">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 px-2"
                    style={{ fontFamily: 'Playfair Display' }}
                  >
                    {banners[currentBanner]?.title}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-lg mb-8 max-w-2xl mx-auto"
                  >
                    {banners[currentBanner]?.content}
                  </motion.p>
                  <Button
                    data-testid="hero-shop-now-btn"
                    asChild
                    className="bg-[#8B1B4A] hover:bg-[#A4305E] text-white uppercase tracking-widest text-xs py-6 px-8 shadow-lg"
                  >
                    <Link to="/new-arrivals">Shop Now</Link>
                  </Button>
                </div>
              </div>
            </div>

            <button
              data-testid="hero-prev-btn"
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              data-testid="hero-next-btn"
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-all"
            >
              <ChevronRight size={24} />
            </button>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  data-testid={`hero-indicator-${index}`}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentBanner ? 'bg-white w-8' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="h-full bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">No banners available</p>
          </div>
        )}
      </section>

      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto pattern-bg" data-testid="trending-section">
        <div className="traditional-divider mb-12">
          <span>✦</span>
        </div>

        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl traditional-text" style={{ fontFamily: 'Playfair Display', color: '#4A2836' }}>
            Trending Now
          </h2>
          <Link
            to="/new-arrivals"
            data-testid="view-all-trending-link"
            className="text-xs uppercase tracking-widest hover:text-[#C4969C] transition-colors"
          >
            View All
          </Link>
        </div>

        {trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {trendingProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No trending products available</p>
        )}
      </section>

      {/* Shop By Style Section (Home Collections) */}
      <section className="py-24 bg-white" data-testid="collections-section">
        <div className="w-full">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl tracking-[0.2em] uppercase" style={{ color: '#4A2836' }}>
              SHOP BY STYLE
            </h2>
          </div>

          {homeCollections.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
              {homeCollections.map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collection/${collection.id}`}
                  className="group relative overflow-hidden aspect-[4/5] md:aspect-[3/4] block"
                >
                  {(() => {
                    const img = collection.home_image_url || collection.image_url;
                    if (!img) {
                      return (
                        <div className="w-full h-full bg-[#8B1B4A]/5 flex items-center justify-center border border-[#8B1B4A]/10 group-hover:scale-105 transition-transform duration-700">
                          <span className="text-[#8B1B4A]/25 font-bold text-6xl select-none" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {collection.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      );
                    }
                    const srcUrl = img.startsWith('http') ? img : `${BACKEND_URL}${img}`;
                    return (
                      <img
                        src={srcUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = "absolute inset-0 bg-[#8B1B4A]/5 flex items-center justify-center border border-[#8B1B4A]/10";
                          fallback.innerHTML = `<span class="text-[#8B1B4A]/25 font-bold text-6xl select-none" style="font-family: Playfair Display, serif">${collection.name.charAt(0).toUpperCase()}</span>`;
                          e.target.parentNode.insertBefore(fallback, e.target);
                        }}
                      />
                    );
                  })()}
                  {/* Text overlay */}
                  <div className="absolute inset-x-0 top-0 pt-10 md:pt-14 flex flex-col items-center z-10">
                    <h3
                      className="text-xl md:text-3xl uppercase tracking-[0.25em] text-white text-center leading-tight drop-shadow-md"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {collection.name.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </h3>
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none z-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>No collections featured on home page yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Our Bespoke Services Showcase */}
      <section className="py-20 bg-[#FAFAFA] border-t border-gray-100" data-testid="services-showcase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#8B1B4A] bg-[#8B1B4A]/10 px-3.5 py-1 rounded-full">
              Tailored For You
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif text-gray-900 mt-3 tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
              Specialty Services & Tailoring
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-3">
              Explore our made-to-measure custom stitching, Navratri festival rentals, bulk enterprise apparel, and exquisite bridal wedding tailoring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: 'customize-order',
                title: 'Customize Cloth Order',
                icon: Scissors,
                desc: 'Bespoke tailoring, custom necklines & made-to-measure kurtis crafted to your exact fit.',
                tag: 'Custom Fit'
              },
              {
                id: 'navratri-rent',
                title: 'Navratri Cloth on Rent',
                icon: Sparkles,
                desc: 'Designer Chaniya Cholis with authentic mirror & Gamthi embroidery for rent in Pune.',
                tag: 'Festive Rental'
              },
              {
                id: 'bulk-customize',
                title: 'Bulk Customize Order',
                icon: Layers,
                desc: 'Wholesale tiered pricing for dance troupes, corporate festive uniforms & boutique batches.',
                tag: 'Wholesale & MOQ'
              },
              {
                id: 'wedding-stitch',
                title: 'Wedding Cloth Stitch Order',
                icon: HeartHandshake,
                desc: 'Royal bridal lehengas, designer padded blouses, Haldi & Mehendi wedding stitching accepted.',
                tag: 'Bridal Couture'
              }
            ].map((srv, idx) => {
              const SrvIcon = srv.icon;
              return (
                <Link
                  key={idx}
                  to={`/services#${srv.id}`}
                  className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#8B1B4A]/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#8B1B4A]/10 text-[#8B1B4A] flex items-center justify-center group-hover:bg-[#8B1B4A] group-hover:text-white transition-colors">
                        <SrvIcon size={24} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B1B4A] bg-pink-50 px-2.5 py-0.5 rounded-full">
                        {srv.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif font-semibold text-gray-900 mb-2 group-hover:text-[#8B1B4A] transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {srv.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {srv.desc}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center text-xs font-semibold text-[#8B1B4A] group-hover:translate-x-1 transition-transform">
                    <span>Explore Service</span>
                    <ArrowRight size={14} className="ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 bg-[#8B1B4A] hover:bg-[#A4305E] text-white px-7 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-transform hover:scale-105 shadow-md shadow-[#8B1B4A]/20"
            >
              View All Services & Book Consultation <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Craftsmanship Badges */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 flex flex-col items-center">
              <Award className="text-[#8B1B4A] mb-3" size={28} />
              <h4 className="font-semibold text-sm text-gray-900">100% Handcrafted</h4>
              <p className="text-xs text-gray-500 mt-1">Authentic block print & artisanal dyes</p>
            </div>
            <div className="p-4 flex flex-col items-center">
              <Scissors className="text-[#8B1B4A] mb-3" size={28} />
              <h4 className="font-semibold text-sm text-gray-900">Custom Sizing (XS - 6XL)</h4>
              <p className="text-xs text-gray-500 mt-1">Made-to-measure tailoring & fittings</p>
            </div>
            <div className="p-4 flex flex-col items-center">
              <Truck className="text-[#8B1B4A] mb-3" size={28} />
              <h4 className="font-semibold text-sm text-gray-900">Pan-India Delivery</h4>
              <p className="text-xs text-gray-500 mt-1">Safe dispatch with live tracking</p>
            </div>
            <div className="p-4 flex flex-col items-center">
              <ShieldCheck className="text-[#8B1B4A] mb-3" size={28} />
              <h4 className="font-semibold text-sm text-gray-900">Secure Payments</h4>
              <p className="text-xs text-gray-500 mt-1">Razorpay UPI & card encryption</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Google SEO Content & Buying Guide */}
      <section className="py-16 bg-[#FAFAFA] border-t border-gray-200/70 text-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200 pb-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-serif text-[#8B1B4A] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Online Shopping for Women's Designer Kurtis, Ethnic Wear & Tailoring at VS Fashion
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Welcome to <strong>VS Fashion</strong>, your premier online destination for handcrafted women's kurtis, designer Indian ethnic wear, and bespoke tailoring services in Pune, Maharashtra. Whether you are looking to <strong>buy cotton kurtis online</strong> for daily office wear, discover flared <strong>Anarkali suits</strong>, or order custom-stitched traditional attire, VS Fashion blends timeless Indian artistry with contemporary comfort.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-xs sm:text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">
                  1. Handcrafted Designer Cotton Kurtis Online
                </h3>
                <p className="text-gray-600">
                  Explore our curated collections of <strong>pure cotton kurtis for women</strong>, featuring intricate hand-block prints, breathable fabrics, and vibrant colors. Our signature styles include <strong>Halter Neck Kurtis</strong>, <strong>Bell Full Sleeved Kurtis</strong>, <strong>Straight Cut Kurtis with Pants</strong>, and comfortable everyday tunic tops tailored for the modern Indian woman.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">
                  2. Navratri Cloth on Rent in Pune (Garba & Chaniya Choli)
                </h3>
                <p className="text-gray-600">
                  Looking for authentic <strong>Navratri Chaniya Choli on rent in Pune</strong>? VS Fashion offers heavily flared designer lehengas featuring traditional mirror work, Kutchi embroidery, Gamthi borders, and vibrant Dupattas. Enjoy cost-effective single-night and complete 9-day season rental packages with sanitized, pristine hygiene standards.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">
                  3. Customize Cloth Orders & Made-to-Measure Tailoring
                </h3>
                <p className="text-gray-600">
                  Every silhouette is unique. With our <strong>custom cloth order stitching service</strong>, you can share your design inspirations, choice of fabric, sleeve preference, and necklines. Our master tailors in Kothrud, Pune provide precision sizing from XS to 6XL to give you a flattering, tailored fit.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">
                  4. Wedding Cloth Stitch Order Accepted & Bulk Custom Orders
                </h3>
                <p className="text-gray-600">
                  Make your celebrations extraordinary with our <strong>wedding cloth stitch orders</strong> for brides and bridesmaids—including padded blouses, bridal lehengas, and Haldi/Mehendi sets. For corporate celebrations, college fests, and dance troupes, our <strong>bulk customize orders</strong> provide attractive wholesale volume pricing with Pan-India dispatch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
