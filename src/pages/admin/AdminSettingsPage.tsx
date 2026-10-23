import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useSettings } from '../../context/SettingsContext';
import { StoreSettingsMap } from '../../types/database';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const AdminSettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState<StoreSettingsMap>(settings);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedMsg(false);
    setIsSaving(true);
    try {
      await updateSettings(form);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save store settings to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout ownerOnly={true}>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl text-xs text-white">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Store Configuration</h1>
            <p className="text-neutral-400 mt-1">
              Live business details, payment accounts, and announcement messages (Owner Only)
            </p>
          </div>
          <Button type="submit" variant="primary" size="md" isLoading={isSaving} disabled={isSaving}>
            Save Settings
          </Button>
        </div>

        {savedMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300">
            Settings updated successfully across the storefront!
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded text-red-300">
            {errorMsg}
          </div>
        )}


        {/* 1. Store Identity & Contact */}
        <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4">
          <h3 className="font-serif text-base font-bold text-white">1. Store Identity & Socials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Store Name"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              required
            />
            <Input
              label="WhatsApp Number (Digits only, e.g. 923058165623)"
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Support Phone"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            />
            <Input
              label="Official Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <Input
            label="Physical Store Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="TikTok URL"
              value={form.tiktok_url}
              onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
            />
            <Input
              label="Facebook URL"
              value={form.facebook_url}
              onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
            />
          </div>
        </div>

        {/* 2. Payment Accounts & Toggles */}
        <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-5">
          <h3 className="font-serif text-base font-bold text-white">2. Payment Accounts for Manual Checkout</h3>

          {/* JazzCash */}
          <div className="p-4 bg-black rounded border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-white">⚡ JazzCash Account</strong>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.jazzcash_enabled}
                  onChange={(e) => setForm({ ...form, jazzcash_enabled: e.target.checked })}
                  className="accent-[#E31B23]"
                />
                <span className="text-neutral-400">Enabled</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Account Title"
                value={form.jazzcash_account.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    jazzcash_account: { ...form.jazzcash_account, title: e.target.value },
                  })
                }
              />
              <Input
                label="Account Number"
                value={form.jazzcash_account.number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    jazzcash_account: { ...form.jazzcash_account, number: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Easypaisa */}
          <div className="p-4 bg-black rounded border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-white">🟢 Easypaisa Account</strong>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.easypaisa_enabled}
                  onChange={(e) => setForm({ ...form, easypaisa_enabled: e.target.checked })}
                  className="accent-[#E31B23]"
                />
                <span className="text-neutral-400">Enabled</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Account Title"
                value={form.easypaisa_account.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    easypaisa_account: { ...form.easypaisa_account, title: e.target.value },
                  })
                }
              />
              <Input
                label="Account Number"
                value={form.easypaisa_account.number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    easypaisa_account: { ...form.easypaisa_account, number: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Bank Account */}
          <div className="p-4 bg-black rounded border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-white">🏦 Bank Transfer Account</strong>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.bank_transfer_enabled}
                  onChange={(e) => setForm({ ...form, bank_transfer_enabled: e.target.checked })}
                  className="accent-[#E31B23]"
                />
                <span className="text-neutral-400">Enabled</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Bank Name"
                value={form.bank_account.bank_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bank_account: { ...form.bank_account, bank_name: e.target.value },
                  })
                }
              />
              <Input
                label="Account Title"
                value={form.bank_account.account_title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bank_account: { ...form.bank_account, account_title: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Account Number"
                value={form.bank_account.account_number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bank_account: { ...form.bank_account, account_number: e.target.value },
                  })
                }
              />
              <Input
                label="IBAN"
                value={form.bank_account.iban}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bank_account: { ...form.bank_account, iban: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* 3. Announcement Bar */}
        <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4">
          <h3 className="font-serif text-base font-bold text-white">3. Header Announcement Bar</h3>
          <Input
            label="Announcement Message (English)"
            value={form.announcement_en}
            onChange={(e) => setForm({ ...form, announcement_en: e.target.value })}
          />
          <Input
            label="Announcement Message (Urdu)"
            value={form.announcement_ur}
            onChange={(e) => setForm({ ...form, announcement_ur: e.target.value })}
            dir="rtl"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" variant="primary" size="lg">
            Save Store Settings
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};
