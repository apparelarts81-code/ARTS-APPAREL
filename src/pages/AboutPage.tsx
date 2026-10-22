import React from 'react';
import { TieLine } from '../components/ui/TieLine';
import { STORE_CONSTANTS } from '../lib/constants';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12 text-white">
      {/* Brand Heading */}
      <div className="text-center space-y-4">
        <TieLine height={36} />
        <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#E31B23]">
          Our Craft & Heritage
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight">
          About ARTS APPAREL
        </h1>
        <p className="text-sm text-neutral-300 max-w-xl mx-auto leading-relaxed">
          Founded in Sadiqabad, Pakistan, ARTS APPAREL was created with a single ambition: to master the intersection of classical Pakistani menswear tailoring and contemporary sartorial sharpness.
        </p>
      </div>

      {/* Philosophy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-2">
          <span className="text-2xl text-[#E31B23]">🎯</span>
          <h3 className="font-serif text-base font-bold">Targeted Precision</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            From our iconic crosshair mark to our micro-stitched collars, every cut is aligned to accentuate gentlemanly posture.
          </p>
        </div>

        <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-2">
          <span className="text-2xl text-[#E31B23]">🧵</span>
          <h3 className="font-serif text-base font-bold">Indigenous Craftsmanship</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            We partner with master tailors in Punjab and Sindh who bring decades of specialized experience in Sherwanis and Kurta plackets.
          </p>
        </div>

        <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-2">
          <span className="text-2xl text-[#E31B23]">🇵🇰</span>
          <h3 className="font-serif text-base font-bold">All-Pakistan Reach</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Whether in Karachi, Lahore, Peshawar, or Sadiqabad, our nationwide courier logistics deliver our bespoke wardrobe directly to your doorstep.
          </p>
        </div>
      </div>

      {/* Physical Studio Address */}
      <div className="p-8 rounded-[8px] bg-[#141414] border border-neutral-800 space-y-3">
        <h3 className="font-serif text-xl font-bold">Visit Our Sadiqabad Studio</h3>
        <p className="text-xs text-neutral-300">
          <strong>Address:</strong> {STORE_CONSTANTS.address}
        </p>
        <p className="text-xs text-neutral-300">
          <strong>Contact:</strong> {STORE_CONSTANTS.phone_number} • WhatsApp: {STORE_CONSTANTS.whatsapp_number}
        </p>
      </div>
    </div>
  );
};
