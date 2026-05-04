import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '@/components/ProductCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?is_new_arrival=true`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
          New Arrivals
        </h1>
        <p className="text-gray-600">Discover our latest collection</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" data-testid="new-arrivals-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No new arrivals available</p>
      )}
    </div>
  );
}
