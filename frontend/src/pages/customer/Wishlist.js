import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useStore();

  const handleMoveToCart = (product) => {
    const defaultSize = product.sizes?.[0] || 'M';
    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_price: product.discount_price || product.price,
      product_image: product.images?.[0] || '',
      quantity: 1,
      size: defaultSize
    });
    removeFromWishlist(product.id);
    toast.success(`Moved "${product.name}" to cart!`);
  };

  return (
    <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
      <div className="mb-8 border-b border-[#8B1B4A]/20 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: 'Playfair Display', color: '#8B1B4A' }}>
            My Wishlist
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
        <Heart className="text-[#8B1B4A] fill-[#8B1B4A]" size={36} />
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Explore our collections and tap the heart icon to save your favorite kurtis.</p>
          <Link to="/">
            <Button className="bg-[#8B1B4A] hover:bg-[#A4305E] text-white">
              Explore Collections
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const displayPrice = product.discount_price || product.price;
            return (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex flex-col justify-between group">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                  <img
                    src={product.images?.[0]
                      ? (product.images[0].startsWith('http') ? product.images[0] : `${BACKEND_URL}${product.images[0]}`)
                      : 'https://via.placeholder.com/400x533'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-500 hover:text-red-500 shadow-md transition-colors"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                      {product.collection_name}
                    </p>
                    <Link to={`/product/${product.id}`} className="hover:text-[#8B1B4A]">
                      <h3 className="font-semibold text-gray-800 line-clamp-1 mb-2" style={{ fontFamily: 'Playfair Display' }}>
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-base font-bold text-[#8B1B4A]">₹{displayPrice.toFixed(2)}</span>
                      {product.discount_price && (
                        <span className="text-xs text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleMoveToCart(product)}
                    className="w-full bg-[#8B1B4A] hover:bg-[#A4305E] text-white flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    <ShoppingBag size={14} /> Move to Cart
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
