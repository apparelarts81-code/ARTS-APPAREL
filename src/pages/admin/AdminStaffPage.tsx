import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { isDemoMode, supabase } from '../../lib/supabase';

interface StaffUser {
  email: string;
  name: string;
  role: 'owner' | 'staff';
}

const STORAGE_KEY_DEMO_STAFF = 'arts_demo_staff_directory';

const INITIAL_DEMO_STAFF: StaffUser[] = [
  { email: 'owner@artsapparel.com', name: 'Muhammad Usman (Owner)', role: 'owner' },
  { email: 'staff@artsapparel.com', name: 'Bilal Ahmad (Staff)', role: 'staff' },
];

export const AdminStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStaff = async () => {
    setIsLoading(true);
    if (!isDemoMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email, full_name, role')
          .in('role', ['owner', 'staff']);

        if (error) {
          setFeedback({
            type: 'error',
            message: `Could not load staff directory from database: ${error.message}. (Documented in FOLLOW_UP_REQUIRED.md)`,
          });
          setStaffList([]);
        } else {
          setStaffList(
            (data || []).map((p: any) => ({
              email: p.email,
              name: p.full_name || 'Staff Member',
              role: p.role,
            }))
          );
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Network error connecting to database: ${err?.message || err}`,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Demo Mode
    if (isDemoMode) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_DEMO_STAFF);
        if (saved) {
          setStaffList(JSON.parse(saved));
        } else {
          setStaffList(INITIAL_DEMO_STAFF);
        }
      } catch {
        setStaffList(INITIAL_DEMO_STAFF);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    if (!isDemoMode && supabase) {
      setIsLoading(true);
      try {
        // Call documented owner RPC: set_user_role(p_email, p_role)
        const { error } = await supabase.rpc('set_user_role', {
          p_email: cleanEmail,
          p_role: 'staff',
        });

        if (error) {
          setFeedback({
            type: 'error',
            message: `Authoritative role update failed: ${error.message}. Ensure the user exists in profiles and you are signed in with the Owner role.`,
          });
        } else {
          setFeedback({
            type: 'success',
            message: `Successfully granted Staff role to ${cleanEmail} in database.`,
          });
          setNewEmail('');
          setNewName('');
          await loadStaff();
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Failed to execute set_user_role: ${err?.message || err}`,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isDemoMode) {
      const updated: StaffUser[] = [
        ...staffList,
        { email: cleanEmail, name: newName.trim() || 'Staff Member', role: 'staff' },
      ];
      setStaffList(updated);
      try {
        localStorage.setItem(STORAGE_KEY_DEMO_STAFF, JSON.stringify(updated));
      } catch {}
      setFeedback({
        type: 'success',
        message: `[DEMO MODE] Added ${cleanEmail} to local test staff list.`,
      });
      setNewEmail('');
      setNewName('');
    }
  };

  const handleDemote = async (email: string) => {
    setFeedback(null);
    if (!isDemoMode && supabase) {
      setIsLoading(true);
      try {
        const { error } = await supabase.rpc('set_user_role', {
          p_email: email,
          p_role: 'customer',
        });

        if (error) {
          setFeedback({
            type: 'error',
            message: `Demotion failed: ${error.message}.`,
          });
        } else {
          setFeedback({
            type: 'success',
            message: `Demoted ${email} back to standard Customer role.`,
          });
          await loadStaff();
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Failed to revoke staff role: ${err?.message || err}`,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isDemoMode) {
      const updated = staffList.filter((s) => s.email !== email);
      setStaffList(updated);
      try {
        localStorage.setItem(STORAGE_KEY_DEMO_STAFF, JSON.stringify(updated));
      } catch {}
      setFeedback({
        type: 'success',
        message: `[DEMO MODE] Removed ${email} from local test staff.`,
      });
    }
  };

  return (
    <AdminLayout ownerOnly={true}>
      <div className="space-y-6 max-w-4xl">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Staff Role Management</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Authoritative role assignments executed through PostgreSQL RPC `set_user_role` (Owner Only)
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded text-xs border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-red-950/80 border-red-800 text-red-200'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Add staff form */}
        <form onSubmit={handleAddStaff} className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold text-white">Promote Registered User to Staff</h3>
          <p className="text-neutral-400">
            The employee must first register a customer account with this email. Supabase RPC `set_user_role` will update their profile securely.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Staff Member Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="employee@artsapparel.com"
              required
              disabled={isLoading}
            />
            <Input
              label="Staff Name / Title (Optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Asad Tailoring Lead"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading} disabled={isLoading}>
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
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-500">
                    {isLoading ? 'Loading staff records...' : 'No staff accounts found.'}
                  </td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.email}>
                    <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                    <td className="py-3 px-4">{s.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.role === 'owner'
                            ? 'bg-[#E31B23]/20 text-[#FF4D55] border border-[#E31B23]'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.role !== 'owner' ? (
                        <button
                          type="button"
                          onClick={() => handleDemote(s.email)}
                          disabled={isLoading}
                          className="text-xs text-red-400 hover:text-red-300 underline disabled:opacity-50"
                        >
                          Demote to Customer
                        </button>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">Primary Owner</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
