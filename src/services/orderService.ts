import { Order, OrderItem, PaymentMethod } from '../types/database';
import { DEMO_ORDERS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';
import { normalizePhone } from '../lib/format';
import { catalogService } from './catalogService';

export interface PlaceOrderInput {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  items: Array<{
    product_id: string;
    variant_id: string;
    product_name: string;
    size?: string;
    color?: string;
    unit_price: number;
    quantity: number;
    line_total: number;
    image_url?: string;
  }>;
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  total: number;
  userId?: string | null;
  paymentProofUrl?: string;
  transactionId?: string;
}

const STORAGE_KEY_ORDERS = 'arts_apparel_orders';

function loadOrders(): Order[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_ORDERS];
}

let inMemoryOrders: Order[] = loadOrders();

function saveOrders() {
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(inMemoryOrders));
  } catch {}
}

export const orderService = {
  async placeOrder(input: PlaceOrderInput): Promise<{ order_id: string; order_number: string; total: number }> {
    const nextSeq = inMemoryOrders.length + 103;
    const orderNumber = `ARTS-${String(nextSeq).padStart(6, '0')}`;
    const orderId = `ord-${Date.now()}`;
    const normalizedPhone = normalizePhone(input.phone);

    const orderItems: OrderItem[] = input.items.map((i, idx) => ({
      id: `oi-${orderId}-${idx}`,
      order_id: orderId,
      product_id: i.product_id,
      variant_id: i.variant_id,
      product_name: i.product_name,
      size: i.size,
      color: i.color,
      unit_price: i.unit_price,
      quantity: i.quantity,
      line_total: i.line_total,
      image_url: i.image_url,
    }));

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: input.userId || null,
      customer_name: input.name,
      customer_phone: normalizedPhone,
      customer_email: input.email || null,
      shipping_city: input.city,
      shipping_address: input.address,
      notes: input.notes || null,
      subtotal: input.subtotal,
      discount_amount: input.discountAmount,
      delivery_charge: input.deliveryCharge,
      total: input.total,
      coupon_code: input.couponCode || null,
      payment_method: input.paymentMethod,
      payment_status: input.paymentProofUrl ? 'awaiting_verification' : 'pending',
      status: 'pending',
      courier_name: null,
      tracking_number: null,
      cancel_reason: null,
      admin_note: null,
      created_at: new Date().toISOString(),
      items: orderItems,
      history: [
        {
          id: `h-${Date.now()}`,
          order_id: orderId,
          status: 'pending',
          note: input.paymentProofUrl
            ? `Order placed via ${input.paymentMethod} with payment proof`
            : `Order placed via ${input.paymentMethod}`,
          created_at: new Date().toISOString(),
        },
      ],
      payment_proof: input.paymentProofUrl
        ? {
            id: `proof-${Date.now()}`,
            order_id: orderId,
            screenshot_path: input.paymentProofUrl,
            transaction_id: input.transactionId || null,
            amount: input.total,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        : null,
    };

    inMemoryOrders.unshift(newOrder);
    saveOrders();

    // Decrement stock for purchased variants
    for (const item of input.items) {
      if (item.variant_id) {
        await catalogService.decrementVariantStock(item.variant_id, item.quantity);
      }
    }

    if (!isDemoMode && supabase) {
      try {
        const { data, error } = await supabase.rpc('place_order', {
          p_name: input.name,
          p_phone: normalizedPhone,
          p_email: input.email || '',
          p_city: input.city,
          p_address: input.address,
          p_notes: input.notes || '',
          p_payment_method: input.paymentMethod,
          p_coupon_code: input.couponCode || '',
          p_items: input.items.map((it) => ({
            variant_id: it.variant_id,
            quantity: it.quantity,
          })),
        });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase place_order RPC failed, continuing with client state:', err);
      }
    }

    return {
      order_id: orderId,
      order_number: orderNumber,
      total: input.total,
    };
  },

  async trackOrder(orderNumber: string, phone: string): Promise<Order | null> {
    const cleanNumber = orderNumber.trim().toUpperCase();
    const cleanPhone = normalizePhone(phone);

    if (!isDemoMode && supabase) {
      try {
        const { data, error } = await supabase.rpc('track_order', {
          p_order_number: cleanNumber,
          p_phone: cleanPhone,
        });
        if (!error && data) return data as Order;
      } catch (err) {
        console.warn('Supabase track_order failed:', err);
      }
    }

    const found = inMemoryOrders.find(
      (o) =>
        o.order_number.toUpperCase() === cleanNumber &&
        normalizePhone(o.customer_phone) === cleanPhone
    );

    return found || null;
  },

  async addPaymentProof(orderNumber: string, phone: string, screenshotPath: string, transactionId?: string): Promise<boolean> {
    const cleanNumber = orderNumber.trim().toUpperCase();
    const cleanPhone = normalizePhone(phone);

    const order = inMemoryOrders.find(
      (o) =>
        o.order_number.toUpperCase() === cleanNumber &&
        normalizePhone(o.customer_phone) === cleanPhone
    );

    if (!order) return false;

    order.payment_proof = {
      id: `proof-${Date.now()}`,
      order_id: order.id,
      screenshot_path: screenshotPath,
      transaction_id: transactionId || null,
      amount: order.total,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    order.payment_status = 'awaiting_verification';

    if (!order.history) order.history = [];
    order.history.push({
      id: `h-${Date.now()}`,
      order_id: order.id,
      status: order.status,
      note: `Payment screenshot uploaded for verification (TID: ${transactionId || 'N/A'})`,
      created_at: new Date().toISOString(),
    });

    saveOrders();

    if (!isDemoMode && supabase) {
      try {
        await supabase.rpc('add_payment_proof', {
          p_order_number: cleanNumber,
          p_phone: cleanPhone,
          p_screenshot_path: screenshotPath,
          p_transaction_id: transactionId || '',
        });
      } catch (err) {
        console.warn('Supabase add_payment_proof RPC failed:', err);
      }
    }

    return true;
  },

  async cancelOrder(orderNumber: string, phone: string, reason: string): Promise<boolean> {
    const cleanNumber = orderNumber.trim().toUpperCase();
    const cleanPhone = normalizePhone(phone);

    const order = inMemoryOrders.find(
      (o) =>
        o.order_number.toUpperCase() === cleanNumber &&
        normalizePhone(o.customer_phone) === cleanPhone
    );

    if (!order) return false;
    if (order.status !== 'pending' && order.status !== 'confirmed') return false;

    order.status = 'cancelled';
    order.cancel_reason = reason;
    order.history?.push({
      id: `h-${Date.now()}`,
      order_id: order.id,
      status: 'cancelled',
      note: `Cancelled by customer: ${reason}`,
      created_at: new Date().toISOString(),
    });

    // Restore stock for cancelled items
    if (order.items) {
      for (const item of order.items) {
        if (item.variant_id) {
          await catalogService.restoreVariantStock(item.variant_id, item.quantity);
        }
      }
    }

    saveOrders();
    return true;
  },

  async getAllOrders(): Promise<Order[]> {
    return inMemoryOrders;
  },

  async getOrderById(id: string): Promise<Order | null> {
    return inMemoryOrders.find((o) => o.id === id) || null;
  },

  async updateOrderStatus(
    orderId: string,
    newStatus: any,
    note?: string,
    courier?: string,
    tracking?: string
  ): Promise<boolean> {
    const order = inMemoryOrders.find((o) => o.id === orderId);
    if (!order) return false;

    const oldStatus = order.status;
    order.status = newStatus;
    if (courier !== undefined) order.courier_name = courier;
    if (tracking !== undefined) order.tracking_number = tracking;

    if (!order.history) order.history = [];
    order.history.push({
      id: `h-${Date.now()}`,
      order_id: order.id,
      status: newStatus,
      note: note || `Status updated to ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    // Restore stock if transitioning to cancelled or returned
    if ((newStatus === 'cancelled' || newStatus === 'returned') && oldStatus !== 'cancelled' && oldStatus !== 'returned') {
      if (order.items) {
        for (const item of order.items) {
          if (item.variant_id) {
            await catalogService.restoreVariantStock(item.variant_id, item.quantity);
          }
        }
      }
    }

    saveOrders();
    return true;
  },

  async updatePaymentProofStatus(proofId: string, orderId: string, status: 'approved' | 'rejected', note?: string) {
    const order = inMemoryOrders.find((o) => o.id === orderId);
    if (order && order.payment_proof) {
      order.payment_proof.status = status;
      order.payment_proof.review_note = note || null;
      order.payment_status = status === 'approved' ? 'paid' : 'failed';
      saveOrders();
    }
  }
};
