export const patterns = {
  email: /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/,
  phone: /^1[3-9]\d{9}$/,
  idCard: /^\d{17}[\dXx]$/,
  url: /^https?:\/\/[^\s]+$/,
} as const;

export function isValidEmail(value: string): boolean {
  return patterns.email.test(value);
}

export function isValidPhone(value: string): boolean {
  return patterns.phone.test(value);
}

export function isValidIdCard(value: string): boolean {
  return patterns.idCard.test(value);
}

export function isValidUrl(value: string): boolean {
  return patterns.url.test(value);
}
