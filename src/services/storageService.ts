import { isDemoMode, supabase } from '../lib/supabase';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const storageService = {
  isValidImageType(mimeType: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase());
  },

  isValidFileSize(fileSizeBytes: number, maxMb: number): boolean {
    return fileSizeBytes <= maxMb * 1024 * 1024;
  },

  // Compress images to max 1600px client-side before uploading
  async compressImage(file: File, maxWidth = 1600): Promise<Blob> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return file;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
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
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
    });
  },

  async uploadPaymentProof(orderId: string, file: File): Promise<{ path: string; url?: string }> {
    if (!this.isValidImageType(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are accepted for payment receipts.');
    }

    if (!this.isValidFileSize(file.size, 5)) {
      throw new Error('Payment screenshot file size must be less than 5 MB.');
    }

    const compressed = await this.compressImage(file);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${orderId}/${Date.now()}-${sanitizedName}`;

    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.storage.from('payment-proofs').upload(fileName, compressed, {
        contentType: 'image/webp',
        upsert: false,
      });

      if (error) {
        throw new Error(`Failed to upload payment receipt to storage: ${error.message}`);
      }

      if (!data?.path) {
        throw new Error('Upload succeeded but no storage path was returned.');
      }

      return { path: data.path };
    }

    if (isDemoMode) {
      // In explicit demo mode only, generate preview URL for mock testing
      return { path: `demo-proofs/${fileName}`, url: URL.createObjectURL(compressed) };
    }

    throw new Error('Storage service is not configured. Please verify Supabase storage settings.');
  },

  async uploadProductImage(productId: string, file: File): Promise<{ path: string; url: string }> {
    if (!this.isValidImageType(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are accepted for products.');
    }

    if (!this.isValidFileSize(file.size, 3)) {
      throw new Error('Product image file size must be less than 3 MB.');
    }

    const compressed = await this.compressImage(file);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${productId}/${Date.now()}-${sanitizedName}`;

    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, compressed, {
        contentType: 'image/webp',
        upsert: false,
      });

      if (error) {
        throw new Error(`Failed to upload product image to storage: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
      return { path: data.path, url: publicUrlData.publicUrl };
    }

    if (isDemoMode) {
      return { path: `demo-products/${fileName}`, url: URL.createObjectURL(compressed) };
    }

    throw new Error('Storage service is not configured. Please verify Supabase storage settings.');
  },
};

