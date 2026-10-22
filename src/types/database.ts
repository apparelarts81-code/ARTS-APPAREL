export type UserRole = 'customer' | 'staff' | 'owner';
export type PreferredLanguage = 'en' | 'ur';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentMethod =
  | 'cod'
  | 'jazzcash'
  | 'easypaisa'
  | 'bank_transfer'
  | 'card';

export type PaymentStatus =
  | 'pending'
  | 'awaiting_verification'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentProofStatus = 'pending' | 'approved' | 'rejected';
export type ReturnRequestStatus = 'requested' | 'approved' | 'rejected' | 'completed';
export type CouponType = 'percent' | 'fixed';
export type ContactMessageStatus = 'new' | 'handled';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  preferred_language: PreferredLanguage;
  created_at: string;
  updated_at?: string;
}

export interface Address {
  id: string;
  user_id: string;
  label?: string; // 'Home' | 'Office'
  full_name: string;
  phone: string;
  city: string;
  address_line: string;
  is_default: boolean;
  created_at: string;
}

export interface BankAccountDetails {
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
}

export interface MobileAccountDetails {
  title: string;
  number: string;
}

export interface StoreSettingsMap {
  store_name: string;
  tagline_en: string;
  tagline_ur: string;
  whatsapp_number: string;
  phone_number: string;
  email: string;
  address: string;
  tiktok_url: string;
  facebook_url: string;
  instagram_url?: string;
  announcement_en: string;
  announcement_ur: string;
  currency: string;
  cod_enabled: boolean;
  jazzcash_enabled: boolean;
  easypaisa_enabled: boolean;
  bank_transfer_enabled: boolean;
  card_enabled: boolean;
  jazzcash_account: MobileAccountDetails;
  easypaisa_account: MobileAccountDetails;
  bank_account: BankAccountDetails;
  default_delivery_charge: number;
  free_delivery_threshold: number | null;
  low_stock_threshold: number;
  return_window_days: number;
}

export interface StoreSettingRow {
  key: string;
  value: any;
  updated_at?: string;
  updated_by?: string | null;
}

export interface Category {
  id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  description_en: string;
  description_ur: string;
  fabric: string;
  base_price: number;
  sale_price: number | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
  rating_avg: number;
  rating_count: number;
  sold_count: number;
  created_at: string;
  updated_at?: string;
  // Joined fields
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: Category;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  color_hex?: string;
  sku: string;
  price_override: number | null;
  stock_qty: number;
  is_active: boolean;
  created_at?: string;
}

export interface SizeChart {
  id: string;
  category_id: string;
  size_label: string;
  chest_cm?: number;
  waist_cm?: number;
  length_cm?: number;
  height_min_cm?: number;
  height_max_cm?: number;
  weight_min_kg?: number;
  weight_max_kg?: number;
  sort_order: number;
}

export interface Banner {
  id: string;
  title_en: string;
  title_ur: string;
  subtitle_en: string;
  subtitle_ur: string;
  image_url: string;
  mobile_image_url?: string;
  link_url?: string;
  button_text_en?: string;
  button_text_ur?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface DeliveryRate {
  id: string;
  city: string;
  charge: number;
  estimated_days: string;
  is_active: boolean;
  created_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_city: string;
  shipping_address: string;
  notes?: string | null;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  total: number;
  coupon_code?: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  courier_name?: string | null;
  tracking_number?: string | null;
  cancel_reason?: string | null;
  admin_note?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at?: string;
  // Relations
  items?: OrderItem[];
  history?: OrderStatusHistory[];
  payment_proof?: PaymentProof | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  size?: string;
  color?: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note?: string;
  changed_by?: string | null;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  screenshot_path: string;
  transaction_id?: string | null;
  amount?: number | null;
  status: PaymentProofStatus;
  review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string | null;
  reason: string;
  status: ReturnRequestStatus;
  staff_note?: string | null;
  created_at: string;
  updated_at?: string;
  order?: Order;
}

export interface Wishlist {
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment: string;
  is_approved: boolean;
  created_at: string;
  user_name?: string;
}

export interface ReviewSummary {
  product_id: string;
  summary_en: string;
  summary_ur: string;
  review_count: number;
  generated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
}
