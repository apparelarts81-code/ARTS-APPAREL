import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-white space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-xs text-neutral-400">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      <div className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-4">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 text-xl">
              ✓
            </div>
            <p className="text-xs text-neutral-300">
              If an account matches <strong>{email}</strong>, a password reset link has been dispatched to your inbox.
            </p>
            <Link to="/login" className="inline-block">
              <Button variant="secondary" size="sm">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
            <Button type="submit" variant="primary" size="lg" className="w-full uppercase font-bold">
              Send Reset Link
            </Button>
            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-neutral-400 hover:text-white underline">
                Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
