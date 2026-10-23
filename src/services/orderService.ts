import { Order, OrderItem, PaymentMethod } from '../types/database';
import { DEMO_ORDERS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';
import { normalizePhone } from '../lib/format';
import { catalogService } from './catalogService';
import { storageService } from './storageService';

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
    product_name?: string;
    size?: string;
    color?: string;
    unit_price?: number;
    quantity: number;
    line_total?: number;
    image_url?: string;
  }>;
  subtotal?: number;
  discountAmount?: number;
  deliveryCharge?: number;
  total?: number;
  userId?: string | null;
  paymentProofFile?: File | null;
  paymentProofUrl?: string;
  transactionId?: string;
}

export interface PlaceOrderResult {
  order_id: string;
  order_number: string;
  total: number;
  proofUploadWarning?: string;
}

const STORAGE_KEY_ORDERS = 'arts_apparel_orders';

function loadDemoOrders(): Order[] {
  if (typeof window === 'undefined') return [...DEMO_ORDERS];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_ORDERS];
}

let inMemoryOrders: Order[] = loadDemoOrders();

function saveDemoOrders() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(inMemoryOrders));
  } catch {}
}

export function normalizePlaceOrderResponse(data: unknown): { order_id: string; order_number: string; total: number } {
  if (!data) {
    throw new Error('Authoritative order creation failed: Backend returned an empty response.');
  }

  let row: any = null;

  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error('Authoritative order creation failed: No order record returned by backend.');
    }
    if (data.length > 1) {
      throw new Error('Authoritative order creation failed: Ambiguous multiple order records returned.');
    }
    row = data[0];
  } else if (typeof data === 'object') {
    row = data;
  } else {
    throw new Error('Authoritative order creation failed: Unexpected response format from backend.');
  }

  if (!row || typeof row !== 'object') {
    throw new Error('Authoritative order creation failed: Invalid order record returned.');
  }

  const orderId = row.order_id || row.id;
  const orderNumber = row.order_number || row.orderNumber;
  const rawTotal = row.total ?? row.order_total;

  if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
    throw new Error('Authoritative order creation failed: Missing valid order identifier.');
  }

  if (!orderNumber || typeof orderNumber !== 'string' || orderNumber.trim() === '') {
    throw new Error('Authoritative order creation failed: Missing valid order number.');
  }

  const total = Number(rawTotal);
  if (isNaN(total) || total < 0) {
    throw new Error('Authoritative order creation failed: Invalid order total amount returned.');
  }

  return {
    order_id: String(orderId).trim(),
    order_number: String(orderNumber).trim(),
    total,
  };
}

