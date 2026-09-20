/**
 * Financial Profile Export Service
 * Supports exporting user financial profile data to CSV (Excel compatible with UTF-8 BOM)
 * and formatted JSON developer backup.
 * 
 * Includes OWASP formula-injection protection (prefixing '=', '+', '-', '@', '\t', '\r' with "'")
 * and filters out any session, token, or plan data.
 */

export const FORBIDDEN_EXPORT_KEYS = new Set([
  'access_token',
  'refresh_token',
  'jwt_token',
  'token',
  'session',
  'session_token',
  'plan',
  'user_plan',
  'password',
  'password_hash',
]);

/**
 * Escapes a single cell value according to RFC 4180 and protects against CSV formula injection.
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // Guard against CSV formula injection (OWASP):
  // Prefix any cell starting with '=', '+', '-', '@', tab, or CR with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // RFC 4180 quoting: If cell contains comma, double-quote, or newline,
  // wrap in double quotes and escape internal double quotes as ""
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Filters out forbidden sensitive keys (tokens, session, plan).
 */
export function filterSafeProfileData(profile: Record<string, any>): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const [key, value] of Object.entries(profile)) {
    if (!FORBIDDEN_EXPORT_KEYS.has(key.toLowerCase())) {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Exports profile data to CSV string with UTF-8 BOM and formula injection protection.
 */
export function exportProfileAsCsv(
  profile: Record<string, any>,
  columns?: readonly string[]
): string {
  const safeProfile = filterSafeProfileData(profile);
  const keys = (columns && columns.length > 0)
    ? columns.filter((k) => !FORBIDDEN_EXPORT_KEYS.has(k.toLowerCase()))
    : Object.keys(safeProfile);

  const headerRow = keys.map((k) => escapeCsvCell(k)).join(',');
  const valueRow = keys.map((k) => escapeCsvCell(safeProfile[k])).join(',');

  // UTF-8 BOM (\uFEFF) ensures Excel properly recognizes character encoding
  return `\uFEFF${headerRow}\r\n${valueRow}\r\n`;
}

/**
 * Exports profile data as pretty-printed JSON, omitting sensitive token/session data.
 */
export function exportProfileAsJson(profile: Record<string, any>): string {
  const safeProfile = filterSafeProfileData(profile);
  return JSON.stringify(safeProfile, null, 2);
}

/**
 * Generates export filename: moneymapper_profile_YYYY-MM-DD.csv/.json
 */
export function getExportFilename(extension: 'csv' | 'json', date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `moneymapper_profile_${yyyy}-${mm}-${dd}.${extension}`;
}

/**
 * Initiates browser file download for text/blob content.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
