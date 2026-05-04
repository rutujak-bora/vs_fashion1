import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    confirm_password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, {
        full_name: formData.full_name,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        password: formData.password
      });

      setUser(response.data.user, response.data.token, false);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-md w-full bg-white p-8 border border-gray-200">
        <h1 className="text-3xl mb-2 text-center" style={{ fontFamily: 'Playfair Display' }}>
          Create Account
        </h1>
        <p className="text-sm text-gray-600 mb-8 text-center">Join VS Fashion today</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              data-testid="register-fullname-input"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              data-testid="register-email-input"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              name="mobile"
              data-testid="register-mobile-input"
              value={formData.mobile}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address">Full Address</Label>
            <Textarea
              id="address"
              name="address"
              data-testid="register-address-input"
              value={formData.address}
              onChange={handleChange}
              required
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              data-testid="register-password-input"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              data-testid="register-confirm-password-input"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            data-testid="register-submit-btn"
            disabled={loading}
            className="w-full bg-[#4A2836] hover:bg-[#5A3846] text-white uppercase tracking-widest text-xs py-6"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" data-testid="register-login-link" className="text-[#D4AF37] hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
