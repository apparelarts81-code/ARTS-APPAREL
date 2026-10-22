import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DEMO_SIZE_CHARTS } from '../../demo/demoData';
import { aiService } from '../../services/aiService';
import { useLanguage } from '../../i18n/LanguageProvider';

interface SizeRecommenderProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  onSelectSize: (size: string) => void;
}

export const SizeRecommender: React.FC<SizeRecommenderProps> = ({
  isOpen,
  onClose,
  categoryId,
  onSelectSize,
}) => {
  const { t } = useLanguage();
  const [height, setHeight] = useState<string>('174');
  const [weight, setWeight] = useState<string>('72');
  const [fit, setFit] = useState<'slim' | 'regular' | 'loose'>('regular');
  const [resultSize, setResultSize] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(height, 10);
    const w = parseInt(weight, 10);
    if (!h || !w) return;

    setIsLoading(true);

    // 1. Rule-based determination from size charts
    const charts = DEMO_SIZE_CHARTS.filter((s) => s.category_id === categoryId);
    const activeCharts = charts.length > 0 ? charts : DEMO_SIZE_CHARTS.slice(0, 5);

    let matched = activeCharts.find(
      (c) =>
        c.height_min_cm &&
        c.height_max_cm &&
        h >= c.height_min_cm &&
        h <= c.height_max_cm &&
        c.weight_min_kg &&
        c.weight_max_kg &&
        w >= c.weight_min_kg &&
        w <= c.weight_max_kg
    );

    let chosenSize = matched ? matched.size_label : 'M';

    // Adjust for fit preference
    if (fit === 'loose' && chosenSize === 'M') {
      chosenSize = 'L';
    } else if (fit === 'loose' && chosenSize === 'L') {
      chosenSize = 'XL';
    } else if (fit === 'slim' && chosenSize === 'L' && w < 75) {
      chosenSize = 'M';
    }

    setResultSize(chosenSize);

    // 2. Friendly explanation via AI endpoint
    try {
      const text = await aiService.explainSize(h, w, fit, chosenSize);
      setExplanation(text);
    } catch {
      setExplanation(
        `Based on ${h} cm and ${w} kg with a ${fit} preference, size ${chosenSize} offers the most tailored drape.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (resultSize) {
      onSelectSize(resultSize);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('size_recommender.title')} maxWidth="md">
      <form onSubmit={handleCalculate} className="space-y-5 text-xs text-white">
        <p className="text-neutral-400">
          {t('size_recommender.subtitle')}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('size_recommender.height')}
            type="number"
            min={130}
            max={220}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            required
          />
          <Input
            label={t('size_recommender.weight')}
            type="number"
            min={40}
            max={150}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-neutral-300 block mb-2">
            {t('size_recommender.fit_preference')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['slim', 'regular', 'loose'] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setFit(mode)}
                className={`py-2 px-3 rounded-[6px] border text-center transition-all ${
                  fit === mode
                    ? 'border-[#E31B23] bg-[#E31B23]/15 text-white font-bold'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {t(`size_recommender.${mode}`)}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
          {t('size_recommender.calculate')}
        </Button>

        {resultSize && (
          <div className="p-4 rounded-[8px] bg-neutral-900 border border-neutral-800 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 font-medium">{t('size_recommender.recommended_label')}</span>
              <span className="text-xl font-serif font-black text-[#E31B23] bg-black px-3 py-1 rounded border border-neutral-800">
                {resultSize}
              </span>
            </div>
            {explanation && (
              <p className="text-neutral-400 leading-relaxed text-[11px] border-t border-neutral-800 pt-2">
                {explanation}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full mt-2"
              onClick={handleApply}
            >
              Select Size {resultSize}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
};
