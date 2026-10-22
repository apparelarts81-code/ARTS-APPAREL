export function formatPKR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rs. 0';
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function normalizePhone(input: string): string {
  if (!input) return '';
  // Remove spaces, hyphens, plus signs
  let cleaned = input.replace(/[\s\-\+\(\)]/g, '');
  // If starts with 92, replace with 0
  if (cleaned.startsWith('92') && cleaned.length >= 12) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

export function isValidPakistaniPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Must be 11 digits starting with 03
  return /^03\d{9}$/.test(normalized);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
