'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyToJob } from '@/app/actions/applications'
import { FileText, Send, Loader2 } from 'lucide-react'

interface ApplyFormProps {
  jobId: string
  isMock: boolean
}

export default function ApplyForm({ jobId, isMock }: ApplyFormProps) {
  const router = useRouter()
  const [coverNote, setCoverNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('jobId', jobId)
      formData.append('coverNote', coverNote)

      const res = await applyToJob(formData)
      if (res.success) {
        setSuccess(true)
        router.refresh()
      } else {
        setError(res.error || 'Failed to submit application.')
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
        <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Application Submitted!</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Your application has been received successfully.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
      <h3 className="font-bold text-lg">Apply for this Job</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="coverNote" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Cover Note / Message to Employer
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start pt-3 pl-3 text-zinc-400">
              <FileText className="h-5 w-5" />
            </div>
            <textarea
              id="coverNote"
              name="coverNote"
              required
              rows={4}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
              placeholder="Briefly explain why you are a good fit for this role, mentioning your skills and relevant experience..."
            />
          </div>
        </div>
        {isMock && (
          <p className="text-xs text-amber-500">
            * Note: This is a demo listing. Submitting will save the application if Database has equivalent entries.
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
