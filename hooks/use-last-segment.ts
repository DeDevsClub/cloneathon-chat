export function useLastSegment(url: string): string {
  // Remove any trailing slashes
  const cleanUrl = url.replace(/\/+$/, '');

  // Split the URL by '/'
  const segments = cleanUrl.split('/');

  // Return the last segment
  return segments[segments.length - 1];
}
