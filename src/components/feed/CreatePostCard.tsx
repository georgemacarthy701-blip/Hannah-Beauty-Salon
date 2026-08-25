'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Image as ImageIcon, Loader2, X, Send } from 'lucide-react'
import { uploadImage } from '@/app/actions/media'
import { createPost } from '@/app/actions/posts'
import { formatImageUrl } from '@/utils/image'

interface CreatePostCardProps {
  user: any
  onPostCreated: () => void
}

export default function CreatePostCard({ user, onPostCreated }: CreatePostCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
        <p className="text-zinc-600 dark:text-zinc-400 font-semibold mb-3">
          Sign in to share an update with the LeoneLink community.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/login"
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2 text-sm transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-5 py-2 text-sm transition-colors"
          >
            Join LeoneLink
          </Link>
        </div>
      </div>
    )
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setIsUploadingImage(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadImage(formData)

      if ('error' in res) {
        setError(res.error)
      } else if (res.url) {
        setImageUrl(res.url)
      }
    } catch (err: any) {
      setError(err.message || 'Image upload failed.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImageUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await createPost(content, imageUrl || undefined)
      if (res.error) {
        setError(res.error)
      } else {
        setContent('')
        setImageUrl(null)
        setImageFile(null)
        setIsOpen(false)
        onPostCreated()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create post.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const userAvatar = user.avatar_cloudinary_url || user.avatar_url || user.image || null

  return (
    <>
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-3">
        <div className="flex items-center gap-3">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formatImageUrl(userAvatar, { width: 96, height: 96, crop: 'fill' })}
              alt={user.full_name}
              className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
              {user.full_name?.[0] || 'U'}
            </div>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 rounded-full border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 px-4 py-2.5 text-left text-sm text-zinc-500 dark:text-zinc-400 transition-colors"
          >
            Start a post, share a milestone or update...
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-2 text-sm text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => {
              setIsOpen(true)
              setTimeout(() => fileInputRef.current?.click(), 100)
            }}
            className="flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-3 py-2 rounded-lg transition-colors text-emerald-500"
          >
            <ImageIcon className="h-5 w-5" />
            <span>Photo / Media</span>
          </button>
        </div>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Create a Post</h2>
              <button
                onClick={() => {
                  setIsOpen(false)
                  handleRemoveImage()
                }}
                className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-3">
              {userAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formatImageUrl(userAvatar, { width: 96, height: 96, crop: 'fill' })}
                  alt={user.full_name}
                  className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                  {user.full_name?.[0] || 'U'}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">{user.full_name}</h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{user.role || 'Professional'}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to talk about?"
                rows={5}
                className="w-full resize-none border-0 bg-transparent p-0 text-zinc-900 focus:outline-none focus:ring-0 dark:text-white placeholder-zinc-400 text-sm"
              />

              {/* Image Preview / Upload Area */}
              {isUploadingImage && (
                <div className="flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 bg-zinc-50 dark:bg-zinc-800/30">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                    <span className="text-xs text-zinc-500">Uploading photo...</span>
                  </div>
                </div>
              )}

              {!isUploadingImage && imageUrl && (
                <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formatImageUrl(imageUrl, { width: 600, height: 400, crop: 'fill' })}
                    alt="Attached preview"
                    className="max-h-60 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {error && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg">
                  {error}
                </p>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-800 pt-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-2 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Add a photo"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">
                    {content.trim().length} chars
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingImage || !content.trim()}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-semibold px-5 py-2 text-sm transition-colors cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
