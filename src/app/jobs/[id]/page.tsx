import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ApplyForm from './ApplyForm'
import { deleteJobAdmin } from '@/app/actions/admin'
import { MapPin, Calendar, Briefcase, FileText, ArrowLeft, Send } from 'lucide-react'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch Job details
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*, company_profile:profiles!jobs_company_id_fkey(full_name, avatar_cloudinary_url, company_details(*))')
    .eq('id', id)
    .single()

  // Mock data fallback if DB doesn't have the job
  let activeJob = job
  let isMock = false

  if (error || !job) {
    isMock = true
    activeJob = {
      id: id,
      title: 'Solar Panel Maintenance Technician',
      category: 'Engineering',
      location_address: 'Aberdeen, Freetown',
      budget: 800,
      description: 'We are seeking a solar professional to clean, calibrate, and inspect a 15kW off-grid solar system. Experience with SMA and Victron hardware preferred.',
      created_at: new Date().toISOString(),
      company_details: {
        company_name: 'Solon Leone Energy',
        logo_cloudinary_url: 'https://res.cloudinary.com/demo/image/upload/v1652345767/docs/demo_image2.jpg',
        description: 'Providing sustainable solar energy solutions across West Africa.',
        website: 'https://solonleone.sl',
      },
    } as any
  } else {
    // Map joined profile values to company_details object for the UI
    const companyProfile = (job as any).company_profile || {}
    const companyDetails = companyProfile.company_details?.[0] || {}
    activeJob.company_details = {
      company_name: companyProfile.full_name || companyDetails.company_name,
      logo_cloudinary_url: companyProfile.avatar_cloudinary_url || companyDetails.logo_cloudinary_url,
      description: companyDetails.description || '',
      website: companyDetails.website || '',
    }
  }

  // 2. Fetch User & Application status
  const { data: { user } } = await supabase.auth.getUser()
  let hasApplied = false
  let applicationStatus = ''
  let isProfessional = false

  if (user && user.user_metadata?.role === 'professional') {
    isProfessional = true

    // Check application status directly using user.id
    const { data: application } = await supabase
      .from('job_applications')
      .select('status')
      .eq('job_id', id)
      .eq('professional_id', user.id)
      .single()

    if (application) {
      hasApplied = true
      applicationStatus = application.status
    }
  }

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Job Board
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Job Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">{activeJob.title}</h1>
                <p className="text-emerald-500 font-bold mt-1">{activeJob.company_details?.company_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-zinc-100 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>{activeJob.location_address}</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                <span>{activeJob.budget > 0 ? `Le ${activeJob.budget}` : 'Budget: TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>Posted {new Date(activeJob.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>{activeJob.category}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg">Job Description</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{activeJob.description}</p>
            </div>
          </div>

          {/* Application Form or Status Section */}
          {user ? (
            isProfessional ? (
              hasApplied ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/20 p-6 dark:border-emerald-500/10 dark:bg-emerald-950/10 text-center space-y-2">
                  <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Application Submitted!</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    You applied for this job. Current Status: <strong className="uppercase">{applicationStatus}</strong>
                  </p>
                </div>
              ) : (
                  <ApplyForm jobId={activeJob.id} isMock={isMock} />
              )
            ) : (
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-100/50 p-6 text-center dark:border-zinc-800/80 dark:bg-zinc-900/20">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  You are currently logged in as a <strong>Company / Employer</strong>. Job applications are only available to Service Professionals.
                </p>
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-100/50 p-6 text-center dark:border-zinc-800/80 dark:bg-zinc-900/20 space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Interested in applying? Sign in with your Professional profile to submit an application.
              </p>
              <Link
                href={`/login?redirectedFrom=/jobs/${id}`}
                className="inline-flex rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                Sign In to Apply
              </Link>
            </div>
          )}
        </div>

        {/* Company Card Side Widget */}
        <div className="space-y-6">
          {/* Admin Moderation Panel */}
          {isAdmin && (
            <div className="rounded-2xl border border-red-500/20 bg-red-50/20 p-6 dark:border-red-500/10 dark:bg-red-950/10 space-y-3">
              <h3 className="font-bold text-base text-red-700 dark:text-red-400">Admin Moderation</h3>
              <p className="text-[11px] text-zinc-500">Remove this listing immediately from LeoneLink.</p>
              <form action={deleteJobAdmin as any}>
                <input type="hidden" name="jobId" value={activeJob.id} />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  Delete Listing permanently
                </button>
              </form>
            </div>
          )}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 text-center space-y-4">
            {activeJob.company_details?.logo_cloudinary_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeJob.company_details.logo_cloudinary_url}
                alt={activeJob.company_details.company_name}
                className="mx-auto h-20 w-20 rounded-full object-cover border-2 border-emerald-500/20"
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-3xl font-black dark:bg-emerald-950/30 dark:text-emerald-400">
                {activeJob.company_details?.company_name?.[0] || 'C'}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{activeJob.company_details?.company_name}</h2>
              {activeJob.company_details?.website && (
                <a
                  href={activeJob.company_details.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-500 hover:underline mt-1 inline-block"
                >
                  Visit Website
                </a>
              )}
            </div>
            {activeJob.company_details?.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-4 leading-relaxed">
                {activeJob.company_details.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
