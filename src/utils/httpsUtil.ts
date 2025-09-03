/**
 * Ensures a URL uses HTTPS protocol
 * ICD API requires HTTPS for all communication
 */
export function ensureHttps(url: string): string {
  if (!url) return url;
  
  // If URL already starts with https://, return as-is
  if (url.startsWith('https://')) {
    return url;
  }
  
  // If URL starts with http://, replace with https://
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  // If URL doesn't have a protocol, assume HTTPS
  if (!url.includes('://')) {
    return `https://${url}`;
  }
  
  // For any other protocol, replace with HTTPS
  return url.replace(/^[^:]+:\/\//, 'https://');
}
