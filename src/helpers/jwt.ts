// helpers/jwt.ts
import type { SignOptions } from 'jsonwebtoken';

const SHORT_UNITS = ['ms','s','m','h','d','w','y'] as const;
const LONG_UNITS = [
  'millisecond','milliseconds',
  'sec','secs','second','seconds',
  'min','mins','minute','minutes',
  'hour','hours',
  'day','days',
  'week','weeks',
  'year','years',
] as const;

/**
 * Coerce env string to a valid jsonwebtoken expiresIn:
 * - number => seconds
 * - string => ms-compatible duration (e.g., '30s', '2 days', '1h', '7d', '1y')
 * Falls back if invalid or non-positive.
 */
export function toExpiresIn(
  v: string | undefined,
  fallback: SignOptions['expiresIn']
): SignOptions['expiresIn'] {
  if (!v) return fallback;

  const raw = v.trim();

  // Pure numeric => seconds (as number)
  if (/^\d+$/.test(raw)) {
    const secs = Number(raw);
    return secs > 0 ? secs : fallback;
  }

  // Normalize internal spacing and case for unit checks
  const normalized = raw.replace(/\s+/g, ' ').toLowerCase();

  // Match short forms like "30s", "1h", "7d", allowing optional space: "30 s"
  const shortRe = new RegExp(
    String.raw`^\d+\s*(?:${SHORT_UNITS.join('|')})$`
  );

  // Match long forms like "2 days", "1 year", "10 minutes"
  const longRe = new RegExp(
    String.raw`^\d+\s+(?:${LONG_UNITS.join('|')})$`
  );

  if (shortRe.test(normalized) || longRe.test(normalized)) {
    // Remove extra spaces so '30 s' -> '30s'; long forms can remain spaced
    const compact =
      normalized.replace(/^(\d+)\s+(ms|s|m|h|d|w|y)$/, '$1$2');
    return compact as SignOptions['expiresIn'];
  }

  return fallback;
}
