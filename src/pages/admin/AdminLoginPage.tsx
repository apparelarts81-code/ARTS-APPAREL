import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { isDemoMode } from '../../lib/supabase';

export const AdminLoginPage: React.FC = () => {
  const { login, role, isLoggedIn, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as staff or owner, go to dashboard
  React.useEffect(() => {
    if (isLoggedIn && (role === 'staff' || role === 'owner')) {
      navigate('/admin');
    }
  }, [isLoggedIn, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      // Check role
      const lower = email.trim().toLowerCase();
      const isAdminEmail = lower.includes('owner') || lower.includes('admin') || lower.includes('staff') || lower === 'artsapparel@gmail.com';
      if (!isAdminEmail && role === 'customer') {
        setErrorMsg('This account has no admin access. Please sign in with staff or owner credentials.');
        setIsLoading(false);
        return;
      }

      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSignIn = (roleType: 'owner' | 'staff') => {
    setEmail(roleType === 'owner' ? 'owner@artsapparel.com' : 'staff@artsapparel.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white relative">
      {/* Background Subtle Crosshair Accent */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
        <div className="w-[500px] h-[500px] rounded-full border border-white" />
        <div className="w-[300px] h-[300px] rounded-full border border-white absolute" />
      </div>

      <div className="w-full max-w-md bg-[#111111] p-8 rounded-[8px] border border-neutral-800 shadow-2xl relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo showTagline={false} />
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#E31B23]">
            Administrative Terminal
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-white">
            Staff & Owner Sign In
          </h1>
          <p className="text-xs text-neutral-400">
            Secure command center for orders, inventory, and operations
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Staff / Owner Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@artsapparel.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Access Portal
          </Button>
        </form>

        {/* Quick Credentials Filler for Authorized Personnel */}
        <div className="pt-4 border-t border-neutral-800 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block text-center">
            Authorized Portal Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSignIn('owner')}
              className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-white font-medium transition-colors text-center"
            >
              Fill Owner Email
            </button>
            <button
              type="button"
              onClick={() => handleQuickSignIn('staff')}
              className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 font-medium transition-colors text-center"
            >
              Fill Staff Email
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};
