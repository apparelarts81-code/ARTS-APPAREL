import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Banner } from '../../types/database';
import { bannerService } from '../../services/bannerService';

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    bannerService.getBanners(true).then(setBanners).catch((err) => {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load banners.' });
    });
  }, []);

  const handleToggle = async (id: string) => {
    setFeedback(null);
    try {
      await bannerService.toggleBanner(id);
      const updated = await bannerService.getBanners(true);
      setBanners(updated);
      setFeedback({ type: 'success', message: 'Banner status updated successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update banner in database.' });
    }
  };

  return (
    <AdminLayout ownerOnly={true}>
      <div className="space-y-6">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Homepage Hero Banners</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Control the visual hero carousel on the home storefront (Owner Only)
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


        <div className="space-y-4">
          {banners.map((b) => (
            <div key={b.id} className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between text-xs">
              <div className="flex gap-4 items-center">
                <img
                  src={b.image_url}
                  alt={b.title_en}
                  className="w-28 h-20 object-cover rounded bg-neutral-900 border border-neutral-800 shrink-0"
                />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">{b.title_en}</h4>
                  <p className="font-serif text-neutral-400 text-xs">{b.title_ur}</p>
                  <span className="text-[11px] text-neutral-500">Destination: {b.link_url}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.is_active ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                  {b.is_active ? 'Active' : 'Hidden'}
                </span>
                <button
                  onClick={() => handleToggle(b.id)}
                  className="text-xs text-neutral-300 hover:text-white underline"
                >
                  {b.is_active ? 'Hide Banner' : 'Activate Banner'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
