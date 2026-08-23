/**
 * Utility helper to format image URLs.
 * Automatically handles HEIC format conversion and compression optimization via Cloudinary.
 */
export interface ImageOptions {
  width?: number
  height?: number
  crop?: string
  gravity?: string
}

export function formatImageUrl(url: string | null | undefined, options?: ImageOptions): string {
  if (!url) return ''
  
  if (url.includes('res.cloudinary.com')) {
    let cleanUrl = url
    
    // Replace .heic extension with .jpg so Cloudinary serves a browser-supported format
    if (url.toLowerCase().endsWith('.heic')) {
      cleanUrl = url.substring(0, url.lastIndexOf('.')) + '.jpg'
    }
    
    // Build transformation string
    let transformations = 'f_auto,q_auto'
    if (options) {
      if (options.crop) transformations += `,c_${options.crop}`
      if (options.gravity) transformations += `,g_${options.gravity}`
      if (options.width) transformations += `,w_${options.width}`
      if (options.height) transformations += `,h_${options.height}`
    }
    
    // Inject transformations for optimal compression and format selection
    if (!cleanUrl.includes('/upload/f_auto')) {
      cleanUrl = cleanUrl.replace('/upload/', `/upload/${transformations}/`)
    }
    
    return cleanUrl
  }
  
  return url
}
