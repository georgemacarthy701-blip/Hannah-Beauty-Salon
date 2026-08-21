'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveReport } from '@/app/actions/admin'
import { Users, Briefcase, FileText, ShieldAlert, CheckCircle, AlertCircle, Calendar, Shield } from 'lucide-react'

interface DashboardClientProps {
  metrics: {
    proUsers: number
    compUsers: number
    openJobs: number
    closedJobs: number
    totalApps: number
    pendingReports: number
    totalReports: number
  }
  recentUsers: any[]
  recentJobs: any[]
  recentApps: any[]
  reports: any[]
}

export default function DashboardClient({ metrics, recentUsers, recentJobs, recentApps, reports }: DashboardClientProps) {
  const router = useRouter()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const handleResolve = async (reportId: string) => {
    setResolvingId(reportId)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('reportId', reportId)
      formData.append('status', 'true') // Sets resolved to true

      const res = await resolveReport(formData)
      if (res.success) {
        setSuccess('Report resolved successfully.')
        router.refresh()
      } else {
        setError(res.error || 'Failed to resolve report.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">System metrics, recent activity feeds, and system moderation inbox.</p>
        </div>
      </div>

      {/* Toast Alert */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registered Users</span>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {metrics.proUsers + metrics.compUsers}
            </div>
            <div className="text-[10px] text-zinc-500 space-x-2">
              <span>{metrics.proUsers} Pros</span>
              <span>•</span>
              <span>{metrics.compUsers} Companies</span>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Jobs Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Jobs</span>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {metrics.openJobs}
            </div>
            <div className="text-[10px] text-zinc-500 space-x-2">
              <span>{metrics.closedJobs} closed</span>
            </div>
          </div>
          <div className="rounded-lg bg-teal-50 p-2 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        {/* Applications Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Applications</span>
            <div className="text-3xl font-black text-zinc-900 dark:text-white">
              {metrics.totalApps}
            </div>
            <div className="text-[10px] text-zinc-500">Total submitted proposals</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Flagged/Reports Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Flagged Content</span>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {metrics.pendingReports}
            </div>
            <div className="text-[10px] text-zinc-500">
              {metrics.totalReports} total reports filed
            </div>
          </div>
          <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Users */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-emerald-500" />
            Recent Registrations
          </h3>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No recent registrations</p>
            ) : (
              recentUsers.map(u => (
                <div key={u.id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{u.full_name}</p>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">{u.role}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-teal-500" />
            Recent Job Postings
          </h3>
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No recent jobs posted</p>
            ) : (
              recentJobs.map(j => (
                <div key={j.id} className="flex justify-between items-center text-xs">
                  <div className="max-w-[70%]">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{j.title}</p>
                    <span className="text-[10px] text-zinc-400 truncate block">by {j.company_name}</span>
                  </div>
                  <span className="rounded px-1.5 py-0.5 text-[9px] uppercase font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 shrink-0">
                    {j.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-500" />
            Recent Applications
          </h3>
          <div className="space-y-3">
            {recentApps.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No recent applications</p>
            ) : (
              recentApps.map(a => (
                <div key={a.id} className="flex justify-between items-start text-xs gap-2">
                  <div className="max-w-[70%]">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{a.pro_name}</p>
                    <span className="text-[10px] text-zinc-400 truncate block">applied to {a.job_title}</span>
                  </div>
                  <span className="rounded px-1.5 py-0.5 text-[9px] uppercase font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Flagged Reports Inbox */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
        <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
          Content Moderation Inbox
        </h3>
        <p className="text-xs text-zinc-500">Admins review reported listings, reviews, or profiles for policy violations.</p>

        {reports.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500">
            ✔ No pending moderation flags. System is healthy!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
                    Report type: {report.item_type}
                  </span>
                  <span className="text-zinc-400">by {report.profiles?.full_name || 'User'}</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 italic">"{report.reason}"</p>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400">Target ID: {report.item_id.substring(0, 8)}...</span>
                  <button
                    onClick={() => handleResolve(report.id)}
                    disabled={resolvingId === report.id}
                    className="rounded bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 font-bold text-white transition-colors disabled:opacity-50"
                  >
                    {resolvingId === report.id ? 'Resolving...' : 'Resolve / Dismiss'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
