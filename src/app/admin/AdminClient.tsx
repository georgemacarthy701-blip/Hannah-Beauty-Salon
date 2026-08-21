'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveReport, verifyCompany, deleteJobAdmin } from '@/app/actions/admin'
import { Shield, Bell, CheckCircle, AlertCircle, Users, Briefcase, FileText, Globe, Trash2, Check, X } from 'lucide-react'

interface AdminClientProps {
  metrics: {
    users: number
    jobs: number
    reports: number
    applications: number
  }
  reports: any[]
  companies: any[]
  jobs: any[]
}

export default function AdminClient({ metrics, reports, companies, jobs }: AdminClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'metrics' | 'reports' | 'companies' | 'jobs'>('metrics')

  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResolveReport = async (reportId: string, status: string) => {
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('reportId', reportId)
    formData.append('status', status)

    const res = await resolveReport(formData)
    if (res.success) {
      setSuccess(`Report status updated to ${status}.`)
      router.refresh()
    } else {
      setError(res.error || 'Failed to update report.')
    }
  }

  const handleVerifyCompany = async (companyId: string, currentVerified: boolean) => {
    setError(null)
    setSuccess(null)

    const nextVerified = !currentVerified
    const formData = new FormData()
    formData.append('companyId', companyId)
    formData.append('verified', nextVerified.toString())

    const res = await verifyCompany(formData)
    if (res.success) {
      setSuccess(`Company verification status updated.`)
      router.refresh()
    } else {
      setError(res.error || 'Failed to verify company.')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to permanently delete this job listing?')) return
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('jobId', jobId)

    const res = await deleteJobAdmin(formData)
    if (res.success) {
      setSuccess(`Job listing permanently removed from LeoneLink.`)
      router.refresh()
    } else {
      setError(res.error || 'Failed to delete job.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-red-500/10 p-3 text-red-500">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Admin CMS Portal</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Perform moderate checks, verify business accounts, and view metrics</p>
        </div>
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

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'metrics'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          System Metrics
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Reports Inbox
          {metrics.reports > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              {metrics.reports}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'companies'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Verify Companies
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'jobs'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Moderate Listings
        </button>
      </div>

      {/* Tab 1: System Metrics */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-2">
            <Users className="h-6 w-6 text-zinc-400" />
            <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Users</h4>
            <strong className="text-2xl font-black text-zinc-900 dark:text-white">{metrics.users} Profiles</strong>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-2">
            <Briefcase className="h-6 w-6 text-zinc-400" />
            <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Jobs</h4>
            <strong className="text-2xl font-black text-zinc-900 dark:text-white">{metrics.jobs} Postings</strong>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-2">
            <FileText className="h-6 w-6 text-zinc-400" />
            <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Applications</h4>
            <strong className="text-2xl font-black text-zinc-900 dark:text-white">{metrics.applications} Submissions</strong>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-2">
            <Bell className="h-6 w-6 text-zinc-400" />
            <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pending Reports</h4>
            <strong className="text-2xl font-black text-zinc-900 dark:text-white">{metrics.reports} Flagged</strong>
          </div>
        </div>
      )}

      {/* Tab 2: User Reports */}
      {activeTab === 'reports' && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Moderation Reports Inbox</h3>

          {reports.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No flags or reports submitted by users.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 uppercase">
                        {rep.target_type} Flag
                      </span>
                      <span className="text-xs text-zinc-400">
                        Status: <strong className="uppercase">{rep.resolved ? 'resolved' : 'pending'}</strong>
                      </span>
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-semibold">
                      Reason: "{rep.reason}"
                    </p>
                    <span className="text-[10px] text-zinc-500 block">
                      Reporter: {rep.profiles?.full_name || 'Anonymous'} &bull; Date: {new Date(rep.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {!rep.resolved && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'resolved')}
                        className="flex items-center gap-1 rounded bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'dismissed')}
                        className="flex items-center gap-1 rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Verify Companies */}
      {activeTab === 'companies' && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Employer Verification Portal</h3>

          {companies.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No corporate registrations found.</p>
          ) : (
            <div className="space-y-4">
              {companies.map((comp) => (
                <div
                  key={comp.id}
                  className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm"
                >
                  <div className="flex gap-3 items-center">
                    {comp.logo_cloudinary_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comp.logo_cloudinary_url}
                        alt={comp.company_name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                        {comp.company_name?.[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        {comp.company_name}
                        {comp.verified && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                            Verified
                          </span>
                        )}
                      </h4>
                      {comp.website && (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-500 flex items-center gap-0.5 hover:underline mt-0.5"
                        >
                          <Globe className="h-3 w-3" />
                          {comp.website}
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleVerifyCompany(comp.id, comp.verified)}
                    className={`rounded px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors ${
                      comp.verified
                        ? 'bg-zinc-600 hover:bg-zinc-700'
                        : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                  >
                    {comp.verified ? 'Revoke Verification' : 'Verify Company'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Moderate Listings */}
      {activeTab === 'jobs' && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Active Job Advertisements</h3>

          {jobs.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No job advertisements published.</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm"
                >
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      {job.title}
                      <span className="text-xs text-zinc-400">
                        Status: <strong className="uppercase">{job.status}</strong>
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Posted by: <strong>{job.company_details?.company_name || 'Anonymous'}</strong> &bull; Category: {job.category} &bull; Location: {job.location_address}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="flex items-center gap-1 rounded bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove Job
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
