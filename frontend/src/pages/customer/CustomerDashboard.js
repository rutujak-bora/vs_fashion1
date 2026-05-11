import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Home, Briefcase, MapPin, Trash2, Plus, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

function AddressManager() {
  const { token } = useStore();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    full_name: '',
    mobile: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API}/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/user/addresses`, newAddr, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Address added successfully');
      setShowAdd(false);
      fetchAddresses();
      setNewAddr({
        label: 'Home',
        full_name: '',
        mobile: '',
        address_line: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false
      });
    } catch (error) {
      toast.error('Failed to add address');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await axios.delete(`${API}/user/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Address deleted');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.patch(`${API}/user/addresses/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  if (loading) return <div>Loading addresses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl" style={{ fontFamily: 'Playfair Display' }}>Address Book</h2>
        <Button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#1A1A1A] hover:bg-[#2A2A2A] gap-2"
        >
          {showAdd ? 'Cancel' : <><Plus size={16} /> Add New Address</>}
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddAddress} className="bg-gray-50 p-6 border border-gray-200 rounded-sm space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Address Label (e.g. Home, Office)</Label>
              <div className="flex gap-2 mt-1">
                {['Home', 'Office', 'Other'].map(l => (
                  <Button
                    key={l}
                    type="button"
                    variant={newAddr.label === l ? 'default' : 'outline'}
                    onClick={() => setNewAddr({...newAddr, label: l})}
                    className="flex-1"
                  >
                    {l === 'Home' && <Home size={14} className="mr-2" />}
                    {l === 'Office' && <Briefcase size={14} className="mr-2" />}
                    {l}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="addr_name">Full Name</Label>
              <Input 
                id="addr_name"
                value={newAddr.full_name}
                onChange={e => setNewAddr({...newAddr, full_name: e.target.value})}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="addr_mobile">Mobile Number</Label>
              <Input 
                id="addr_mobile"
                value={newAddr.mobile}
                onChange={e => setNewAddr({...newAddr, mobile: e.target.value})}
                required
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="addr_line">Address Line</Label>
              <Textarea 
                id="addr_line"
                value={newAddr.address_line}
                onChange={e => setNewAddr({...newAddr, address_line: e.target.value})}
                required
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="addr_city">City</Label>
              <Input 
                id="addr_city"
                value={newAddr.city}
                onChange={e => setNewAddr({...newAddr, city: e.target.value})}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="addr_pincode">Pincode</Label>
              <Input 
                id="addr_pincode"
                value={newAddr.pincode}
                onChange={e => setNewAddr({...newAddr, pincode: e.target.value})}
                required
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="addr_state">State</Label>
              <Input 
                id="addr_state"
                value={newAddr.state}
                onChange={e => setNewAddr({...newAddr, state: e.target.value})}
                placeholder="e.g. Maharashtra"
                required
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="is_default" 
              checked={newAddr.is_default}
              onChange={e => setNewAddr({...newAddr, is_default: e.target.checked})}
            />
            <Label htmlFor="is_default">Set as default address</Label>
          </div>
          <Button type="submit" className="w-full bg-[#C4969C] hover:bg-[#B4848F]">Save Address</Button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map(addr => (
          <div key={addr.id} className={`border p-6 relative bg-white ${addr.is_default ? 'border-[#C4969C] ring-1 ring-[#C4969C]' : 'border-gray-200'}`}>
            {addr.is_default && (
              <span className="absolute top-0 right-0 bg-[#C4969C] text-white text-[10px] px-2 py-1 uppercase tracking-tighter">
                Default
              </span>
            )}
            <div className="flex items-center gap-2 mb-4 text-[#C4969C]">
              {addr.label === 'Home' ? <Home size={18} /> : addr.label === 'Office' ? <Briefcase size={18} /> : <MapPin size={18} />}
              <span className="font-bold uppercase text-xs tracking-widest">{addr.label}</span>
            </div>
            <p className="font-bold text-lg mb-1">{addr.full_name}</p>
            <p className="text-gray-600 text-sm mb-4">{addr.mobile}</p>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              {addr.address_line},<br />
              {addr.city}, {addr.state} - {addr.pincode}
            </p>
            
            <div className="flex justify-between items-center border-t pt-4">
              <button 
                onClick={() => handleDelete(addr.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              {!addr.is_default && (
                <button 
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-xs text-[#C4969C] hover:underline flex items-center gap-1"
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { token, user } = useStore();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    address: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        axios.get(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProfile(profileRes.data);
      setFormData({
        full_name: profileRes.data.full_name,
        mobile: profileRes.data.mobile,
        address: profileRes.data.address
      });
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('full_name', formData.full_name);
      form.append('mobile', formData.mobile);
      form.append('address', formData.address);

      await axios.put(`${API}/profile`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <h1 className="text-5xl mb-12" style={{ fontFamily: 'Playfair Display' }}>
        My Account
      </h1>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList data-testid="dashboard-tabs">
          <TabsTrigger value="orders" data-testid="orders-tab">Orders</TabsTrigger>
          <TabsTrigger value="addresses" data-testid="addresses-tab">Addresses</TabsTrigger>
          <TabsTrigger value="profile" data-testid="profile-tab">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-8">
          <h2 className="text-2xl mb-6" style={{ fontFamily: 'Playfair Display' }}>
            Order History
          </h2>
          {orders.length > 0 ? (
            <div className="space-y-6" data-testid="orders-list">
              {orders.map((order) => (
                <div key={order.id} data-testid={`order-${order.id}`} className="bg-white border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs uppercase tracking-widest ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product_name} (Size: {item.size}, Qty: {item.quantity})</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-4 flex justify-between font-bold">
                    <span>Total Amount</span>
                    <span>₹{order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No orders yet</p>
          )}
        </TabsContent>

        <TabsContent value="addresses" className="mt-8">
          <AddressManager />
        </TabsContent>

        <TabsContent value="profile" className="mt-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl mb-6" style={{ fontFamily: 'Playfair Display' }}>
              Profile Details
            </h2>
            
            {!editing ? (
              <div className="bg-white border border-gray-200 p-6">
                <div className="space-y-4 mb-6">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-gray-700 mt-1">{profile?.full_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-gray-700 mt-1">{profile?.email}</p>
                  </div>
                  <div>
                    <Label>Mobile</Label>
                    <p className="text-gray-700 mt-1">{profile?.mobile}</p>
                  </div>
                  </div>
                </div>
                <Button
                  data-testid="edit-profile-btn"
                  onClick={() => setEditing(true)}
                  className="bg-[#4A2836] hover:bg-[#5A3846]"
                >
                  Edit Profile
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="bg-white border border-gray-200 p-6">
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      data-testid="profile-fullname-input"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email (cannot be changed)</Label>
                    <Input value={profile?.email} disabled className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      data-testid="profile-mobile-input"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    data-testid="save-profile-btn"
                    className="bg-[#C4969C] hover:bg-[#B4848F]"
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    data-testid="cancel-edit-btn"
                    onClick={() => setEditing(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
