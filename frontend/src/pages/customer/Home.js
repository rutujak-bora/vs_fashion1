import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      <section className="relative h-[80vh] overflow-hidden" data-testid="hero-carousel">
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
                    className="text-5xl lg:text-6xl mb-4"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <img
                    src={(() => {
                      const img = collection.home_image_url || collection.image_url;
                      if (!img) return '/images/placeholder.jpg';
                      return img.startsWith('http') ? img : `${BACKEND_URL}${img}`;
                    })()}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Text overlay perfectly matching "BOAT NECK", etc. */}
                  <div className="absolute inset-x-0 top-0 pt-10 md:pt-14 flex flex-col items-center">
                    <h3 
                      className="text-xl md:text-3xl uppercase tracking-[0.25em] text-white text-center leading-tight drop-shadow-md" 
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {/* To handle multi-word collections like HALTER NECK nicely */}
                      {collection.name.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </h3>
                  </div>
                  {/* Subtle dark gradient overlay to ensure text visibility on top if image is bright */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />
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
    </div>
  );
}
