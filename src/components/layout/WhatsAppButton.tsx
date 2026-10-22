import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { STORE_CONSTANTS } from '../../lib/constants';

interface WhatsAppButtonProps {
  customMessage?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ customMessage }) => {
  const location = useLocation();
  const { settings } = useSettings();
  const isProductPage = location.pathname.startsWith('/product/');
  const msg = customMessage || 'Assalam o Alaikum! I would like to inquire about ARTS APPAREL tailoring.';
  const waNumber = settings.whatsapp_number || STORE_CONSTANTS.whatsapp_number;
  const link = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${isProductPage ? 'bottom-20 md:bottom-6' : 'bottom-6'} left-4 sm:left-6 z-40 group flex items-center gap-2.5 select-none`}
      aria-label="Chat on WhatsApp"
    >
      <div className="relative w-12 h-12 rounded-full bg-black border border-neutral-700 group-hover:border-[#E31B23] shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105">
        {/* White WhatsApp Icon */}
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-1.127-.061-.41-.133-.902-.3-1.579-.597-2.072-.911-3.418-3.003-3.522-3.141-.103-.138-.838-1.116-.838-2.127 0-1.011.53-1.506.719-1.713.188-.207.41-.258.547-.258.137 0 .274.002.394.007.127.006.297-.048.464.354.172.415.586 1.431.637 1.536.052.104.086.226.017.363-.069.138-.103.224-.206.345-.103.12-.217.269-.31.362-.104.104-.213.218-.092.425.121.207.538.887 1.155 1.436.793.707 1.462.926 1.669 1.029.207.104.327.086.447-.052.12-.138.515-.601.652-.808.138-.207.274-.172.464-.103.19.069 1.205.568 1.411.671.207.104.344.155.395.241.052.086.052.501-.092.906z" />
        </svg>
        {/* Pulsing red dot on-theme */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-[#E31B23] rounded-full border-2 border-black animate-ping" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-[#E31B23] rounded-full border-2 border-black" />
      </div>
      <span className="hidden sm:inline-block px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-semibold text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
        Order on WhatsApp
      </span>
    </a>
  );
};
