import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Search, Briefcase, Users, ArrowRight, MapPin, DollarSign, Calendar, Star } from 'lucide-react'
import { formatImageUrl } from '@/utils/image'
import ProfessionalCard from './professionals/ProfessionalCard'

// Allow page to refresh on navigation
export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch both jobs and professionals in parallel to prevent query waterfalls
  const [jobsResult, profsResult] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, description, category, location_address, budget, created_at, company_profile:profiles!jobs_company_id_fkey(full_name, avatar_cloudinary_url)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('professional_details')
      .select('id, user_id, title, bio, hourly_rate, skills, availability, profiles(full_name, age, address, city, avatar_cloudinary_url, portfolio_items(id, image_url, title))')
      .limit(6)
  ])

  const rawJobs = jobsResult.data
  const rawProfs = profsResult.data

  console.log('HOMEPAGE_PROFILES:', { count: rawProfs?.length, error: profsResult.error })

  const jobs = (rawJobs || []).map(j => {
    const profile = (j as any).company_profile || {}
    return {
      ...j,
      company_details: {
        company_name: profile.full_name,
        logo_cloudinary_url: profile.avatar_cloudinary_url
      }
    }
  })

  const professionals = (rawProfs || []).map(p => {
    const profile = (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles) as any || {}
    return {
      ...p,
      profiles: profile,
      portfolio_items: profile.portfolio_items || []
    }
  })

  const activeJobs = jobs || []
  const activeProfs = professionals || []

  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-emerald-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 px-6 py-20 md:py-28 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1.5 text-sm font-semibold text-emerald-400 border border-emerald-500/20">
            Sierra Leone's #1 Job & Service Hub
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Connecting <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Skills, Services</span> & Opportunities
          </h1>
          <p className="text-zinc-300 max-w-2xl mx-auto text-lg sm:text-xl">
            Discover trusted local professionals, explore career-building corporate vacancies, and grow your network in Sierra Leone.
          </p>

          {/* Core Navigation Triggers */}
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/jobs"
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <Briefcase className="h-5 w-5" />
              Explore Open Jobs
            </Link>
            <Link
              href="/professionals"
              className="flex items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/80 px-8 py-4 font-semibold text-zinc-100 backdrop-blur-sm transition-all hover:scale-[1.02]"
            >
              <Users className="h-5 w-5" />
              Find Service Professionals
            </Link>
          </div>
        </div>
      </section>

      {/* Active Jobs Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Active Job Openings</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Fresh listings from verified local companies</p>
          </div>
          <Link href="/jobs" className="flex items-center gap-1 text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
            See all jobs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeJobs.length === 0 ? (
            <div className="md:col-span-3 text-center py-12 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 w-full">
              <Briefcase className="h-10 w-10 mx-auto text-zinc-400 mb-2" />
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">No active job openings listed yet. Check back soon!</p>
            </div>
          ) : (
            activeJobs.map((job: any) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group flex flex-col justify-between p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40 cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {job.company_details?.logo_cloudinary_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formatImageUrl(job.company_details.logo_cloudinary_url, { width: 80, height: 80, crop: 'fill' })}
                        alt={job.company_details.company_name}
                        className="h-10 w-10 rounded-lg object-cover border border-zinc-100 dark:border-zinc-800"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                        {job.company_details?.company_name?.[0] || 'C'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">{job.company_details?.company_name || 'Anonymous'}</h4>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">{job.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{job.description}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {job.location_address}
                  </span>
                  <span className="font-semibold text-emerald-500">
                    {job.budget > 0 ? `Le ${job.budget}` : 'Negotiable'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Professionals Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Hire Local Services</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Browse and connect directly with skilled local tradespeople</p>
          </div>
          <Link href="/professionals" className="flex items-center gap-1 text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
            Find professionals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeProfs.length === 0 ? (
            <div className="md:col-span-3 text-center py-12 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 w-full">
              <Users className="h-10 w-10 mx-auto text-zinc-400 mb-2" />
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">No service providers listed yet. Be the first to join!</p>
            </div>
          ) : (
            activeProfs.map((prof: any) => (
              <ProfessionalCard key={prof.id} prof={prof} />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
