/**
 * Utility helper to format image URLs.
 * Automatically handles HEIC format conversion and compression optimization via Cloudinary.
 */
export function formatImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  if (url.includes('res.cloudinary.com')) {
    let cleanUrl = url
    
    // Replace .heic extension with .jpg so Cloudinary serves a browser-supported format
    if (url.toLowerCase().endsWith('.heic')) {
      cleanUrl = url.substring(0, url.lastIndexOf('.')) + '.jpg'
    }
    
    // Inject f_auto,q_auto transformations for optimal compression and format selection
    if (!cleanUrl.includes('/upload/f_auto')) {
      cleanUrl = cleanUrl.replace('/upload/', '/upload/f_auto,q_auto/')
    }
    
    return cleanUrl
  }
  
  return url
}
