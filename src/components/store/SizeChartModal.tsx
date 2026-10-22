import React from 'react';
import { Modal } from '../ui/Modal';
import { SizeChart } from '../../types/database';
import { DEMO_SIZE_CHARTS } from '../../demo/demoData';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
}) => {
  const charts: SizeChart[] = DEMO_SIZE_CHARTS.filter((s) => s.category_id === categoryId);
  const displayCharts = charts.length > 0 ? charts : DEMO_SIZE_CHARTS.slice(0, 5);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${categoryName} — Size Guide`} maxWidth="lg">
      <div className="space-y-4 text-xs">
        <p className="text-neutral-400">
          All measurements are in centimeters (cm). For the most comfortable fit, compare against your well-fitted tailored shirts or shalwar kameez.
        </p>

        <div className="overflow-x-auto border border-neutral-800 rounded-[6px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 border-b border-neutral-800 text-neutral-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Chest (cm)</th>
                <th className="py-3 px-4">Waist (cm)</th>
                <th className="py-3 px-4">Length (cm)</th>
                <th className="py-3 px-4">Height (cm)</th>
                <th className="py-3 px-4">Weight (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
              {displayCharts.map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{row.size_label}</td>
                  <td className="py-3 px-4">{row.chest_cm ?? '—'}</td>
                  <td className="py-3 px-4">{row.waist_cm ?? '—'}</td>
                  <td className="py-3 px-4">{row.length_cm ?? '—'}</td>
                  <td className="py-3 px-4">
                    {row.height_min_cm && row.height_max_cm
                      ? `${row.height_min_cm}–${row.height_max_cm}`
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {row.weight_min_kg && row.weight_max_kg
                      ? `${row.weight_min_kg}–${row.weight_max_kg}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-neutral-900/60 p-3.5 rounded border border-neutral-800 text-[11px] text-neutral-400">
          <strong className="text-white block mb-1">How to Measure:</strong>
          <span>Chest: Measure around the fullest part of your chest under armpits. Length: Measure from top of shoulder collar seam straight down to hemline.</span>
        </div>
      </div>
    </Modal>
  );
};
