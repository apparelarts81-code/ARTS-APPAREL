import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface StaffUser {
  email: string;
  name: string;
  role: 'owner' | 'staff';
}

const STORAGE_KEY_STAFF = 'arts_apparel_staff';

const INITIAL_STAFF: StaffUser[] = [
  { email: 'owner@artsapparel.com', name: 'ARTS Store Owner', role: 'owner' },
  { email: 'staff@artsapparel.com', name: 'Order Processing Specialist', role: 'staff' },
];

export const AdminStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAFF);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_STAFF;
  });

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  const saveStaff = (updated: StaffUser[]) => {
    setStaffList(updated);
    try {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(updated));
    } catch {}
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const updated: StaffUser[] = [
      ...staffList,
      { email: newEmail.trim().toLowerCase(), name: newName.trim() || 'Staff Member', role: 'staff' },
    ];
    saveStaff(updated);
    setNewEmail('');
    setNewName('');
  };

  const handleDemote = (email: string) => {
    const updated = staffList.filter((s) => s.email !== email);
    saveStaff(updated);
  };

  return (
    <AdminLayout ownerOnly={true}>
      <div className="space-y-6 max-w-4xl">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Staff Role Management</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Grant or revoke store employee permissions by email (Owner Only)
          </p>
        </div>

        {/* Add staff form */}
        <form onSubmit={handleAddStaff} className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold text-white">Promote Registered User to Staff</h3>
          <p className="text-neutral-400">
            The employee must first register a normal customer account with this email address.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Staff Member Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="employee@artsapparel.com"
              required
            />
            <Input
              label="Staff Name / Title"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Asad Tailoring Lead"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              + Assign Staff Role
            </Button>
          </div>
        </form>

        {/* Staff list table */}
        <div className="bg-[#111111] rounded-[8px] border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-neutral-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-200">
              {staffList.map((s) => (
                <tr key={s.email}>
                  <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                  <td className="py-3 px-4">{s.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.role === 'owner' ? 'bg-[#E31B23]/20 text-[#FF4D55] border border-[#E31B23]' : 'bg-neutral-800 text-neutral-300'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {s.role !== 'owner' ? (
                      <button
                        onClick={() => handleDemote(s.email)}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Demote to Customer
                      </button>
                    ) : (
                      <span className="text-neutral-500 text-[11px]">Primary Owner</span>
                    )}
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
