'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/app/actions/reviews'
import { Star, Loader2 } from 'lucide-react'

interface ReviewFormProps {
  professionalId: string
}

export default function ReviewForm({ professionalId }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('professionalId', professionalId)
      formData.append('rating', rating)
      formData.append('comment', comment)

      const res = await submitReview(formData)
      if (res.success) {
        setSuccess(true)
        setRating('5')
        setComment('')
        router.refresh()
      } else {
        setError(res.error || 'Failed to submit review.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/20 p-6 dark:border-emerald-500/10 dark:bg-emerald-950/10 text-center space-y-2">
        <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Review Posted!</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Thank you for your feedback.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs font-semibold text-emerald-500 hover:underline"
        >
          Post another review
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-1.5">
        <Star className="h-5 w-5 text-emerald-500" />
        Submit a Review
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Select Rating</label>
          <select
            name="rating"
            required
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            <option value="5">5 Stars (Excellent)</option>
            <option value="4">4 Stars (Good)</option>
            <option value="3">3 Stars (Average)</option>
            <option value="2">2 Stars (Poor)</option>
            <option value="1">1 Star (Very Poor)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Write Feedback</label>
          <textarea
            name="comment"
            required
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your experience working with this professional..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Post Review'
          )}
        </button>
      </form>
    </div>
  )
}
