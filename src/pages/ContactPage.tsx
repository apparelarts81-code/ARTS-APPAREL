import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { STORE_CONSTANTS } from '../lib/constants';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

import { contactService } from '../services/contactService';

export const ContactPage: React.FC = () => {
  const { settings } = useSettings();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const address = settings.address || STORE_CONSTANTS.address;
  const phoneNumber = settings.phone_number || STORE_CONSTANTS.phone_number;
  const storeEmail = settings.email || STORE_CONSTANTS.email;
  const fbUrl = settings.facebook_url || STORE_CONSTANTS.facebook_url;
  const ttUrl = settings.tiktok_url || STORE_CONSTANTS.tiktok_url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setIsSending(true);
    await contactService.submitMessage({ name, phone, email, message });
    setSubmitted(true);
    setIsSending(false);
    setMessage('');
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 text-white space-y-12">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E31B23]">
          Get in Touch
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight">
          Contact ARTS APPAREL
        </h1>
        <p className="text-xs text-neutral-400">
          Have an inquiry about customized wedding orders, fabric selections, or courier tracking? We are here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Contact Form */}
        <div className="bg-[#111111] p-6 sm:p-8 rounded-[8px] border border-neutral-800 space-y-4">
          <h3 className="font-serif text-lg font-bold">Send an Official Message</h3>

          {submitted ? (
            <div className="p-6 bg-emerald-950/60 border border-emerald-800 rounded text-center space-y-3">
              <span className="text-3xl text-emerald-400">✓</span>
              <h4 className="font-bold text-white text-sm">Message Sent Successfully</h4>
              <p className="text-xs text-neutral-300">
                Thank you for contacting ARTS APPAREL. Our tailoring team will respond to your phone / email shortly.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
                Send Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Muhammad Tariq"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone / Mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0305 8165623"
                  required
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tariq@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full text-left">
                <label className="text-xs font-medium uppercase tracking-wider text-neutral-300">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your requirements, wedding dates, or tailoring inquiries..."
                  className="h-28 px-4 py-3 rounded-[6px] bg-[#161616] text-white border border-neutral-800 text-sm focus:outline-none focus:border-[#E31B23]"
                  required
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full uppercase font-bold">
                Submit Inquiry
              </Button>
            </form>
          )}
        </div>

        {/* Store Location & Direct Contacts */}
        <div className="space-y-6">
          <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-white">Studio Information</h3>

            <div className="space-y-3 text-neutral-300">
              <p className="flex items-start gap-3">
                <span className="text-[#E31B23] text-base shrink-0">📍</span>
                <div>
                  <strong className="text-white block">Physical Store Address</strong>
                  <span>{address}</span>
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E31B23] hover:underline block mt-1 font-semibold"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </p>

              <p className="flex items-start gap-3">
                <span className="text-[#E31B23] text-base shrink-0">📞</span>
                <div>
                  <strong className="text-white block">Direct Phone & WhatsApp</strong>
                  <span>{phoneNumber}</span>
                </div>
              </p>

              <p className="flex items-start gap-3">
                <span className="text-[#E31B23] text-base shrink-0">✉️</span>
                <div>
                  <strong className="text-white block">Official Email</strong>
                  <span>{storeEmail}</span>
                </div>
              </p>
            </div>
          </div>

          {/* Social Channels */}
          <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-3 text-xs">
            <h4 className="font-serif text-base font-bold text-white">Official Brand Channels</h4>
            <div className="flex flex-col gap-2">
              {fbUrl && (
                <a
                  href={fbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors"
                >
                  <span className="font-semibold text-white">Facebook: ARTS Apparel</span>
                  <span className="text-neutral-400">Follow →</span>
                </a>
              )}
              {ttUrl && (
                <a
                  href={ttUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors"
                >
                  <span className="font-semibold text-white">TikTok: @artsapparel3</span>
                  <span className="text-neutral-400">Watch →</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
