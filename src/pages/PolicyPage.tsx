import React from 'react';
import { useParams, Link } from 'react-router-dom';

export const PolicyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  let title = 'Store Policy';
  let content = <p>Policy details</p>;

  if (slug === 'shipping-returns') {
    title = 'Nationwide Shipping & 7-Day Returns Policy';
    content = (
      <div className="space-y-6 leading-relaxed text-neutral-300">
        <section className="space-y-2">
          <h3 className="font-serif text-lg font-bold text-white">1. Nationwide Delivery Coverage</h3>
          <p>
            ARTS APPAREL dispatches orders across all cities, towns, and villages in Pakistan through registered courier services (Trax, Leopard, TCS, M&P).
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Sadiqabad & Rahim Yar Khan:</strong> Same-day or 1-2 business days.</li>
            <li><strong>Major Metros (Lahore, Karachi, Islamabad, Multan, Faisalabad):</strong> 2-4 business days.</li>
            <li><strong>Rest of Pakistan:</strong> 3-5 business days.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-bold text-white">2. Free Delivery Threshold</h3>
          <p>
            Orders exceeding Rs. 10,000 qualify for completely FREE nationwide delivery. Standard delivery rates apply for orders below this amount based on city zone.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-bold text-white">3. 7-Day Return & Exchange Window</h3>
          <p>
            We take pride in our precision tailoring. If a garment does not fit as expected or possesses any manufacturing defect, you may request an exchange or return within 7 calendar days of delivery.
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Items must be unworn, unwashed, and returned in their original packaging with all tags attached.</li>
            <li>Return requests can be initiated directly from your account page or by contacting our team on WhatsApp (0305 8165623).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-serif text-lg font-bold text-white">4. Cash on Delivery (COD) Rules</h3>
          <p>
            For COD orders, customers pay the courier upon package arrival. Please have the exact payment amount ready to ensure timely delivery.
          </p>
        </section>
      </div>
    );
  } else if (slug === 'privacy') {
    title = 'Privacy & Data Protection Policy';
    content = (
      <div className="space-y-4 text-neutral-300 leading-relaxed">
        <p>
          At ARTS APPAREL, your privacy is treated with the highest confidentiality. We collect only information necessary to process your orders, facilitate deliveries, and offer personalized style advice.
        </p>
        <p>
          We will never sell, lease, or distribute your phone number, email, or delivery address to third-party advertisers. All customer data is encrypted and safeguarded.
        </p>
      </div>
    );
  } else if (slug === 'terms') {
    title = 'Terms & Conditions of Service';
    content = (
      <div className="space-y-4 text-neutral-300 leading-relaxed">
        <p>
          By visiting or purchasing from ARTS APPAREL, you agree to our standard terms of service. Prices are displayed in Pakistani Rupees (PKR) and include all applicable local taxes.
        </p>
        <p>
          We strive for exact representations of our garments, fabrics, and colors; slight tonal variations may occur due to photography lighting and mobile display resolutions.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-white space-y-8">
      <div className="border-b border-neutral-800 pb-4">
        <Link to="/" className="text-xs text-neutral-400 hover:text-white mb-2 block">
          ← Back to Home
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
          {title}
        </h1>
      </div>
      <div className="text-xs sm:text-sm">{content}</div>
    </div>
  );
};
