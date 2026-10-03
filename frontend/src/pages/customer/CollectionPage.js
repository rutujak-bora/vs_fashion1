import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '@/components/ProductCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function CollectionPage() {
  const { collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [selectedSize, setSelectedSize] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, [collectionId]);

  const fetchData = async () => {
    try {
      const [collectionsRes, productsRes] = await Promise.all([
        axios.get(`${API}/collections`),
        axios.get(`${API}/products?collection_id=${collectionId}`)
      ]);
      
      const coll = collectionsRes.data.find(c => c.id === collectionId);
      setCollection(coll);
      if (coll) {
        document.title = `${coll.name} Collection | Designer Kurtis & Ethnic Wear | VS Fashion`;
      }
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const getFilteredAndSortedProducts = () => {
    let list = [...products];

    // Filter by Size
    if (selectedSize !== 'ALL') {
      list = list.filter(p => p.sizes && p.sizes.includes(selectedSize));
    }

    // Sort
    if (sortBy === 'price-low') {
      list.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const displayedProducts = getFilteredAndSortedProducts();
  const availableSizes = ['ALL', 'S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-5xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
          {collection?.name || 'Collection'}
        </h1>
        {collection?.description && (
          <p className="text-gray-600">{collection.description}</p>
        )}
      </div>

      {/* Filter & Sort Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Size Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2">Filter Size:</span>
          {availableSizes.map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                selectedSize === size
                  ? 'bg-[#8B1B4A] text-white border-[#8B1B4A] font-bold shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#8B1B4A]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#8B1B4A]"
          >
            <option value="default">Featured / Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-asc">Product Name (A-Z)</option>
          </select>
        </div>
      </div>

      {displayedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8" data-testid="collection-products-grid">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
          <p className="mb-2 font-medium">No products match your filter criteria.</p>
          <button
            onClick={() => { setSelectedSize('ALL'); setSortBy('default'); }}
            className="text-xs text-[#8B1B4A] underline font-bold uppercase tracking-wider"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
