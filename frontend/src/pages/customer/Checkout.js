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
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cartRes, addrRes] = await Promise.all([
        axios.get(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/user/addresses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCartItems(cartRes.data.items || []);
      const addrList = addrRes.data || [];
      setAddresses(addrList);
      
      // Set default address as selected
      const defaultAddr = addrList.find(a => a.is_default) || addrList[0];
      setSelectedAddress(defaultAddr);
    } catch (error) {
      console.error('Error fetching checkout data:', error);
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

  const calculateShipping = (items, address) => {
    if (!address) return 0;
    
    let isMaharashtra = false;
    const lowerState = address.state?.toLowerCase() || '';
    const lowerAddrLine = address.address_line?.toLowerCase() || '';
    const pincode = address.pincode || '';
    
    // Check for Maharashtra pincodes or state name
    if (pincode.startsWith('40') || pincode.startsWith('41') || pincode.startsWith('42') || pincode.startsWith('43') || pincode.startsWith('44') || 
        lowerState.includes('maharashtra') || lowerAddrLine.includes('maharashtra')) {
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

    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    setPlacing(true);
    const productTotal = calculateTotal();
    const shipping = calculateShipping(cartItems, selectedAddress);
    const finalTotal = productTotal + shipping;
    const fullAddressString = `${selectedAddress.full_name}\n${selectedAddress.address_line}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}\nMobile: ${selectedAddress.mobile}`;

    if (isNaN(finalTotal) || finalTotal <= 0) {
      toast.error('Invalid total amount. Please check your cart.');
      setPlacing(false);
      return;
    }

    try {
      // 1. Create Razorpay Order
      const rzpOrderResponse = await axios.post(
        `${API}/payments/create-order`,
        { amount: finalTotal, state: selectedAddress.state },
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
                total_amount: finalTotal,
                delivery_address: fullAddressString
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
          name: selectedAddress.full_name,
          email: user?.email,
          contact: selectedAddress.mobile
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl" style={{ fontFamily: 'Playfair Display' }}>
            Select Delivery Address
          </h2>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="text-xs uppercase tracking-widest"
          >
            Manage Addresses
          </Button>
        </div>

        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {addresses.map(addr => (
              <div 
                key={addr.id}
                onClick={() => setSelectedAddress(addr)}
                className={`cursor-pointer border p-4 transition-all ${
                  selectedAddress?.id === addr.id 
                    ? 'border-[#C4969C] bg-[#C4969C]/5 ring-1 ring-[#C4969C]' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                    {addr.label}
                  </span>
                  {selectedAddress?.id === addr.id && (
                    <div className="w-4 h-4 bg-[#C4969C] rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <p className="font-bold text-sm">{addr.full_name}</p>
                <p className="text-xs text-gray-600 mb-2">{addr.mobile}</p>
                <p className="text-xs text-gray-700 line-clamp-2">
                  {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded mb-6">
            <p className="text-gray-500 mb-4">No addresses saved yet</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-[#1A1A1A]">
              Add Address in Dashboard
            </Button>
          </div>
        )}
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
          <span>₹{calculateShipping(cartItems, selectedAddress).toFixed(2)}</span>
        </div>
        {selectedAddress && !(selectedAddress.state?.toLowerCase().includes('maharashtra')) && (
          <p className="text-xs text-gray-500 mt-1 italic">Note: Shipping outside Maharashtra is calculated at ₹220 per kg</p>
        )}
        <div className="flex justify-between pt-4 text-lg font-bold border-t border-gray-200 mt-4">
          <span>Final Total</span>
          <span data-testid="checkout-total">₹{(calculateTotal() + calculateShipping(cartItems, selectedAddress)).toFixed(2)}</span>
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
