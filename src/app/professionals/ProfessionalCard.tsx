'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Users, X, ZoomIn } from 'lucide-react'
import { formatImageUrl } from '@/utils/image'

interface ProfessionalCardProps {
  prof: any
}

export default function ProfessionalCard({ prof }: ProfessionalCardProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const profile = prof.profiles || {}
  
  const avatarUrl = profile.avatar_cloudinary_url || profile.avatar_url || profile.image || null
  const displayImage = avatarUrl || profile.portfolio_items?.[0]?.image_url || null

  const handleCardClick = (e: React.MouseEvent) => {
    router.push(`/professionals/${prof.user_id || prof.id}`)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (displayImage) {
      setIsModalOpen(true)
    }
  }

  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40 cursor-pointer"
      >
        {/* Visual Preview container (clickable to open modal) */}
        <div 
          onClick={handleImageClick}
          className="relative w-full h-56 md:h-64 overflow-hidden rounded-t-2xl bg-slate-900 flex items-center justify-center group/img"
        >
          {displayImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formatImageUrl(displayImage, { width: 800 })}
                alt={profile.full_name || 'Professional Profile'}
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/img:scale-105 cursor-pointer"
              />
              <div className="absolute inset-0 bg-zinc-900/10 pointer-events-none"></div>
              <div className="absolute inset-0 bg-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 dark:bg-zinc-900/90 rounded-full p-2.5 shadow-md transform translate-y-2 group-hover/img:translate-y-0 transition-all duration-300">
                  <ZoomIn className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                </div>
              </div>
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
              <Users className="h-10 w-10 text-emerald-500/30" />
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={formatImageUrl(avatarUrl, { width: 96, height: 96, crop: 'fill' })}
                alt={profile.full_name}
                className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500/20"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                {profile.full_name?.[0] || 'P'}
              </div>
            )}
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                {profile.full_name || 'Service Pro'}
                <span className="text-xs font-normal text-zinc-500">({profile.age ? `${profile.age} yrs` : 'N/A'})</span>
              </h3>
              <p className="text-xs text-emerald-500 font-semibold">{prof.title}</p>
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">{prof.bio}</p>

          <div className="flex flex-wrap gap-1.5">
            {prof.skills?.map((skill: string) => (
              <span key={skill} className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 pt-0 mt-auto border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/10">
          <span className="flex items-center gap-1 font-medium">
            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="line-clamp-1">{profile.address ? `${profile.address}, ${profile.city || ''}` : 'Sierra Leone'}</span>
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 text-sm">
            Le {prof.hourly_rate}/hr
          </span>
        </div>
      </div>

      {/* Accessible Full Image Lightbox Modal */}
      {isModalOpen && displayImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative max-w-[90vw] max-h-[85vh] overflow-hidden rounded-lg shadow-2xl bg-zinc-950 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={formatImageUrl(displayImage)}
              alt={profile.full_name || 'High Resolution Display'}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl mx-auto"
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 rounded-full bg-black/50 hover:bg-black/75 p-2.5 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
