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
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
          {collection?.name || 'Collection'}
        </h1>
        {collection?.description && (
          <p className="text-gray-600">{collection.description}</p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" data-testid="collection-products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No products in this collection yet</p>
      )}
    </div>
  );
}
