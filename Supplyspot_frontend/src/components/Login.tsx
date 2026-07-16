import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Loader2, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    accessToken: string;
  };
  error?: string;
  details?: any[];
}

export default function Login() {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    if (!formData.email) {
      errors.email = ['Email is required'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = ['Please enter a valid email address'];
    }

    if (!formData.password) {
      errors.password = ['Password is required'];
    } else if (formData.password.length < 8) {
      errors.password = ['Password must be at least 8 characters long'];
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        throw new Error(`Server returned an invalid response (Status ${response.status}). Please ensure the backend is running.`);
      }

      if (!response.ok) {
        // Handle specific error messages from backend
        if (response.status === 403 && data.error?.includes('approval')) {
          throw new Error('Your account is waiting for approval by the supplier.');
        } else if (response.status === 401) {
          throw new Error('Invalid email or password.');
        } else {
          throw new Error(data.error || data.message || `Sign in failed (Status ${response.status}).`);
        }
      }

      // Success - call context login to store token and vendor info
      login(data.token || data.data?.accessToken, data.vendor || data.data?.user);

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | null => {
    const errors = fieldErrors[fieldName];
    return errors && errors.length > 0 ? errors[0] : null;
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f4f6f8] p-6 lg:p-12 font-sans overflow-hidden">
      <div className="w-full h-full max-w-[1600px] bg-white rounded-3xl shadow-2xl flex overflow-hidden">
        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col relative bg-white">
          <div className="mb-6">
            <Logo size="md" />
          </div>

          <div className="max-w-[420px] mx-auto w-full flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome Back to SupplierSpot</h1>
            <p className="text-gray-500 text-sm mb-6 text-center px-4">
              Log in to manage your procurement operations, track vendors, and gain real-time insights.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 bg-blue-50/50 p-3 rounded-lg mb-2 border border-blue-100">
                <Switch
                  id="test-supplier"
                  onCheckedChange={(checked: boolean) => {
                    if (checked) {
                      setFormData({ email: 'test_supplier@example.com', password: 'password123' });
                    } else {
                      setFormData({ email: '', password: '' });
                    }
                  }}
                />
                <Label htmlFor="test-supplier" className="text-sm font-medium text-blue-800 cursor-pointer">
                  [Testing] Auto-fill Supplier Login
                </Label>
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="johnsmith@supplierspot.io"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`h-11 ${getFieldError('email') ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {getFieldError('email') && (
                  <p className="text-xs text-red-500 mt-1">{getFieldError('email')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`h-11 pr-10 ${getFieldError('password') ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="text-xs text-red-500 mt-1">{getFieldError('password')}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1 pb-2">
                <input type="checkbox" id="remember" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">Remember me</label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            <div className="mt-6 relative flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-gray-200"></div>
              <span className="relative bg-white px-4 text-sm text-gray-500">Or</span>
            </div>

            <div className="mt-6 flex gap-4">
              <Button variant="outline" className="flex-1 h-11 font-normal text-gray-600">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Login with Google
              </Button>
              <Button variant="outline" className="flex-1 h-11 font-normal text-gray-600">
                <svg className="w-5 h-5 mr-2 text-black" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 13.61c-.02-2.36 1.93-3.5 2.02-3.56-1.1-1.61-2.82-1.83-3.41-1.85-1.46-.15-2.86.86-3.61.86-.75 0-1.92-.84-3.14-.82-1.6.02-3.08.93-3.9 2.37-1.67 2.89-.43 7.17 1.2 9.53.79 1.15 1.73 2.43 3 2.39 1.22-.04 1.7-.78 3.18-.78s1.92.78 3.2.76c1.3-.02 2.12-1.15 2.91-2.32.91-1.33 1.29-2.62 1.3-2.68-.03-.02-2.45-.94-2.47-3.5zm-1.88-5.32c.67-.81 1.12-1.94.99-3.07-1 .04-2.17.67-2.86 1.48-.55.63-1.08 1.8-0.94 2.91 1.12.09 2.15-.51 2.81-1.32z" />
                </svg>
                Login with Apple
              </Button>
            </div>

            <div className="mt-auto pt-6 text-center text-sm text-gray-500">
              Don't have an account? <a href="#" className="text-blue-600 hover:underline">Create one</a>
            </div>
          </div>
        </div>

        {/* Right Side: Blue Card panel */}
        <div className="hidden md:flex w-1/2 p-4 bg-white">
          <div className="w-full h-full bg-[#1c64e8] rounded-3xl p-12 lg:p-16 flex flex-col relative overflow-hidden shadow-inner">
            <div className="relative z-10 text-white mb-8">
              <h2 className="text-3xl lg:text-4xl font-semibold mb-3 lg:pr-10">Command Your Supply Chain with Confidence</h2>
              <p className="text-blue-100/90 text-sm lg:text-base leading-relaxed pr-8 font-light">
                From vendor onboarding to invoice automation — SupplierSpot simplifies every detail.
              </p>
            </div>

            <div className="relative z-10 flex-1 flex items-center justify-center">
              {/* Dashboard Mockup Image */}
              <div className="w-[120%] -mr-24 shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-white">
                <img
                  src="/dashboard_mockup.png"
                  alt="Dashboard Preview"
                  className="w-full h-auto object-cover opacity-95 mix-blend-normal"
                />
              </div>
            </div>

            <div className="relative z-10 mt-8">
              <p className="text-white/90 text-sm leading-relaxed italic lg:pr-12 font-light">
                "From tracking to reporting, SupplierSpot simplifies it all. Game-changer for our workflow."
              </p>
              <p className="text-white/70 text-xs mt-2">— Alex T., Procurement Lead at GlobalTrade</p>
            </div>

            {/* Carousel dots */}
            <div className="absolute bottom-12 right-12 flex gap-2">
              <div className="w-6 h-1.5 bg-white rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
            </div>

            {/* Abstract Background pattern / gradient elements */}
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl mix-blend-overlay"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
