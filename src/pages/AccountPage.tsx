import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { Order, Address } from '../types/database';
import { formatPKR, formatDate } from '../lib/format';
import { ORDER_STATUS_LABELS } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const AccountPage: React.FC = () => {
  const { user, logout, isLoggedIn, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 'addr-1',
      user_id: user?.id || 'usr-demo',
      label: 'Home',
      full_name: user?.full_name || 'Muhammad Usman',
      phone: user?.phone || '0305 8165623',
      city: 'Sadiqabad',
      address_line: 'Club Road, Near New Cafe Sajawal',
      is_default: true,
      created_at: new Date().toISOString(),
    },
  ]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newName, setNewName] = useState(user?.full_name || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '0305 8165623');
  const [newCity, setNewCity] = useState('Sadiqabad');
  const [newAddressLine, setNewAddressLine] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    orderService.getAllOrders().then(setOrders);

    // Sync active tab with route
    if (location.pathname.includes('/addresses')) {
      setActiveTab('addresses');
    } else if (location.pathname.includes('/orders')) {
      setActiveTab('orders');
    }
  }, [isLoggedIn, location.pathname, navigate]);

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAddressLine.trim()) return;

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      user_id: user?.id || 'usr-demo',
      label: newLabel,
      full_name: newName,
      phone: newPhone,
      city: newCity,
      address_line: newAddressLine,
      is_default: addresses.length === 0,
      created_at: new Date().toISOString(),
    };

    setAddresses([...addresses, newAddr]);
    setShowAddAddress(false);
    setNewAddressLine('');
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        is_default: a.id === id,
      }))
    );
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-white">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#E31B23]">
            Customer Account
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            Welcome, {user?.full_name || 'Gentleman'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {user?.email} • Role: <strong className="text-white uppercase">{role}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(role === 'staff' || role === 'owner') && (
            <Link to="/admin">
              <Button variant="secondary" size="sm" className="border-amber-500/40 text-amber-300">
                Go to Admin Panel →
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`text-xs uppercase font-bold tracking-wider pb-2 transition-colors ${
            activeTab === 'orders' ? 'border-b-2 border-[#E31B23] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`text-xs uppercase font-bold tracking-wider pb-2 transition-colors ${
            activeTab === 'addresses' ? 'border-b-2 border-[#E31B23] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Saved Addresses ({addresses.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`text-xs uppercase font-bold tracking-wider pb-2 transition-colors ${
            activeTab === 'profile' ? 'border-b-2 border-[#E31B23] text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Personal Info
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 text-xs">
              <p>You have not placed any orders yet.</p>
              <Link to="/shop" className="text-[#E31B23] hover:underline block mt-2 font-bold">
                Start shopping now →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 bg-[#111111] border border-neutral-800 rounded-[8px] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-black text-base text-white">
                        {ord.order_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          ORDER_STATUS_LABELS[ord.status]?.color || 'border-neutral-700'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[ord.status]?.en || ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Date: {formatDate(ord.created_at)} • Destination: {ord.shipping_city} • Payment: {ord.payment_method.toUpperCase()}
                    </p>
                    <p className="text-xs text-neutral-300">
                      Items: {ord.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-serif font-black text-lg text-[#E31B23]">
                      {formatPKR(ord.total)}
                    </span>
                    <Link to={`/account/orders/${ord.order_number}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Your Saved Shipping Addresses</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddAddress(!showAddAddress)}
            >
              {showAddAddress ? 'Close Form' : '+ Add New Address'}
            </Button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4 text-xs max-w-xl">
              <h4 className="font-bold text-white text-sm">Add New Delivery Location</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Label (e.g. Home, Office)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  required
                />
                <Input
                  label="Recipient Full Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
                <Input
                  label="Mobile Number (Pakistan)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0305 1234567"
                  required
                />
                <Input
                  label="City"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Complete Street Address"
                    value={newAddressLine}
                    onChange={(e) => setNewAddressLine(e.target.value)}
                    placeholder="House / Street / Sector / Landmark"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddAddress(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Address
                </Button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-5 rounded bg-[#111111] border border-neutral-800 space-y-2 text-xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="bg-[#E31B23] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-white text-sm">{addr.full_name}</p>
                  <p className="text-neutral-300">{addr.address_line}</p>
                  <p className="text-neutral-400">{addr.city}, Pakistan</p>
                  <p className="text-neutral-400">Phone: {addr.phone}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-neutral-800/60 mt-2">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] text-neutral-400 hover:text-white"
                    >
                      Make Default
                    </button>
                  )}
                  {addresses.length > 1 && (
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-[11px] text-red-400 hover:text-red-300 ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-md bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold">Profile Details</h3>
          <div>
            <label className="text-neutral-400 block mb-1">Full Name</label>
            <p className="font-bold text-white text-sm">{user?.full_name}</p>
          </div>
          <div>
            <label className="text-neutral-400 block mb-1">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <label className="text-neutral-400 block mb-1">Registered Phone</label>
            <p className="text-white">{user?.phone || 'Not provided'}</p>
          </div>
        </div>
      )}
    </div>
  );
};
