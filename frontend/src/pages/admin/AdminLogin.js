import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/admin/login`, formData);
      setUser(response.data.admin, response.data.token, true);
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-md w-full bg-white p-8 border border-gray-200">
        <h1 className="text-3xl mb-2 text-center" style={{ fontFamily: 'Playfair Display' }}>
          Admin Login
        </h1>
        <p className="text-sm text-gray-600 mb-8 text-center">VS Fashion Admin Panel</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              data-testid="admin-login-email-input"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              data-testid="admin-login-password-input"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            data-testid="admin-login-submit-btn"
            disabled={loading}
            className="w-full bg-[#4A2836] hover:bg-[#5A3846] text-white uppercase tracking-widest text-xs py-6"
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4A2836] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to store
          </Link>
        </div>
      </div>
    </div >
  );
}