export const orderService = {
  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    const normalizedPhone = normalizePhone(input.phone);

    // 1. Authoritative Backend Flow (Production Mode with Supabase)
    if (!isDemoMode && supabase) {
      // Call documented PostgreSQL RPC: place_order
      const { data, error } = await supabase.rpc('place_order', {
        p_name: input.name.trim(),
        p_phone: normalizedPhone,
        p_email: input.email?.trim() || '',
        p_city: input.city.trim(),
        p_address: input.address.trim(),
        p_notes: input.notes?.trim() || '',
        p_payment_method: input.paymentMethod,
        p_coupon_code: input.couponCode?.trim().toUpperCase() || '',
        p_items: input.items.map((it) => ({
          variant_id: it.variant_id,
          quantity: it.quantity,
        })),
      });

      if (error) {
        // Map known database errors into clear customer messages
        const msg = error.message || 'Failed to place order';
        if (msg.includes('OUT_OF_STOCK')) {
          throw new Error('One or more selected items are currently out of stock. Please adjust your cart.');
        }
        if (msg.includes('COUPON_INVALID')) {
          throw new Error('The applied voucher code is invalid or has expired.');
        }
        if (msg.includes('RATE_LIMITED')) {
          throw new Error('Too many orders placed recently. Please contact customer care via WhatsApp.');
        }
        if (msg.includes('PAYMENT_METHOD_DISABLED')) {
          throw new Error('The selected payment method is currently disabled. Please choose another option.');
        }
        throw new Error(msg);
      }

      // Safe normalization supporting RETURNS TABLE (array of 1 row) or JSON object
      const normalized = normalizePlaceOrderResponse(data);

      let proofUploadWarning: string | undefined;

      // If manual payment method with uploaded proof, persist to storage and record proof
      if (input.paymentMethod !== 'cod' && input.paymentProofFile) {
        try {
          const uploadRes = await storageService.uploadPaymentProof(normalized.order_id, input.paymentProofFile);
          const proofRes = await supabase.rpc('add_payment_proof', {
            p_order_number: normalized.order_number,
            p_phone: normalizedPhone,
            p_screenshot_path: uploadRes.path,
            p_transaction_id: input.transactionId?.trim() || '',
          });
          if (proofRes.error) {
            console.warn('add_payment_proof RPC error:', proofRes.error);
            proofUploadWarning = 'Your order was placed successfully! However, receipt verification could not be recorded automatically. Please upload your transfer receipt on the Track Order page.';
          }
        } catch (uploadErr: any) {
          console.warn('Payment proof upload error after order placement:', uploadErr);
          proofUploadWarning = 'Your order was placed successfully! However, receipt upload failed. Please upload your transfer receipt on the Track Order page.';
        }
      }

      return {
        order_id: normalized.order_id,
        order_number: normalized.order_number,
        total: normalized.total,
        proofUploadWarning,
      };
    }

    // 2. Demo Mode Flow (Only when explicit demo mode is active)
    if (isDemoMode) {
      const nextSeq = inMemoryOrders.length + 103;
      const orderNumber = `ARTS-${String(nextSeq).padStart(6, '0')}`;
      const orderId = `ord-${Date.now()}`;

      const computedSubtotal = input.subtotal ?? input.items.reduce((acc, it) => acc + (it.line_total || ((it.unit_price || 0) * it.quantity)), 0);
      const computedDiscount = input.discountAmount ?? 0;
      const computedDelivery = input.deliveryCharge ?? 250;
      const computedTotal = input.total ?? (computedSubtotal - computedDiscount + computedDelivery);

      const orderItems: OrderItem[] = input.items.map((i, idx) => ({
        id: `oi-${orderId}-${idx}`,
        order_id: orderId,
        product_id: i.product_id,
        variant_id: i.variant_id,
        product_name: i.product_name || 'Bespoke Garment',
        size: i.size,
        color: i.color,
        unit_price: i.unit_price || 0,
        quantity: i.quantity,
        line_total: i.line_total || ((i.unit_price || 0) * i.quantity),
        image_url: i.image_url,
      }));

      let proofPath = input.paymentProofUrl;
      if (input.paymentProofFile) {
        const demoUpload = await storageService.uploadPaymentProof(orderId, input.paymentProofFile);
        proofPath = demoUpload.path;
      }

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
        subtotal: computedSubtotal,
        discount_amount: computedDiscount,
        delivery_charge: computedDelivery,
        total: computedTotal,
        coupon_code: input.couponCode || null,
        payment_method: input.paymentMethod,
        payment_status: proofPath ? 'awaiting_verification' : 'pending',
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
            note: proofPath
              ? `[DEMO] Order placed via ${input.paymentMethod} with payment proof`
              : `[DEMO] Order placed via ${input.paymentMethod}`,
            created_at: new Date().toISOString(),
          },
        ],
        payment_proof: proofPath
          ? {
              id: `proof-${Date.now()}`,
              order_id: orderId,
              screenshot_path: proofPath,
              transaction_id: input.transactionId || null,
              amount: computedTotal,
              status: 'pending',
              created_at: new Date().toISOString(),
            }
          : null,
      };

      inMemoryOrders.unshift(newOrder);
      saveDemoOrders();

      // Decrement demo stock in memory only
      for (const item of input.items) {
        if (item.variant_id) {
          await catalogService.decrementVariantStock(item.variant_id, item.quantity);
        }
      }

      return {
        order_id: orderId,
        order_number: orderNumber,
        total: computedTotal,
      };
    }

    throw new Error('Database connection is not configured. Real orders cannot be placed.');
  },

  async trackOrder(orderNumber: string, phone: string): Promise<Order | null> {
    const cleanNumber = orderNumber.trim().toUpperCase();
    const cleanPhone = normalizePhone(phone);

    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.rpc('track_order', {
        p_order_number: cleanNumber,
        p_phone: cleanPhone,
      });

      if (error) {
        throw new Error(`Order tracking failed: ${error.message}`);
      }

      return (data as Order) || null;
    }

    if (isDemoMode) {
      const found = inMemoryOrders.find(
        (o) =>
          o.order_number.toUpperCase() === cleanNumber &&
          normalizePhone(o.customer_phone) === cleanPhone
      );
      return found || null;
    }

    return null;
  },

  async addPaymentProof(orderNumber: string, phone: string, screenshotPath: string, transactionId?: string): Promise<boolean> {
    const cleanNumber = orderNumber.trim().toUpperCase();
    const cleanPhone = normalizePhone(phone);

    if (!isDemoMode && supabase) {
      const { error } = await supabase.rpc('add_payment_proof', {
        p_order_number: cleanNumber,
        p_phone: cleanPhone,
        p_screenshot_path: screenshotPath,
        p_transaction_id: transactionId || '',
      });

      if (error) {
        throw new Error(`Failed to submit payment proof: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
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

      saveDemoOrders();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async cancelOrder(orderNumber: string, phone: string, reason: string): Promise<boolean> {
    const cleanNumber = orderNumber.trim().toUpperCase();
    const cleanPhone = normalizePhone(phone);

    if (!isDemoMode && supabase) {
      const { error } = await supabase.rpc('cancel_order', {
        p_order_number: cleanNumber,
        p_phone: cleanPhone,
        p_reason: reason.trim(),
      });

      if (error) {
        throw new Error(`Failed to cancel order: ${error.message}`);
      }
      // Note: Trigger orders_status_changes automatically restores variant stock on DB
      return true;
    }

    if (isDemoMode) {
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

      if (order.items) {
        for (const item of order.items) {
          if (item.variant_id) {
            await catalogService.restoreVariantStock(item.variant_id, item.quantity);
          }
        }
      }

      saveDemoOrders();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async getMyOrders(userId: string): Promise<Order[]> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*), history:order_status_history(*), payment_proof:payment_proofs(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }
      return data || [];
    }

    if (isDemoMode) {
      return inMemoryOrders.filter((o) => o.user_id === userId);
    }

    return [];
  },

  async getAllOrders(): Promise<Order[]> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*), history:order_status_history(*), payment_proof:payment_proofs(*)')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }
      return data || [];
    }

    if (isDemoMode) {
      return [...inMemoryOrders];
    }

    return [];
  },

  async getOrderById(id: string): Promise<Order | null> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*), history:order_status_history(*), payment_proof:payment_proofs(*)')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch order: ${error.message}`);
      }
      return data || null;
    }

    if (isDemoMode) {
      return inMemoryOrders.find((o) => o.id === id) || null;
    }

    return null;
  },

  async updateOrderStatus(
    orderId: string,
    newStatus: Order['status'],
    note?: string,
    courier?: string,
    tracking?: string
  ): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (courier !== undefined) updates.courier_name = courier;
      if (tracking !== undefined) updates.tracking_number = tracking;

      const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
      if (error) {
        throw new Error(`Failed to update order status: ${error.message}`);
      }

      if (note) {
        await supabase.from('order_status_history').insert([
          {
            order_id: orderId,
            status: newStatus,
            note,
          },
        ]);
      }
      return true;
    }

    if (isDemoMode) {
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

      if ((newStatus === 'cancelled' || newStatus === 'returned') && oldStatus !== 'cancelled' && oldStatus !== 'returned') {
        if (order.items) {
          for (const item of order.items) {
            if (item.variant_id) {
              await catalogService.restoreVariantStock(item.variant_id, item.quantity);
            }
          }
        }
      }

      saveDemoOrders();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async updatePaymentProofStatus(proofId: string, orderId: string, status: 'approved' | 'rejected', note?: string): Promise<void> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.rpc('review_payment_proof', {
        p_proof_id: proofId,
        p_status: status,
        p_note: note || '',
      });

      if (error) {
        throw new Error(`Failed to review payment proof: ${error.message}`);
      }
      return;
    }

    if (isDemoMode) {
      const order = inMemoryOrders.find((o) => o.id === orderId);
      if (order && order.payment_proof) {
        order.payment_proof.status = status;
        order.payment_proof.review_note = note || null;
        order.payment_status = status === 'approved' ? 'paid' : 'failed';
        saveDemoOrders();
      }
      return;
    }

    throw new Error('Database connection is not configured.');
  },
};
