'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { uploadImage } from '@/app/actions/media'
import { createProduct } from '@/app/actions/products'
import { formatImageUrl } from '@/utils/image'

interface AddProductModalProps {
  onClose: () => void
  onProductCreated: () => void
}

export default function AddProductModal({ onClose, onProductCreated }: AddProductModalProps) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Hardware & Tools')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'Electronics',
    'Hardware & Tools',
    'Construction Materials',
    'Fashion',
    'Home Goods',
    'Other'
  ]

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !price || !category || !location || !imageUrl) {
      setError('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('price', price)
      formData.append('category', category)
      formData.append('location', location)
      formData.append('description', description)
      formData.append('imageUrl', imageUrl)

      const res = await createProduct(formData)

      if (res.error) {
        setError(res.error)
      } else {
        onProductCreated()
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to list product.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-205 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Post a Product for Sale</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Heavy Duty Power Drill, Cement Bags"
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                Price (Le) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Location *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Lumley, Freetown"
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Description / Specifications
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about condition, sizes, brands, specifications..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Product Image *
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {isUploadingImage ? (
              <div className="flex items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 bg-zinc-50 dark:bg-zinc-800/30">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                  <span className="text-xs text-zinc-500">Uploading photo...</span>
                </div>
              </div>
            ) : imageUrl ? (
              <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formatImageUrl(imageUrl, { width: 500, height: 300, crop: 'fill' })}
                  alt="Product preview"
                  className="max-h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600 rounded-xl p-8 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/20 dark:hover:bg-zinc-800/40 transition-colors gap-2 text-zinc-500"
              >
                <Upload className="h-6 w-6 text-emerald-500" />
                <span className="text-xs font-semibold">Select and upload a product photo</span>
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-850 px-5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage || !imageUrl}
              className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-semibold px-6 py-2 text-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Publish Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
