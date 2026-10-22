import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DeliveryRate } from '../../types/database';
import { deliveryService } from '../../services/deliveryService';
import { useSettings } from '../../context/SettingsContext';
import { formatPKR } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminDeliveryPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [rates, setRates] = useState<DeliveryRate[]>([]);
  const [defaultCharge, setDefaultCharge] = useState(String(settings.default_delivery_charge || 250));
  const [freeThreshold, setFreeThreshold] = useState(String(settings.free_delivery_threshold || 10000));
  const [newCity, setNewCity] = useState('');
  const [newCharge, setNewCharge] = useState('250');
  const [newDays, setNewDays] = useState('2-3 Days');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    const data = await deliveryService.getRates();
    setRates(data);
  };

  const handleSaveThresholds = () => {
    updateSettings({
      default_delivery_charge: parseFloat(defaultCharge) || 250,
      free_delivery_threshold: parseFloat(freeThreshold) || 10000,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim()) return;

    await deliveryService.addRate({
      city: newCity.trim(),
      charge: parseFloat(newCharge) || 0,
      estimated_days: newDays,
      is_active: true,
    });

    await loadRates();
    setNewCity('');
  };

  const handleToggle = async (rate: DeliveryRate) => {
    await deliveryService.updateRate(rate.id, { is_active: !rate.is_active });
    await loadRates();
  };

  return (
    <AdminLayout ownerOnly={true}>
      <div className="space-y-8 max-w-4xl">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Delivery Rates & Zones</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure city-wise delivery tariffs and free nationwide shipping threshold (Owner Only)
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded text-emerald-300 text-xs">
            Global delivery thresholds updated successfully!
          </div>
        )}

        {/* Global Thresholds */}
        <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold text-white">Global Thresholds</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Default Charge for Other Cities (PKR)"
              type="number"
              value={defaultCharge}
              onChange={(e) => setDefaultCharge(e.target.value)}
            />
            <Input
              label="Free Delivery Threshold (PKR)"
              type="number"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSaveThresholds}>
              Save Thresholds
            </Button>
          </div>
        </div>

        {/* Add City Form */}
        <form onSubmit={handleAddCity} className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold text-white">Add City Rate</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City Name"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="e.g. Gujrat"
              required
            />
            <Input
              label="Delivery Fee (PKR)"
              type="number"
              value={newCharge}
              onChange={(e) => setNewCharge(e.target.value)}
              required
            />
            <Input
              label="Estimated Days"
              value={newDays}
              onChange={(e) => setNewDays(e.target.value)}
              placeholder="2-3 Days"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="sm">
              + Add City
            </Button>
          </div>
        </form>

        {/* Rates Table */}
        <div className="bg-[#111111] rounded-[8px] border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-neutral-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Rate (PKR)</th>
                <th className="py-3 px-4">Est. Delivery</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-200">
              {rates.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-4 font-bold text-white">{r.city}</td>
                  <td className="py-3 px-4 font-mono">{formatPKR(r.charge)}</td>
                  <td className="py-3 px-4 text-neutral-400">{r.estimated_days}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.is_active ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                      {r.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggle(r.id)}
                      className="text-xs text-neutral-400 hover:text-white underline"
                    >
                      {r.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
