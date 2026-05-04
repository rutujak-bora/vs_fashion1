import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

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
                  <div>
                    <Label>Address</Label>
                    <p className="text-gray-700 mt-1">{profile?.address}</p>
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
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      data-testid="profile-address-input"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="mt-1"
                      rows={3}
                    />
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
