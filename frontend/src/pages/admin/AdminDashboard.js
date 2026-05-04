import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useStore from '@/store/useStore';
import { Users, Package, ShoppingBag, FolderKanban } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { token } = useStore();
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    orders: 0,
    collections: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customersRes, productsRes, ordersRes, collectionsRes] = await Promise.all([
        axios.get(`${API}/admin/customers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/inventory`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/collections`)
      ]);

      setStats({
        customers: customersRes.data.length,
        products: productsRes.data.length,
        orders: ordersRes.data.length,
        collections: collectionsRes.data.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Products', value: stats.products, icon: Package, color: 'bg-green-100 text-green-600' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
    { label: 'Collections', value: stats.collections, icon: FolderKanban, color: 'bg-orange-100 text-orange-600' }
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`} className="bg-white p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white p-8 border border-gray-200">
        <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>
          Welcome to VS Fashion Admin Panel
        </h2>
        <p className="text-gray-600">
          Use the sidebar navigation to manage your e-commerce platform.
        </p>
      </div>
    </div>
  );
}
