import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone, Building, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  phone: string;
  inviteCode: string;
}

interface InviteValidation {
  valid: boolean;
  reason?: string;
  role?: string;
  email?: string;
}

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export default function InviteSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phone: '',
    inviteCode: searchParams.get('invite') || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [inviteValidation, setInviteValidation] = useState<InviteValidation | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);

  // Validate invite code on mount and when it changes
  useEffect(() => {
    if (formData.inviteCode && formData.inviteCode.length === 8) {
      validateInviteCode();
    }
  }, [formData.inviteCode]);

  // Validate password as user types
  useEffect(() => {
    if (formData.password) {
      validatePasswordStrength(formData.password);
    }
  }, [formData.password]);

  const validateInviteCode = async () => {
    if (!formData.inviteCode || formData.inviteCode.length !== 8) {
      setInviteValidation(null);
      return;
    }

    setValidatingInvite(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/validate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: formData.inviteCode }),
      });

      const result = await response.json();
      
      if (result.success) {
        setInviteValidation(result.data);
        if (result.data.valid && result.data.email) {
          setFormData(prev => ({ ...prev, email: result.data.email || '' }));
        }
      } else {
        setInviteValidation({ valid: false, reason: result.error });
      }
    } catch (err) {
      setInviteValidation({ valid: false, reason: 'Failed to validate invite code' });
    } finally {
      setValidatingInvite(false);
    }
  };

  const validatePasswordStrength = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    setPasswordValidation({
      isValid: errors.length === 0,
      errors
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData(prev => ({ ...prev, inviteCode: value }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    if (!formData.inviteCode) {
      errors.inviteCode = ['Invite code is required'];
    } else if (!inviteValidation?.valid) {
      errors.inviteCode = ['Invalid invite code'];
    }

    if (!formData.name) {
      errors.name = ['Name is required'];
    } else if (formData.name.length < 2) {
      errors.name = ['Name must be at least 2 characters long'];
    }

    if (!formData.email) {
      errors.email = ['Email is required'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = ['Please enter a valid email address'];
    }

    if (!formData.password) {
      errors.password = ['Password is required'];
    } else if (!passwordValidation?.isValid) {
      errors.password = passwordValidation?.errors || ['Password does not meet requirements'];
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = ['Please confirm your password'];
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = ['Passwords do not match'];
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
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          inviteCode: formData.inviteCode,
          department: formData.department || undefined,
          phone: formData.phone || undefined
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Store token and user data
        localStorage.setItem('accessToken', result.data.accessToken);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        setSuccess('Account created successfully! Redirecting...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
        if (result.details) {
          // Handle validation errors
          const errors: Record<string, string[]> = {};
          result.details.forEach((detail: any) => {
            if (detail.path) {
              errors[detail.path] = [detail.msg];
            }
          });
          setFieldErrors(errors);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | null => {
    const errors = fieldErrors[fieldName];
    return errors && errors.length > 0 ? errors[0] : null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 bg-blue-600 rounded-full">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
          <CardDescription className="text-center">
            Join Supplier Spot with your invite code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Invite Code Section */}
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code *</Label>
              <div className="relative">
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  placeholder="Enter 8-character invite code"
                  value={formData.inviteCode}
                  onChange={handleInviteCodeChange}
                  className={`font-mono text-center text-lg tracking-widest ${
                    getFieldError('inviteCode') ? 'border-red-500' : 
                    inviteValidation?.valid ? 'border-green-500' : ''
                  }`}
                  disabled={loading}
                  maxLength={8}
                />
                {validatingInvite && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                )}
                {inviteValidation?.valid && (
                  <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {!validatingInvite && inviteValidation?.valid === false && (
                  <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {getFieldError('inviteCode') && (
                <p className="text-sm text-red-500">{getFieldError('inviteCode')}</p>
              )}
              {inviteValidation?.valid === false && inviteValidation.reason && (
                <p className="text-sm text-red-500">{inviteValidation.reason}</p>
              )}
              {inviteValidation?.valid && inviteValidation.role && (
                <p className="text-sm text-green-600">
                  ✅ Valid invite! You'll be registered as a {inviteValidation.role.replace('_', ' ')}
                </p>
              )}
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`pl-10 ${getFieldError('name') ? 'border-red-500' : ''}`}
                    disabled={loading || !inviteValidation?.valid}
                  />
                </div>
                {getFieldError('name') && (
                  <p className="text-sm text-red-500">{getFieldError('name')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${getFieldError('email') ? 'border-red-500' : ''}`}
                    disabled={loading || !inviteValidation?.valid || inviteValidation?.email}
                  />
                </div>
                {getFieldError('email') && (
                  <p className="text-sm text-red-500">{getFieldError('email')}</p>
                )}
                {inviteValidation?.email && (
                  <p className="text-sm text-gray-500">Email pre-filled from invite</p>
                )}
              </div>
            </div>

            {/* Optional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="department"
                    name="department"
                    type="text"
                    placeholder="Engineering"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={loading || !inviteValidation?.valid}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1-555-0123"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={loading || !inviteValidation?.valid}
                  />
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${getFieldError('password') ? 'border-red-500' : ''}`}
                    disabled={loading || !inviteValidation?.valid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="text-sm text-red-500">{getFieldError('password')}</p>
                )}
                {passwordValidation && !passwordValidation.isValid && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Password must contain:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index} className="text-red-500">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${getFieldError('confirmPassword') ? 'border-red-500' : ''}`}
                    disabled={loading || !inviteValidation?.valid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {getFieldError('confirmPassword') && (
                  <p className="text-sm text-red-500">{getFieldError('confirmPassword')}</p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !inviteValidation?.valid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
