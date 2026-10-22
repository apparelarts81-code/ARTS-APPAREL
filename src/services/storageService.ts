import { isDemoMode, supabase } from '../lib/supabase';

export const storageService = {
  // Compress images to max 1600px client-side before uploading
  async compressImage(file: File, maxWidth = 1600): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = (err) => reject(err);
    });
  },

  async uploadPaymentProof(orderId: string, file: File): Promise<{ path: string; url: string }> {
    const compressed = await this.compressImage(file);
    const fileName = `${orderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.storage.from('payment-proofs').upload(fileName, compressed);
      if (!error && data) {
        return { path: data.path, url: URL.createObjectURL(compressed) };
      }
    }

    // In demo or fallback mode, generate blob URL for immediate preview
    return { path: fileName, url: URL.createObjectURL(compressed) };
  },

  async uploadProductImage(productId: string, file: File): Promise<{ path: string; url: string }> {
    const compressed = await this.compressImage(file);
    const fileName = `${productId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, compressed);
      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
        return { path: data.path, url: publicUrlData.publicUrl };
      }
    }

    return { path: fileName, url: URL.createObjectURL(compressed) };
  },
};
