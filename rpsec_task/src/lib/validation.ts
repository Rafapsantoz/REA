/** Shared input patterns used by the login forms and the demand dialog. */

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const LINK_PATTERN = /^(https?:\/\/)?[^\s.]+(\.[^\s]+)+$/i;

/** Adds the scheme when someone types "example.com". */
export function normalizeLink(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
