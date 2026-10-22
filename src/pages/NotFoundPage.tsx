import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { TieLine } from '../components/ui/TieLine';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-28 text-center text-white space-y-6">
      <TieLine height={40} />
      <span className="text-6xl font-serif font-black text-[#E31B23]">404</span>
      <h1 className="font-serif text-2xl font-bold">Page Not Found</h1>
      <p className="text-xs text-neutral-400">
        The garment or page you were searching for has moved or is no longer available.
      </p>
      <Link to="/" className="inline-block">
        <Button variant="primary" size="md">
          Return to ARTS Home
        </Button>
      </Link>
    </div>
  );
};
