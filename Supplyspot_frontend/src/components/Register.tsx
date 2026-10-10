import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { API_CONFIG } from '../constants';

interface RegisterData {
  name: string;
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Mirrors validatePassword in the backend's middleware/auth.js
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: p => /[a-z]/.test(p) },
  { label: 'One number', test: p => /\d/.test(p) },
  { label: 'One special character', test: p => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
    if (name === 'email') setEmailTaken(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.name.trim().length < 2) {
      errors.name = 'Please enter your full name';
    }
    if (formData.companyName.trim().length < 2) {
      errors.companyName = 'Please enter your company name';
    }
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!EMAIL_PATTERN.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    const failedRule = PASSWORD_RULES.find(rule => !rule.test(formData.password));
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (failedRule) {
      errors.password = 'Password does not meet all the requirements below';
    }
    if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setEmailTaken(false);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          companyName: formData.companyName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        throw new Error(`Server returned an invalid response (Status ${response.status}). Please ensure the backend is running.`);
      }

      if (!response.ok) {
        if (response.status === 409) {
          setEmailTaken(true);
          setFieldErrors(prev => ({ ...prev, email: 'An account with this email already exists' }));
          return;
        }
        if (response.status === 400 && Array.isArray(data.details) && data.details.length > 0) {
          // express-validator errors carry a field name; password-strength errors are plain strings
          const serverErrors: Record<string, string> = {};
          for (const detail of data.details) {
            if (typeof detail === 'string') {
              serverErrors.password = serverErrors.password || detail;
            } else if (detail.path || detail.param) {
              const field = detail.path || detail.param;
              serverErrors[field] = serverErrors[field] || `Please check your ${field === 'companyName' ? 'company name' : field}`;
            }
          }
          setFieldErrors(prev => ({ ...prev, ...serverErrors }));
          throw new Error(data.error || 'Please fix the highlighted fields.');
        }
        if (response.status === 429) {
          throw new Error('Too many attempts. Please wait a few minutes and try again.');
        }
        throw new Error(data.error || data.message || `Sign up failed (Status ${response.status}).`);
      }

      // Registration returns a token, so sign the user straight in
      login(data.data.accessToken, data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name: string, extra = '') =>
    `h-11 ${extra} ${fieldErrors[name] ? 'border-red-500' : ''}`;

  const renderFieldError = (name: string) =>
    fieldErrors[name] ? <p className="text-xs text-red-500 mt-1">{fieldErrors[name]}</p> : null;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f4f6f8] p-6 lg:p-12 font-sans overflow-hidden">
      <div className="w-full h-full max-w-[1600px] bg-white rounded-3xl shadow-2xl flex overflow-hidden">
        {/* Left Side: Registration Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col relative bg-white overflow-y-auto">
          <div className="mb-6">
            <Logo size="md" />
          </div>

          <div className="max-w-[420px] mx-auto w-full flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Create your SupplierSpot account</h1>
            <p className="text-gray-500 text-sm mb-6 text-center px-4">
              Set up your company to start collaborating on RFQs, purchase orders and invoices.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={fieldClass('name')}
                  disabled={loading}
                />
                {renderFieldError('name')}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">Company name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  autoComplete="organization"
                  placeholder="Acme Supplies Ltd."
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={fieldClass('companyName')}
                  disabled={loading}
                />
                {renderFieldError('companyName')}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Work email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="johnsmith@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={fieldClass('email')}
                  disabled={loading}
                />
                {renderFieldError('email')}
                {emailTaken && (
                  <p className="text-xs text-gray-600">
                    <Link to="/login" className="text-blue-600 hover:underline">Sign in instead</Link>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={fieldClass('password', 'pr-10')}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
                {renderFieldError('password')}
                {formData.password && (
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                    {PASSWORD_RULES.map(rule => {
                      const ok = rule.test(formData.password);
                      return (
                        <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={fieldClass('confirmPassword')}
                  disabled={loading}
                />
                {renderFieldError('confirmPassword')}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-2 text-center text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </div>
          </div>
        </div>

        {/* Right Side: Blue Card panel */}
        <div className="hidden md:flex w-1/2 p-4 bg-white">
          <div className="w-full h-full bg-[#1c64e8] rounded-3xl p-12 lg:p-16 flex flex-col relative overflow-hidden shadow-inner">
            <div className="relative z-10 text-white mb-8">
              <h2 className="text-3xl lg:text-4xl font-semibold mb-3 lg:pr-10">Join Your Buyers on One Platform</h2>
              <p className="text-blue-100/90 text-sm lg:text-base leading-relaxed pr-8 font-light">
                Respond to RFQs, track purchase orders and get paid faster with SupplierSpot.
              </p>
            </div>

            <div className="relative z-10 flex-1 flex items-center justify-center">
              <div className="w-[120%] -mr-24 shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-white">
                <img
                  src="/dashboard_mockup.png"
                  alt="Dashboard Preview"
                  className="w-full h-auto object-cover opacity-95 mix-blend-normal"
                />
              </div>
            </div>

            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl mix-blend-overlay"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
