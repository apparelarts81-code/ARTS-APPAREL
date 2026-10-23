import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    const res = await signup(email, password, name, phone);
    setIsLoading(false);

    if (res.success) {
      if (res.requiresEmailConfirmation) {
        setConfirmationPending(true);
      } else {
        navigate('/account');
      }
    } else {
      setError(res.error || 'Failed to create account');
    }
  };

  if (confirmationPending) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-white space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-600 mx-auto flex items-center justify-center text-emerald-400 text-2xl">
          ✉️
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Confirm Your Email</h1>
          <p className="text-xs text-neutral-300 leading-relaxed">
            We have sent a verification email to <strong className="text-white">{email}</strong>. Please click the confirmation link in the email to activate your account.
          </p>
        </div>
        <div className="pt-4">
          <Link to="/login">
            <Button variant="primary" size="md">
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-white space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Create an Account</h1>
        <p className="text-xs text-neutral-400">
          Join ARTS APPAREL for seamless ordering, saved bespoke sizes, and fast tracking
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-4">
        {error && (
          <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-200 text-xs">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Muhammad Usman"
          required
        />

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usman@example.com"
          required
        />

        <Input
          label="Mobile Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0305 8165623"
        />

        <Input
          label="Password (min 8 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <div className="text-xs text-neutral-400 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-[#E31B23] hover:underline font-medium">
            Sign In
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full uppercase font-bold" isLoading={isLoading}>
          Create Account
        </Button>
      </form>
    </div>
  );
};
