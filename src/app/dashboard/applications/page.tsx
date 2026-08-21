import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import WithdrawButton from './WithdrawButton'
import { FileText, MapPin, Calendar, ArrowLeft } from 'lucide-react'

export const revalidate = 0

export default async function ApplicationsPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'professional') {
    redirect('/dashboard')
  }

  // 2. Fetch applications joining jobs and company profiles
  const { data: apps } = await supabase
    .from('job_applications')
    .select('*, jobs(*, company_profile:profiles!jobs_company_id_fkey(full_name, avatar_cloudinary_url, company_details(*)))')
    .eq('professional_id', user.id)
    .order('created_at', { ascending: false })

  const applications = (apps || []).map(app => {
    const job = app.jobs || {}
    const companyProfile = (job as any).company_profile || {}
    return {
      ...app,
      jobs: {
        ...job,
        company_details: {
          company_name: companyProfile.full_name,
          logo_cloudinary_url: companyProfile.avatar_cloudinary_url
        }
      }
    }
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">My Applications</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Track the evaluation status of your job requests</p>
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <FileText className="h-10 w-10 mx-auto text-zinc-400 mb-2" />
            <p className="font-semibold text-zinc-600 dark:text-zinc-400">You have not applied for any jobs yet.</p>
            <Link href="/jobs" className="mt-3 inline-block rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors">
              Find Jobs
            </Link>
          </div>
        ) : (
          applications.map((app) => {
            const job = app.jobs || {}
            const company = job.company_details || {}

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                      <Link href={`/jobs/${job.id}`} className="hover:text-emerald-500 transition-colors">
                        {job.title}
                      </Link>
                    </h3>
                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      {company.company_name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location_address}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        {job.budget > 0 ? `Le ${job.budget}` : 'TBD'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                      app.status === 'hired'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/20'
                        : app.status === 'shortlisted'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-500/20'
                        : app.status === 'rejected'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                    }`}>
                      {app.status}
                    </span>

                    <WithdrawButton applicationId={app.id} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase tracking-wider">Your Cover Note</span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    {app.cover_note || 'No cover note submitted.'}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
