import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login, isDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/account');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-white space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Customer Login</h1>
        <p className="text-xs text-neutral-400">
          Access saved addresses, past bespoke orders, and wishlist
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-4">
        {error && (
          <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-200 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
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

        <div className="flex items-center justify-between text-xs pt-1">
          <Link to="/forgot-password" className="text-neutral-400 hover:text-white underline">
            Forgot password?
          </Link>
          <Link to="/signup" className="text-[#E31B23] hover:underline font-medium">
            Create an Account
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full uppercase font-bold" isLoading={isLoading}>
          Sign In
        </Button>
      </form>
    </div>
  );
};
