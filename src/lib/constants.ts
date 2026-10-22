import { OrderStatus, PaymentMethod, PaymentStatus } from '../types/database';

export const STORE_CONSTANTS = {
  name: 'ARTS APPAREL',
  category: "Men's Clothing Brand",
  whatsapp_number: '923058165623',
  phone_number: '0305 8165623',
  email: 'artsapparel@gmail.com',
  address: 'Club Road, Near New Cafe Sajawal, Sadiqabad, Pakistan',
  tiktok_url: 'https://tiktok.com/@artsapparel3',
  facebook_url: 'https://www.facebook.com/people/ARTS-Apparel/61583782181056/',
  currency: 'PKR',
  currency_symbol: 'Rs. ',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, { en: string; ur: string; color: string }> = {
  pending: { en: 'Pending', ur: 'زیر التواء', color: 'bg-[#9A9A9A]/20 text-[#9A9A9A] border-[#9A9A9A]' },
  confirmed: { en: 'Confirmed', ur: 'تصدیق شدہ', color: 'bg-white/10 text-white border-white/40' },
  processing: { en: 'Processing', ur: 'تیار کیا جا رہا ہے', color: 'bg-[#C77700]/20 text-[#FFB020] border-[#C77700]' },
  shipped: { en: 'Shipped', ur: 'بھیج دیا گیا', color: 'bg-[#E31B23]/20 text-[#FF4D55] border-[#E31B23]' },
  delivered: { en: 'Delivered', ur: 'پہنچ گیا', color: 'bg-[#1F8A4C]/20 text-[#34D399] border-[#1F8A4C]' },
  cancelled: { en: 'Cancelled', ur: 'منسوخ', color: 'bg-red-950/60 text-red-400 border-red-700' },
  returned: { en: 'Returned', ur: 'واپس ہوا', color: 'bg-[#161616] text-[#9A9A9A] border-neutral-700' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { en: string; ur: string }> = {
  cod: { en: 'Cash on Delivery (COD)', ur: 'کیش آن ڈیلیوری' },
  jazzcash: { en: 'JazzCash', ur: 'جاز کیش' },
  easypaisa: { en: 'Easypaisa', ur: 'ایزی پیسہ' },
  bank_transfer: { en: 'Bank Transfer', ur: 'بینک ٹرانسفر' },
  card: { en: 'Credit/Debit Card', ur: 'کریڈٹ/ڈیبٹ کارڈ' },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { en: string; ur: string }> = {
  pending: { en: 'Payment Pending', ur: 'ادائیگی باقی ہے' },
  awaiting_verification: { en: 'Awaiting Verification', ur: 'تصدیق کا انتظار' },
  paid: { en: 'Paid', ur: 'ادا شدہ' },
  failed: { en: 'Failed', ur: 'ناکام' },
  refunded: { en: 'Refunded', ur: 'واپس کیا گیا' },
};

// Allowed order transitions per PRD/Schema
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const SEED_CITIES = [
  'Sadiqabad',
  'Rahim Yar Khan',
  'Bahawalpur',
  'Multan',
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Hyderabad',
  'Sukkur',
  'Gujranwala',
  'Sialkot',
  'Peshawar',
  'Quetta',
];
