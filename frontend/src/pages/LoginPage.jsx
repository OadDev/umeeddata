import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Eye, EyeSlash } from '@phosphor-icons/react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_fund-tracker-153/artifacts/q246pqjs_umee%20logo.jpg';
const BG_IMAGE = 'https://images.unsplash.com/photo-1582061330713-dd8fe329ebbf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxjb21tdW5pdHklMjBuYXR1cmUlMjBob3BlJTIwc3VubGlnaHR8ZW58MHx8fHwxNzc0OTg4MzMzfDA&ixlib=rb-4.1.0&q=85';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={BG_IMAGE}
          alt="Community hope"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#6AAF35]/80 to-transparent" />
        <div className="relative z-10 p-12 flex flex-col justify-end">
          <h1 className="text-4xl font-bold text-white mb-4">Umeed Now Foundation</h1>
          <p className="text-xl text-white/90">Campaign Finance Management System</p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#FAFAF9]">
        <Card className="w-full max-w-md border-stone-200 shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img src={LOGO_URL} alt="Umeed Now" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#1C1917]">Welcome Back</CardTitle>
            <CardDescription className="text-[#78716C]">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="login-error">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#44403C]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-stone-200 focus:ring-[#6AAF35] focus:border-[#6AAF35]"
                  data-testid="login-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#44403C]">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-stone-200 focus:ring-[#6AAF35] focus:border-[#6AAF35] pr-10"
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#44403C]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#6AAF35] hover:bg-[#5C982E] text-white"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-stone-100 border border-stone-200">
              <p className="text-xs text-[#78716C] mb-2 font-medium">Demo Credentials:</p>
              <p className="text-xs text-[#44403C]"><strong>Admin:</strong> admin@umeed.org / admin123</p>
              <p className="text-xs text-[#44403C]"><strong>User:</strong> user@umeed.org / user123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
