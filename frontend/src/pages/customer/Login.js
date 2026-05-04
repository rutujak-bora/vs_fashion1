import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      setUser(response.data.user, response.data.token, false);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-md w-full bg-white p-8 border border-gray-200">
        <h1 className="text-3xl mb-2 text-center" style={{ fontFamily: 'Playfair Display' }}>
          Welcome Back
        </h1>
        <p className="text-sm text-gray-600 mb-8 text-center">Login to your account</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              data-testid="login-email-input"
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
              data-testid="login-password-input"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            data-testid="login-submit-btn"
            disabled={loading}
            className="w-full bg-[#4A2836] hover:bg-[#5A3846] text-white uppercase tracking-widest text-xs py-6"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" data-testid="login-register-link" className="text-[#D4AF37] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
