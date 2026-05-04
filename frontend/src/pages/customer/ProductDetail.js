import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { token, user, addToCart } = useStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${productId}`);
      setProduct(response.data);
      if (response.data.sizes && response.data.sizes.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (!token || !user) {
      toast.error('Please login to add items to cart');
      navigate('/login', { state: { from: { pathname: `/product/${productId}` } } });
      return;
    }

    try {
      await axios.post(
        `${API}/cart`,
        {
          product_id: productId,
          quantity: quantity,
          size: selectedSize
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      addToCart({
        product_id: productId,
        quantity: quantity,
        size: selectedSize,
        product_name: product.name,
        product_price: product.discount_price || product.price,
        product_image: product.images[0] || ''
      });

      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (!token || !user) {
      toast.error('Please login to continue');
      navigate('/login', { state: { from: { pathname: `/product/${productId}` } } });
      return;
    }

    await handleAddToCart();
    navigate('/checkout');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Product not found</div>;
  }

  const displayPrice = product.discount_price || product.price;

  return (
    <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
            <img
              src={product.images?.[selectedImage] 
                ? (product.images[selectedImage].startsWith('http') ? product.images[selectedImage] : `${BACKEND_URL}${product.images[selectedImage]}`)
                : 'https://via.placeholder.com/600x800'}
              alt={product.name}
              data-testid="product-main-image"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {product.images.slice(0, 4).map((img, index) => (
              <button
                key={index}
                data-testid={`product-thumbnail-${index}`}
                onClick={() => setSelectedImage(index)}
                className={`aspect-[3/4] bg-gray-100 overflow-hidden border-2 transition-all ${
                  selectedImage === index ? 'border-[#1A1A1A]' : 'border-transparent'
                }`}
              >
                <img
                  src={img.startsWith('http') ? img : `${BACKEND_URL}${img}`}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
            {product.collection_name}
          </p>
          <h1 className="text-4xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold">₹{displayPrice.toFixed(2)}</span>
            {product.discount_price && (
              <span className="text-xl text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
            )}
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-gray-700" style={{ lineHeight: 1.6 }}>
              {product.description}
            </p>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <Label className="text-sm uppercase tracking-widest mb-3 block">Select Size</Label>
              <div className="flex gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    data-testid={`size-option-${size}`}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 border cursor-pointer transition-all ${
                      selectedSize === size
                        ? 'border-[#4A2836] bg-[#4A2836] text-white'
                        : 'border-gray-300 hover:border-[#4A2836]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <Label className="text-sm uppercase tracking-widest mb-3 block">Color</Label>
            <p className="text-gray-700">{product.color}</p>
          </div>

          {product.size_guide && (
            <div className="mb-6">
              <Label className="text-sm uppercase tracking-widest mb-3 block">Size Guide</Label>
              <p className="text-sm text-gray-600">{product.size_guide}</p>
            </div>
          )}

          <div className="mb-6">
            <Label className="text-sm uppercase tracking-widest mb-3 block">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                data-testid="quantity-decrease-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                variant="outline"
                size="icon"
              >
                <Minus size={16} />
              </Button>
              <span className="text-lg font-bold w-12 text-center" data-testid="quantity-display">{quantity}</span>
              <Button
                data-testid="quantity-increase-btn"
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                variant="outline"
                size="icon"
              >
                <Plus size={16} />
              </Button>
              <span className="text-sm text-gray-500 ml-4">
                ({product.quantity} available)
              </span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-2xl font-bold">
              Total: ₹{(displayPrice * quantity).toFixed(2)}
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              data-testid="add-to-cart-btn"
              onClick={handleAddToCart}
              variant="outline"
              className="flex-1 py-6 uppercase tracking-widest text-xs border-[#4A2836] hover:bg-[#4A2836] hover:text-white"
            >
              Add to Cart
            </Button>
            <Button
              data-testid="buy-now-btn"
              onClick={handleBuyNow}
              className="flex-1 py-6 uppercase tracking-widest text-xs bg-[#C4969C] hover:bg-[#B4848F] text-white"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
