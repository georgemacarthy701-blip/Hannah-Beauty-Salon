import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { MapPin, Globe, Briefcase, Calendar, ArrowLeft } from 'lucide-react'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch Company details
  const { data: company } = await supabase
    .from('company_details')
    .select('*')
    .eq('user_id', id)
    .single()

  // 2. Fetch Jobs posted by this company
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  // Mock fallbacks if DB entry doesn't exist
  let activeCompany = company
  let activeJobs = jobs || []

  if (!company) {
    activeCompany = {
      id: id,
      user_id: id,
      company_name: 'Solon Leone Energy',
      logo_cloudinary_url: 'https://res.cloudinary.com/demo/image/upload/v1652345767/docs/demo_image2.jpg',
      office_address: 'Aberdeen, Freetown',
      website: 'https://solonleone.sl',
      description: 'Providing sustainable solar energy solutions, maintenance and storage options across West Africa. Focused on clean energy grid systems.',
      verified: true,
    } as any

    activeJobs = [
      {
        id: 'mock-job-1',
        title: 'Solar Panel Maintenance Technician',
        category: 'Engineering',
        location_address: 'Aberdeen, Freetown',
        budget: 800,
        description: 'We are seeking a solar professional to clean, calibrate, and inspect a 15kW off-grid solar system. Experience with SMA and Victron hardware preferred.',
        created_at: new Date().toISOString(),
      }
    ] as any
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-8">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      {/* Corporate Profile Header */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {activeCompany.logo_cloudinary_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeCompany.logo_cloudinary_url}
            alt={activeCompany.company_name}
            className="h-24 w-24 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-4xl font-black dark:bg-emerald-950/30 dark:text-emerald-400">
            {activeCompany.company_name?.[0] || 'C'}
          </div>
        )}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">{activeCompany.company_name}</h1>
            {activeCompany.verified && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                Verified
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              {activeCompany.office_address || 'Sierra Leone'}
            </span>
            {activeCompany.website && (
              <a
                href={activeCompany.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-500 hover:underline"
              >
                <Globe className="h-4 w-4 shrink-0" />
                {activeCompany.website}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* About Company */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-3">
            <h3 className="font-bold text-lg">About Company</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
              {activeCompany.description || 'No corporate description provided.'}
            </p>
          </div>
        </div>

        {/* Active Openings */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-500" />
            Openings ({activeJobs.length})
          </h3>
          {activeJobs.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No active job listings published by this company.</p>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job: any) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-2"
                >
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white hover:text-emerald-500 transition-colors">
                    {job.title}
                  </h4>
                  <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{job.category}</span>
                    <span className="font-semibold text-emerald-500">
                      {job.budget > 0 ? `${job.budget} SLL` : 'TBD'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
