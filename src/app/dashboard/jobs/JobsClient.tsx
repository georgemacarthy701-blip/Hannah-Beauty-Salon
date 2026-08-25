'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createJob, updateJobStatus, updateApplicationStatus } from '@/app/actions/jobs'
import { Briefcase, Users, Plus, CheckCircle, AlertCircle, Eye, EyeOff, MapPin, Calendar, RefreshCw, FileText, MessageSquare } from 'lucide-react'
import { getOrCreateConversation } from '@/app/actions/messages'

interface JobsClientProps {
  companyId: string
  initialJobs: any[]
}

export default function JobsClient({ companyId, initialJobs }: JobsClientProps) {
  const router = useRouter()

  // Tab View
  const [view, setView] = useState<'list' | 'create'>('list')

  // Expanded Job Applications
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // Success/Error States
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Electrical Work')
  const [jobType, setJobType] = useState('Full-time')
  const [location, setLocation] = useState('')
  const [budget, setBudget] = useState('')
  const [description, setDescription] = useState('')

  const categories = ['Electrical Work', 'Plumbing', 'Construction', 'Engineering', 'IT / Software', 'Creative / Design', 'Education']
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'One-off']

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('category', category)
    formData.append('jobType', jobType)
    formData.append('location', location)
    formData.append('budget', budget)
    formData.append('description', description)

    const res = await createJob(formData)
    if (res.success) {
      setSuccess('Job posting published successfully!')
      setTitle('')
      setLocation('')
      setBudget('')
      setDescription('')
      setView('list')
      router.refresh()
    } else {
      setError(res.error || 'Failed to publish job.')
    }
    setLoading(false)
  }

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open'
    setError(null)
    setSuccess(null)

    const res = await updateJobStatus(jobId, nextStatus)
    if (res.success) {
      setSuccess(`Job listing marked as ${nextStatus}.`)
      router.refresh()
    } else {
      setError(res.error || 'Failed to update job status.')
    }
  }

  const handleAppStatusUpdate = async (appId: string, status: string) => {
    setError(null)
    setSuccess(null)

    const res = await updateApplicationStatus(appId, status)
    if (res.success) {
      setSuccess(`Applicant status updated to ${status}.`)
      router.refresh()
    } else {
      setError(res.error || 'Failed to update application status.')
    }
  }

  const handleChatWithCandidate = async (targetUserId: string) => {
    try {
      const res = await getOrCreateConversation(targetUserId)
      if (res && 'conversationId' in res && res.conversationId) {
        router.push(`/messages?conversationId=${res.conversationId}`)
      } else if (res && 'error' in res) {
        alert(res.error)
      }
    } catch (err: any) {
      console.error(err)
      alert('Failed to start chat thread.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Job Postings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Publish job advertisements and review applications</p>
        </div>
        <button
          onClick={() => setView(view === 'list' ? 'create' : 'list')}
          className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors"
        >
          {view === 'list' ? (
            <>
              <Plus className="h-4 w-4" />
              Publish New Job
            </>
          ) : (
            'Back to Job Manager'
          )}
        </button>
      </div>

      {/* Alert Banners */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create View */}
      {view === 'create' && (
        <form onSubmit={handleCreateJob} className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-6">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Job Listing Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Job Title</label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Solar Panel Installer, Office Accountant..."
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Salary / Budget (SLL)</label>
              <input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1500"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Job Type</label>
              <select
                id="jobType"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {jobTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="loc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Location</label>
              <input
                id="loc"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lumley, Freetown"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="desc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Job Description & Requirements</label>
            <textarea
              id="desc"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Outline responsibilities, tools required, experience details..."
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            Publish Job Opening
          </button>
        </form>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-4">
          {initialJobs.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
              <Briefcase className="h-10 w-10 mx-auto text-zinc-400 mb-2" />
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">No job openings created yet.</p>
            </div>
          ) : (
            initialJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      {job.title}
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        job.status === 'open'
                          ? 'border-emerald-500/20 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800'
                      }`}>
                        {job.status === 'open' ? 'Active' : 'Closed'}
                      </span>
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location_address}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        {job.budget > 0 ? `Le ${job.budget}` : 'TBD'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleJobStatus(job.id, job.status)}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-semibold hover:bg-zinc-50 transition-colors"
                    >
                      {job.status === 'open' ? 'Close Job' : 'Reopen'}
                    </button>
                    <button
                      onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                      className="flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      {expandedJobId === job.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      Applicants ({job.applications?.length})
                    </button>
                  </div>
                </div>

                {/* Expanded Applications list */}
                {expandedJobId === job.id && (
                  <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800 space-y-4">
                    <h4 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Applications Received</h4>

                    {job.applications?.length === 0 ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">No applicants have submitted requests for this opening yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {job.applications.map((app: any) => {
                          const prof = app.professional_details || {}
                          const profile = prof.profiles || {}

                          return (
                            <div
                              key={app.id}
                              className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/10 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/40 pb-3 dark:border-zinc-800/40">
                                <div className="flex gap-3 items-center">
                                  {profile.avatar_cloudinary_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={profile.avatar_cloudinary_url}
                                      alt={profile.full_name}
                                      className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                                      {profile.full_name?.[0] || 'P'}
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                                      <Link href={`/professionals/${profile.id}`} className="hover:text-emerald-500 transition-colors">
                                        {profile.full_name || 'Service Pro'}
                                      </Link>
                                      <span className="text-[10px] font-normal text-zinc-500">
                                        ({profile.age ? `${profile.age} yrs` : 'N/A'}, {profile.city})
                                      </span>
                                    </h5>
                                    <p className="text-[10px] font-semibold text-emerald-500">{prof.title}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleChatWithCandidate(profile.id)}
                                    className="rounded bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-1 text-[10px] font-bold shadow-sm transition-colors flex items-center gap-1 border border-zinc-200 dark:border-zinc-750 cursor-pointer"
                                    title="Send direct message"
                                  >
                                    <MessageSquare className="h-3 w-3 text-emerald-500" />
                                    <span>Message</span>
                                  </button>

                                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                                    app.status === 'hired'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                      : app.status === 'shortlisted'
                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                      : app.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                                  }`}>
                                    {app.status}
                                  </span>

                                  {app.status !== 'hired' && app.status !== 'rejected' && app.status !== 'withdrawn' && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleAppStatusUpdate(app.id, 'shortlisted')}
                                        className="rounded bg-amber-500 hover:bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition-colors"
                                      >
                                        Shortlist
                                      </button>
                                      <button
                                        onClick={() => handleAppStatusUpdate(app.id, 'hired')}
                                        className="rounded bg-emerald-500 hover:bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition-colors"
                                      >
                                        Hire
                                      </button>
                                      <button
                                        onClick={() => handleAppStatusUpdate(app.id, 'rejected')}
                                        className="rounded bg-rose-500 hover:bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition-colors"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-zinc-400 font-semibold block uppercase tracking-wider">Cover Note</span>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                  {app.cover_note || 'No cover note provided.'}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-zinc-400 font-semibold block uppercase tracking-wider">CV / Resume Attachment</span>
                                {app.cv_url ? (
                                  <div className="flex items-center justify-between rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 p-3 border border-emerald-500/10">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-emerald-500" />
                                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                        Resume_Attachment.pdf
                                      </span>
                                    </div>
                                    <a
                                      href={app.cv_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors flex items-center gap-1.5"
                                    >
                                      View / Download CV
                                    </a>
                                  </div>
                                ) : (
                                  <p className="text-xs text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    No CV attached.
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
