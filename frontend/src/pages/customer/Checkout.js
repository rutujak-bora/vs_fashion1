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

  const isMaharashtraAddress = (address) => {
    if (!address) return false;
    const lowerState = address.state?.toLowerCase().trim() || '';
    const lowerCity = address.city?.toLowerCase().trim() || '';
    const lowerAddrLine = address.address_line?.toLowerCase().trim() || '';
    const pincodeStr = String(address.pincode || '').trim();

    // 1. Check pincode starts with Maharashtra postal codes (40-44)
    if (/^(40|41|42|43|44)/.test(pincodeStr)) return true;

    // 2. Check state field
    if (lowerState.includes('maharashtra') || lowerState === 'mh') return true;

    // 3. Check combined address text
    const fullAddr = `${lowerState} ${lowerCity} ${lowerAddrLine} ${pincodeStr}`;
    if (fullAddr.includes('maharashtra') || /\b(40|41|42|43|44)\d{4}\b/.test(fullAddr)) {
      return true;
    }

    // Common Maharashtra cities
    const mhCities = ['pune', 'mumbai', 'nagpur', 'nashik', 'thane', 'aurangabad', 'chhatrapati sambhajinagar', 'solapur', 'kolhapur', 'amravati', 'navi mumbai', 'jalgaon', 'akola', 'latur', 'dhule', 'ahmednagar', 'satara', 'sangli'];
    if (mhCities.some(city => lowerCity.includes(city) || lowerAddrLine.includes(city))) {
      return true;
    }

    return false;
  };

  const calculateShipping = (items, address) => {
    if (!address || items.length === 0) return 0;
    
    const isMH = isMaharashtraAddress(address);
    if (isMH) {
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
        { amount: finalTotal, state: selectedAddress.state, pincode: selectedAddress.pincode },
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
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_live_TTuWc4WTaHHPT0',
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "VS Fashion",
        description: "Purchase from VS Fashion",
        order_id: rzpOrder.order_id,
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

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const subtotal = calculateTotal();
    
    if (code === 'WELCOME10') {
      const discount = subtotal * 0.10;
      setAppliedCoupon({ code: 'WELCOME10', description: '10% OFF Welcome Discount' });
      setDiscountAmount(discount);
      toast.success('Coupon "WELCOME10" applied! 10% discount subtracted.');
    } else if (code === 'FESTIVE200') {
      if (subtotal < 999) {
        toast.error('FESTIVE200 requires a minimum order of ₹999.');
        return;
      }
      setAppliedCoupon({ code: 'FESTIVE200', description: 'Flat ₹200 OFF Festive Special' });
      setDiscountAmount(200);
      toast.success('Coupon "FESTIVE200" applied! ₹200 discount subtracted.');
    } else if (code === 'VSFASHION15') {
      const discount = subtotal * 0.15;
      setAppliedCoupon({ code: 'VSFASHION15', description: '15% OFF VS Fashion Special' });
      setDiscountAmount(discount);
      toast.success('Coupon "VSFASHION15" applied! 15% discount subtracted.');
    } else {
      toast.error('Invalid coupon code. Try WELCOME10 or FESTIVE200');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput('');
    toast.info('Coupon removed');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const subtotal = calculateTotal();
  const shipping = calculateShipping(cartItems, selectedAddress);
  const finalTotal = Math.max(0, subtotal - discountAmount) + shipping;

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

        {/* Promo Coupon Section */}
        <div className="my-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">Have a Promo Coupon?</p>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded text-xs">
              <div>
                <span className="font-bold text-green-700">{appliedCoupon.code}</span>
                <p className="text-green-600 text-[11px]">{appliedCoupon.description}</p>
              </div>
              <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700 font-semibold text-xs ml-2">
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon (e.g. WELCOME10)"
                className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#8B1B4A] uppercase"
              />
              <Button onClick={handleApplyCoupon} className="bg-[#8B1B4A] hover:bg-[#A4305E] text-white text-xs px-4">
                Apply
              </Button>
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-2">Available codes: <span className="font-bold text-gray-600">WELCOME10</span> (10% OFF), <span className="font-bold text-gray-600">FESTIVE200</span> (₹200 OFF)</p>
        </div>

        <div className="flex justify-between pt-2 text-sm">
          <span>Quantity</span>
          <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div className="flex justify-between pt-2 text-sm">
          <span>Product Amount</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between pt-2 text-sm text-green-600 font-medium">
            <span>Coupon Discount</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 text-sm">
          <span>Shipping Charges</span>
          <span>₹{shipping.toFixed(2)}</span>
        </div>
        {selectedAddress && (
          isMaharashtraAddress(selectedAddress) ? (
            <p className="text-xs text-green-700 mt-1 italic font-medium">Maharashtra Delivery: ₹80 per item</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1 italic">Note: Shipping outside Maharashtra is calculated at ₹220 per kg</p>
          )
        )}
        <div className="flex justify-between pt-4 text-lg font-bold border-t border-gray-200 mt-4">
          <span>Final Total</span>
          <span data-testid="checkout-total">₹{finalTotal.toFixed(2)}</span>
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
