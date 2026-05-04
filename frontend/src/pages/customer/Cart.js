import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function Cart() {
  const navigate = useNavigate();
  const { token, user, setCart, removeFromCart } = useStore();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(response.data.items || []);
      setCart(response.data.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId, size) => {
    try {
      await axios.delete(`${API}/cart/${productId}?size=${size}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      removeFromCart(productId, size);
      setCartItems(cartItems.filter(item => !(item.product_id === productId && item.size === size)));
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
  };

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display' }}>Please Login</h2>
          <p className="mb-6 text-gray-600">You need to login to view your cart</p>
          <Button asChild className="bg-[#1A1A1A] hover:bg-[#2A2A2A]">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display' }}>Your Cart is Empty</h2>
          <p className="mb-6 text-gray-600">Start shopping to add items to your cart</p>
          <Button asChild className="bg-[#1A1A1A] hover:bg-[#2A2A2A]">
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <h1 className="text-5xl mb-12" style={{ fontFamily: 'Playfair Display' }}>
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2" data-testid="cart-items-list">
          {cartItems.map((item, index) => (
            <div
              key={`${item.product_id}-${item.size}`}
              data-testid={`cart-item-${index}`}
              className="flex gap-6 pb-6 mb-6 border-b border-gray-200"
            >
              <div className="w-24 h-32 bg-gray-100 overflow-hidden flex-shrink-0">
                <img
                  src={item.product_image 
                    ? (item.product_image.startsWith('http') ? item.product_image : `${BACKEND_URL}${item.product_image}`)
                    : 'https://via.placeholder.com/96x128'}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <h3 className="text-lg mb-2" style={{ fontFamily: 'Playfair Display' }}>
                  {item.product_name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">Size: {item.size}</p>
                <p className="text-sm text-gray-600 mb-2">Quantity: {item.quantity}</p>
                <p className="font-bold">₹{(item.product_price * item.quantity).toFixed(2)}</p>
              </div>

              <button
                data-testid={`remove-cart-item-${index}`}
                onClick={() => handleRemove(item.product_id, item.size)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 p-6 h-fit" data-testid="cart-summary">
          <h2 className="text-2xl mb-6" style={{ fontFamily: 'Playfair Display' }}>
            Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items</span>
              <span data-testid="cart-total-items">{totalQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span data-testid="cart-subtotal">₹{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span data-testid="cart-total">₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <Button
            data-testid="proceed-to-checkout-btn"
            onClick={() => navigate('/checkout')}
            className="w-full py-6 bg-[#C4969C] hover:bg-[#B4848F] text-white uppercase tracking-widest text-xs"
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
