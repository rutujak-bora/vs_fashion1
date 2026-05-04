import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function Checkout() {
  const navigate = useNavigate();
  const { token, user, clearCart } = useStore();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setPlacing(true);
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        size: item.size,
        quantity: item.quantity,
        price: item.product_price
      }));

      const response = await axios.post(
        `${API}/orders`,
        {
          items: orderItems,
          total_amount: calculateTotal()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      clearCart();
      toast.success('Order placed successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
      <h1 className="text-5xl mb-12" style={{ fontFamily: 'Playfair Display' }}>
        Checkout
      </h1>

      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
          Delivery Information
        </h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Name:</strong> {user?.full_name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Mobile:</strong> {user?.mobile}</p>
          <p><strong>Address:</strong> {user?.address}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
          Order Items
        </h2>
        {cartItems.map((item, index) => (
          <div key={`${item.product_id}-${item.size}`} className="flex justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium">{item.product_name}</p>
              <p className="text-sm text-gray-600">Size: {item.size} | Qty: {item.quantity}</p>
            </div>
            <p className="font-bold">₹{(item.product_price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <div className="flex justify-between pt-4 text-lg font-bold">
          <span>Total Amount</span>
          <span data-testid="checkout-total">₹{calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
          Payment Method
        </h2>
        <p className="text-gray-700">Cash on Delivery</p>
      </div>

      <Button
        data-testid="place-order-btn"
        onClick={handlePlaceOrder}
        disabled={placing}
        className="w-full py-6 bg-[#C4969C] hover:bg-[#B4848F] text-white uppercase tracking-widest text-xs"
      >
        {placing ? 'Placing Order...' : 'Place Order'}
      </Button>
    </div>
  );
}
