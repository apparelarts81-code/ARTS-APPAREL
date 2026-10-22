import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/login'), 2500);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-white space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Set New Password</h1>
        <p className="text-xs text-neutral-400">
          Enter a strong secure password for your account.
        </p>
      </div>

      <div className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-4">
        {success ? (
          <div className="text-center space-y-3">
            <span className="text-2xl text-emerald-400">✓</span>
            <p className="text-xs text-neutral-200">
              Password updated successfully! Redirecting to sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-200 text-xs">
                {error}
              </div>
            )}
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="lg" className="w-full uppercase font-bold">
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
