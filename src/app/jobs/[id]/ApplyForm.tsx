'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyToJob } from '@/app/actions/applications'
import { uploadImage } from '@/app/actions/media'
import { FileText, Send, Loader2, Paperclip, Trash2 } from 'lucide-react'

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

  // CV/Resume State
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvUrl, setCvUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.')
      return
    }

    setCvFile(file)
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadImage(formData)
      if ('error' in res) {
        setError(res.error)
        setCvFile(null)
      } else {
        setCvUrl(res.url)
      }
    } catch (err: any) {
      setError(err.message || 'File upload failed.')
      setCvFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setCvFile(null)
    setCvUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploading) {
      setError('Please wait for the resume upload to complete.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('jobId', jobId)
      formData.append('coverNote', coverNote)
      if (cvUrl) {
        formData.append('cvUrl', cvUrl)
      }

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
        {/* Optional CV/Resume Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Attach CV / Resume (Optional)
          </label>
          
          <div className="flex items-center gap-3">
            {!cvFile ? (
              <label className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-4 text-xs font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <Paperclip className="h-4 w-4 text-zinc-400" />
                Attach PDF, DOC, or DOCX (Max 5MB)
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileChange} 
                  className="sr-only" 
                  disabled={loading || uploading} 
                />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/60 w-full">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {cvFile.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                ) : (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-zinc-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove attachment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {isMock && (
          <p className="text-xs text-amber-500">
            * Note: This is a demo listing. Submitting will save the application if Database has equivalent entries.
          </p>
        )}
        <button
          type="submit"
          disabled={loading || uploading}
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
