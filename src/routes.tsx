import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CrosshairLoader } from './components/ui/CrosshairLoader';

// Storefront pages
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then((m) => ({ default: m.CategoryPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PolicyPage = lazy(() => import('./pages/PolicyPage').then((m) => ({ default: m.PolicyPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Admin pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage').then((m) => ({ default: m.AdminProductFormPage })));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage })));
const AdminOrderPrintPage = lazy(() => import('./pages/admin/AdminOrderPrintPage').then((m) => ({ default: m.AdminOrderPrintPage })));
const AdminPaymentProofsPage = lazy(() => import('./pages/admin/AdminPaymentProofsPage').then((m) => ({ default: m.AdminPaymentProofsPage })));
const AdminReturnsPage = lazy(() => import('./pages/admin/AdminReturnsPage').then((m) => ({ default: m.AdminReturnsPage })));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage })));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage })));
const AdminMessagesPage = lazy(() => import('./pages/admin/AdminMessagesPage').then((m) => ({ default: m.AdminMessagesPage })));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage').then((m) => ({ default: m.AdminCouponsPage })));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage').then((m) => ({ default: m.AdminBannersPage })));
const AdminDeliveryPage = lazy(() => import('./pages/admin/AdminDeliveryPage').then((m) => ({ default: m.AdminDeliveryPage })));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })));
const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage').then((m) => ({ default: m.AdminStaffPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <CrosshairLoader label="Targeting Perfection" />
        </div>
      }
    >
      <Routes>
        {/* Storefront routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/orders" element={<AccountPage />} />
        <Route path="/account/orders/:orderNumber" element={<OrderDetailPage />} />
        <Route path="/account/addresses" element={<AccountPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/policy/:slug" element={<PolicyPage />} />

        {/* Admin portal routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/products/new" element={<AdminProductFormPage />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="/admin/orders/:id/print" element={<AdminOrderPrintPage />} />
        <Route path="/admin/payment-proofs" element={<AdminPaymentProofsPage />} />
        <Route path="/admin/returns" element={<AdminReturnsPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/customers" element={<AdminCustomersPage />} />
        <Route path="/admin/messages" element={<AdminMessagesPage />} />
        <Route path="/admin/coupons" element={<AdminCouponsPage />} />
        <Route path="/admin/banners" element={<AdminBannersPage />} />
        <Route path="/admin/delivery" element={<AdminDeliveryPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/staff" element={<AdminStaffPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
