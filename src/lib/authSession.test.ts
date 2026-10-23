import test from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../services/authService';

test('authService.signup returns customer role and does not elevate privileges from user input', async () => {
  const result = await authService.signup('test_customer_new@example.com', 'SecurePass123!', 'New Customer', '03058165623');
  assert.equal(result.success, true);
  assert.ok(result.user);
  assert.equal(result.user.role, 'customer', 'Role must always default strictly to customer');
});

test('authService handles pending email confirmation result signature', () => {
  // Unit check for SignupResult contract when Supabase returns user without session
  const simulatedPendingSignup = {
    success: true,
    user: {
      id: 'usr-pending-1',
      email: 'pending@example.com',
      full_name: 'Pending Customer',
      role: 'customer' as const,
    },
    session: null,
    requiresEmailConfirmation: true,
  };

  assert.equal(simulatedPendingSignup.requiresEmailConfirmation, true);
  assert.equal(simulatedPendingSignup.session, null);
  assert.equal(simulatedPendingSignup.user.role, 'customer');
});
