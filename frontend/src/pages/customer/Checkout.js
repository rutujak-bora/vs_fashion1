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
    return cartItems.reduce((sum, item) => {
      const price = Number(item.product_price);
      if (isNaN(price) || price <= 0) return sum;
      return sum + (price * item.quantity);
    }, 0);
  };

  const calculateShipping = (items, state) => {
    let isMaharashtra = false;
    const lowerState = state?.toLowerCase() || '';
    
    // Check for Maharashtra pincodes (starts with 40, 41, 42, 43, 44)
    const pincodeMatch = lowerState.match(/\b(40|41|42|43|44)\d{4}\b/);
    if (pincodeMatch || lowerState.includes('maharashtra')) {
      isMaharashtra = true;
    }

    if (isMaharashtra) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      return totalQuantity * 80;
    } else {
      const totalWeight = items.reduce((sum, item) => {
        const weight = Number(item.product_weight) || 0.5;
        return sum + (weight * item.quantity);
      }, 0);
      return totalWeight * 220;
    }
  };

  const handleRemove = async (productId, size) => {
    try {
      const response = await axios.delete(`${API}/cart/remove/${productId}?size=${size}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(response.data.items || []);
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setPlacing(true);
    const productTotal = calculateTotal();
    const userState = user?.address || '';
    const shipping = calculateShipping(cartItems, userState);
    const finalTotal = productTotal + shipping;

    if (isNaN(finalTotal) || finalTotal <= 0) {
      toast.error('Invalid total amount. Please check your cart.');
      setPlacing(false);
      return;
    }

    try {
      // 1. Create Razorpay Order
      const rzpOrderResponse = await axios.post(
        `${API}/payments/create-order`,
        { amount: finalTotal, state: userState },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const rzpOrder = rzpOrderResponse.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_Sm3FUWDSurPgJt',
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "VS Fashion",
        description: "Purchase from VS Fashion",
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            // 3. Create order in our database
            const orderItems = cartItems.map(item => ({
              product_id: item.product_id,
              product_name: item.product_name,
              size: item.size,
              quantity: item.quantity,
              price: item.product_price
            }));

            const ourOrderResponse = await axios.post(
              `${API}/orders`,
              {
                items: orderItems,
                total_amount: finalTotal
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const ourOrderId = ourOrderResponse.data.order_id;

            // 4. Verify payment on backend
            const formData = new FormData();
            formData.append('order_id', ourOrderId);
            formData.append('razorpay_order_id', response.razorpay_order_id);
            formData.append('razorpay_payment_id', response.razorpay_payment_id);
            formData.append('razorpay_signature', response.razorpay_signature);

            await axios.post(`${API}/payments/verify`, formData, {
              headers: { Authorization: `Bearer ${token}` }
            });

            clearCart();
            toast.success('Order placed successfully!');
            navigate('/dashboard');
          } catch (err) {
            console.error('Payment verification failed:', err);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.full_name,
          email: user?.email,
          contact: user?.mobile
        },
        theme: {
          color: "#8B1B4A"
        },
        modal: {
          ondismiss: function() {
            setPlacing(false);
            toast.error('Payment cancelled by user');
          }
        }
      };

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not loaded. Please refresh the page.');
        setPlacing(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(response.error.description || 'Payment failed');
        setPlacing(false);
      });

      rzp.open();

    } catch (error) {
      console.error('Error initiating payment:', error);
      const detail = error.response?.data?.detail;
      let message = 'Failed to initiate payment';

      if (Array.isArray(detail)) {
        message = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }

      toast.error(message);
      setPlacing(false);
    }
    // Note: Do not setPlacing(false) in a finally block here, as rzp.open() is asynchronous 
    // and we want the button to remain disabled while the modal is open.

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
          <p className="break-words"><strong>Mobile:</strong> {user?.mobile}</p>
          <p className="whitespace-pre-wrap break-words"><strong>Address:</strong> {user?.address}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
          Order Items
        </h2>
        {cartItems.length > 0 ? (
          cartItems.map((item, index) => (
            <div key={`${item.product_id}-${item.size}`} className="flex justify-between py-3 border-b border-gray-200">
              <div className="flex-1">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-gray-600">Size: {item.size} | Qty: {item.quantity}</p>
                <button
                  onClick={() => handleRemove(item.product_id, item.size)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 uppercase tracking-tighter"
                >
                  Remove
                </button>
              </div>
              <p className="font-bold">₹{(item.product_price * item.quantity).toFixed(2)}</p>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-gray-500">
            <p className="mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/')} variant="outline" className="text-xs uppercase tracking-widest">
              Continue Shopping
            </Button>
          </div>
        )}
        <div className="flex justify-between pt-4 text-sm">
          <span>Quantity</span>
          <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div className="flex justify-between pt-2 text-sm">
          <span>Product Amount</span>
          <span>₹{calculateTotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 text-sm">
          <span>Shipping Charges</span>
          <span>₹{calculateShipping(cartItems, user?.address).toFixed(2)}</span>
        </div>
        {!(user?.address?.toLowerCase().includes('maharashtra')) && (
          <p className="text-xs text-gray-500 mt-1 italic">Note: Shipping outside Maharashtra is calculated at ₹220 per kg</p>
        )}
        <div className="flex justify-between pt-4 text-lg font-bold border-t border-gray-200 mt-4">
          <span>Final Total</span>
          <span data-testid="checkout-total">₹{(calculateTotal() + calculateShipping(cartItems, user?.address)).toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display' }}>
          Payment Method
        </h2>
        <p className="text-gray-700">Online Payment (Razorpay)</p>
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
