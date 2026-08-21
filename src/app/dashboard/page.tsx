import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { markNotificationRead } from '@/app/actions/notifications'
import { User, Users, Bell, Briefcase, FileText, CheckCircle2, UserCheck, Shield, ChevronRight, Mail, Landmark } from 'lucide-react'

export const revalidate = 0

export default async function DashboardHubPage() {
  const supabase = await createClient()

  // 1. Fetch authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch Profile Info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'professional'

  // If Admin, redirect directly to admin portal
  if (role === 'admin') {
    redirect('/admin')
  }

  // 3. Fetch Notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const unreadNotifs = notifications?.filter(n => !n.read_at) || []

  // 4. Fetch Role-Specific Dashboard Metrics
  let professionalDetails = null
  let companyDetails = null
  let appCount = 0
  let jobsCount = 0

  if (role === 'professional') {
    const { data: prof } = await supabase
      .from('professional_details')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (prof) {
      const { data: portfolio } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', user.id)

      professionalDetails = { ...prof, portfolio_items: portfolio || [] }

      const { count } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', user.id)
      
      appCount = count || 0
    }
  } else if (role === 'company') {
    const { data: comp } = await supabase
      .from('company_details')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    companyDetails = comp

    if (comp) {
      const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.id)
      
      jobsCount = jobCount || 0

      // Total applications received by this company's jobs
      const { data: companyJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', user.id)

      if (companyJobs && companyJobs.length > 0) {
        const jobIds = companyJobs.map(j => j.id)
        const { count: applicationCount } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id', jobIds)
        
        appCount = applicationCount || 0
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Welcome, {profile?.full_name || 'User'}!</h1>
          <p className="text-emerald-50 text-sm mt-1">
            Manage your listings, view notifications, and update your LeoneLink profile page
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/profile"
            className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all"
          >
            Edit Profile
          </Link>
          {role === 'company' ? (
            <Link
              href="/dashboard/jobs"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-600 shadow-md transition-all hover:bg-zinc-50"
            >
              Post a Job
            </Link>
          ) : (
            <Link
              href="/jobs"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-600 shadow-md transition-all hover:bg-zinc-50"
            >
              Explore Vacancies
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 flex items-center gap-4">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-500">
            <User className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block uppercase tracking-wider">Account Role</span>
            <strong className="text-lg font-bold text-zinc-900 dark:text-white capitalize">{role}</strong>
          </div>
        </div>

        {role === 'professional' ? (
          <>
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 flex items-center gap-4">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-blue-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block uppercase tracking-wider">Applied Jobs</span>
                <strong className="text-lg font-bold text-zinc-900 dark:text-white">{appCount} Applications</strong>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 flex items-center gap-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block uppercase tracking-wider">Availability</span>
                <strong className="text-lg font-bold text-zinc-900 dark:text-white">
                  {professionalDetails?.availability ? 'Available for Hire' : 'Unavailable'}
                </strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 flex items-center gap-4">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-blue-500">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block uppercase tracking-wider">Active Job Posts</span>
                <strong className="text-lg font-bold text-zinc-900 dark:text-white">{jobsCount} Jobs</strong>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 flex items-center gap-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-500">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block uppercase tracking-wider">Applications Received</span>
                <strong className="text-lg font-bold text-zinc-900 dark:text-white">{appCount} Applicants</strong>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Dashboard Navigation Links */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg">Quick Access Pages</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/profile"
              className="flex justify-between items-center p-5 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Profile Details</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Edit trade, rates, and upload portfolio</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-400" />
            </Link>

            {role === 'professional' ? (
              <Link
                href="/dashboard/applications"
                className="flex justify-between items-center p-5 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">My Applications</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Track cover notes and statuses</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              </Link>
            ) : (
              <Link
                href="/dashboard/jobs"
                className="flex justify-between items-center p-5 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Job Postings</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Publish jobs & manage applicants</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              </Link>
            )}
          </div>
        </div>

        {/* Notifications Widget */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-500" />
              Notifications ({unreadNotifs.length})
            </h3>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-8">No notifications received.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    notif.read_at
                      ? 'border-zinc-100 bg-zinc-50/50 text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-900/10'
                      : 'border-emerald-500/20 bg-emerald-50/20 text-zinc-800 dark:border-emerald-500/10 dark:bg-emerald-950/10 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold">{notif.title}</h4>
                    {!notif.read_at && (
                      <form action={markNotificationRead as any}>
                        <input type="hidden" name="notificationId" value={notif.id} />
                        <button type="submit" className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                          Mark read
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="leading-relaxed">{notif.message}</p>
                  <span className="text-[9px] text-zinc-400 block pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
