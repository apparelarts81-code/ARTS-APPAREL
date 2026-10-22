import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../layout/BrandLogo';

interface AdminLayoutProps {
  children: React.ReactNode;
  ownerOnly?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, ownerOnly = false }) => {
  const { user, role, logout, isStaffOrOwner, isOwner } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If not logged in as staff or owner, redirect or show message
  if (!isStaffOrOwner) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-[#111111] p-8 rounded-[8px] border border-neutral-800 text-center space-y-4">
          <span className="text-3xl text-[#E31B23]">🔒</span>
          <h2 className="font-serif text-2xl font-bold">Admin Access Required</h2>
          <p className="text-xs text-neutral-400">
            This portal is restricted to ARTS APPAREL staff and store owners.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/admin/login" className="px-4 py-2 rounded bg-[#E31B23] text-white text-xs font-bold hover:bg-[#c9151c] transition-colors">
              Sign In to Admin Portal
            </Link>
            <Link to="/" className="px-4 py-2 rounded bg-neutral-800 text-white text-xs hover:bg-neutral-700 transition-colors">
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If page requires owner privileges and user is staff
  if (ownerOnly && !isOwner) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-[#111111] p-8 rounded-[8px] border border-neutral-800 text-center space-y-4">
          <span className="text-3xl text-amber-500">🛡️</span>
          <h2 className="font-serif text-2xl font-bold">Owner Access Required</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            You are logged in as <strong className="text-white uppercase">Staff</strong>. This section contains confidential store financials, vouchers, or system settings restricted to the store owner.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/admin" className="px-4 py-2 rounded bg-[#E31B23] text-white text-xs font-bold hover:bg-[#c9151c] transition-colors">
              Back to Dashboard
            </Link>
            <Link to="/admin/orders" className="px-4 py-2 rounded bg-neutral-800 text-white text-xs hover:bg-neutral-700 transition-colors">
              Manage Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: 'Dashboard', path: '/admin', icon: '📊', minRole: 'staff' },
    { label: 'Orders', path: '/admin/orders', icon: '📦', minRole: 'staff' },
    { label: 'Products', path: '/admin/products', icon: '👔', minRole: 'staff' },
    { label: 'Categories', path: '/admin/categories', icon: '📁', minRole: 'staff' },
    { label: 'Payment Proofs', path: '/admin/payment-proofs', icon: '💳', minRole: 'staff' },
    { label: 'Returns', path: '/admin/returns', icon: '🔄', minRole: 'staff' },
    { label: 'Customer Reviews', path: '/admin/reviews', icon: '⭐', minRole: 'staff' },
    { label: 'Customers', path: '/admin/customers', icon: '👥', minRole: 'staff' },
    { label: 'Messages', path: '/admin/messages', icon: '✉️', minRole: 'staff' },
    // Owner only items
    { label: 'Coupons', path: '/admin/coupons', icon: '🏷️', minRole: 'owner' },
    { label: 'Banners', path: '/admin/banners', icon: '🖼️', minRole: 'owner' },
    { label: 'Delivery Rates', path: '/admin/delivery', icon: '🚚', minRole: 'owner' },
    { label: 'Reports & Revenue', path: '/admin/reports', icon: '📈', minRole: 'owner' },
    { label: 'Staff Roles', path: '/admin/staff', icon: '🛡️', minRole: 'owner' },
    { label: 'Store Settings', path: '/admin/settings', icon: '⚙️', minRole: 'owner' },
  ];

  const allowedLinks = navLinks.filter((l) => (l.minRole === 'owner' ? isOwner : true));

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row text-white">
      {/* Sidebar Desktop */}
      <aside className="w-full md:w-64 bg-[#111111] border-r border-neutral-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <BrandLogo showTagline={false} />
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E31B23]/20 text-[#FF4D55] border border-[#E31B23]/40 px-2 py-0.5 rounded">
            {role}
          </span>
        </div>

        {/* User Info Strip */}
        <div className="px-5 py-3 border-b border-neutral-800/80 bg-neutral-900/40 text-[11px] text-neutral-400">
          <p className="truncate text-white font-medium">{user?.full_name || 'Staff User'}</p>
          <p className="truncate text-neutral-500 text-[10px]">{user?.email}</p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {allowedLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E31B23] text-white font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <span className="text-sm">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-800 space-y-2 text-xs">
          <Link
            to="/"
            className="flex items-center justify-between p-2 rounded bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
          >
            <span>🛍️ View Storefront</span>
            <span>→</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="w-full text-left p-2 rounded text-neutral-400 hover:text-red-400 transition-colors"
          >
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
};
