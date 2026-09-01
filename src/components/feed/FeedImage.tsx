'use client'

import { useState, useEffect } from 'react'
import { X, ZoomIn } from 'lucide-react'
import { formatImageUrl } from '@/utils/image'

interface FeedImageProps {
  src: string
  alt?: string
  className?: string
}

export default function FeedImage({ src, alt = 'Post attachment', className = '' }: FeedImageProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Prevent background scrolling and attach Escape key listener when lightbox is active
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const previewUrl = formatImageUrl(src, { width: 1000 })
  const fullResolutionUrl = formatImageUrl(src, { width: 2000 })

  return (
    <>
      {/* Feed Card Image Container */}
      <div
        onClick={() => setIsOpen(true)}
        className={`group relative w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-black/40 flex items-center justify-center cursor-pointer transition-all hover:border-zinc-300 dark:hover:border-zinc-700 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={alt}
          loading="lazy"
          className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Hover zoom indicator overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm">
            <ZoomIn className="h-3.5 w-3.5" />
            Click to expand
          </span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all duration-200 sm:p-6 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
            className="absolute top-4 right-4 z-50 rounded-full bg-zinc-800/80 p-2.5 text-zinc-300 shadow-lg transition-colors hover:bg-zinc-700 hover:text-white focus:outline-none cursor-pointer"
            title="Close image preview (Esc)"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Centered Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-full max-w-full items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fullResolutionUrl}
              alt={alt}
              className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl select-none"
            />
          </div>
        </div>
      )}
    </>
  )
}
