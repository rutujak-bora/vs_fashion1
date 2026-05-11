import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function ProductCard({ product }) {
  const displayPrice = product.discount_price || product.price;

  return (
    <motion.div
      data-testid={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Link to={`/product/${product.id}`} className="group block">
        <div className="relative overflow-hidden bg-gray-100 aspect-[3/4] mb-4 traditional-frame">
          <img
            src={product.images?.[0] 
              ? (product.images[0].startsWith('http') ? product.images[0] : `${BACKEND_URL}${product.images[0]}`)
              : 'https://via.placeholder.com/400x533'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {product.discount_price && (
            <div className="absolute top-4 right-4 bg-[#C4969C] text-white px-3 py-1 text-xs uppercase tracking-widest">
              Sale
            </div>
          )}
          {product.quantity === 0 ? (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 text-xs uppercase tracking-widest font-bold">
                Out of Stock
              </span>
            </div>
          ) : product.quantity < 5 ? (
            <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 text-xs uppercase tracking-widest">
              Low Stock
            </div>
          ) : null}
          <div className="absolute top-2 left-2 text-[#C4969C] text-xl opacity-50">❋</div>
          <div className="absolute bottom-2 right-2 text-[#C4969C] text-xl opacity-50">❋</div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
            {product.collection_name}
          </p>
          <h3 className="text-base mb-2" style={{ fontFamily: 'Playfair Display' }}>
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">₹{displayPrice.toFixed(2)}</span>
            {product.discount_price && (
              <span className="text-sm text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
            )}
          </div>
          {product.sizes && product.sizes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Sizes: {product.sizes.join(', ')}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
