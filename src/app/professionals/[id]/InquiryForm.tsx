'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendInquiry } from '@/app/actions/inquiries'
import { MessageSquare, Loader2 } from 'lucide-react'

interface InquiryFormProps {
  professionalId: string
}

export default function InquiryForm({ professionalId }: InquiryFormProps) {
  const router = useRouter()
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [message, setMessage] = useState('')
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
      formData.append('clientName', clientName)
      formData.append('clientPhone', clientPhone)
      formData.append('message', message)

      const res = await sendInquiry(formData)
      if (res.success) {
        setSuccess(true)
        setClientName('')
        setClientPhone('')
        setMessage('')
        router.refresh()
      } else {
        setError(res.error || 'Failed to send inquiry.')
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
        <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Request Sent!</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          The professional has been notified.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs font-semibold text-emerald-500 hover:underline"
        >
          Send another request
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-1.5">
        <MessageSquare className="h-5 w-5 text-emerald-500" />
        Book Services / Inquiry
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Send a direct service request to this professional. They will receive it in their notifications.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
            {error}
          </div>
        )}
        <div>
          <input
            type="text"
            name="clientName"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Your Name"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <input
            type="tel"
            name="clientPhone"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Your Phone Number"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <textarea
            name="message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide details about the job, location, budget, and timing..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Send Service Request'
          )}
        </button>
      </form>
    </div>
  )
}
