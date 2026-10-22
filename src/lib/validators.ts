import { z } from 'zod';
import { isValidPakistaniPhone } from './format';

// 1. Pakistani phone validation schema
export const pakistaniPhoneSchema = z
  .string()
  .min(10, 'Phone number is required')
  .refine((val) => isValidPakistaniPhone(val), {
    message: 'Enter a valid Pakistani mobile number (e.g. 0305 8165623 or +923058165623)',
  });

// 2. Checkout form validation schema
export const checkoutFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  phone: pakistaniPhoneSchema,
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(8, 'Please enter a complete delivery address (street, house #, landmark)'),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['cod', 'jazzcash', 'easypaisa', 'bank_transfer', 'card']),
  transactionId: z.string().optional(),
});

// 3. User Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// 4. User Signup Schema
export const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: pakistaniPhoneSchema.optional().or(z.literal('')),
});

// 5. Contact Message Schema
export const contactMessageSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  phone: pakistaniPhoneSchema.optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message cannot exceed 2000 characters'),
});

// 6. Review Submission Schema
export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  comment: z.string().min(10, 'Review comment must be at least 10 characters').max(1000),
});

// 7. Address CRUD Schema
export const addressSchema = z.object({
  label: z.string().min(1, 'Address label is required (e.g. Home, Office)'),
  fullName: z.string().min(2, 'Recipient full name is required'),
  phone: pakistaniPhoneSchema,
  city: z.string().min(2, 'City is required'),
  addressLine: z.string().min(8, 'Complete address line is required'),
  isDefault: z.boolean().default(false),
});
