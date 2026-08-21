import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Search, Briefcase, Users, ArrowRight, MapPin, DollarSign, Calendar, Star } from 'lucide-react'

// Allow page to refresh on navigation
export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch active jobs (limit 6)
  const { data: rawJobs } = await supabase
    .from('jobs')
    .select('id, title, description, category, location_address, budget, created_at, company_profile:profiles!jobs_company_id_fkey(full_name, avatar_cloudinary_url)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

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

  // Fetch service professionals with profiles and portfolio items (limit 6)
  const { data: rawProfs } = await supabase
    .from('professional_details')
    .select('id, title, bio, hourly_rate, skills, availability, profiles(full_name, age, address, city, avatar_cloudinary_url, portfolio_items(id, image_url, title))')
    .limit(6)

  const professionals = (rawProfs || []).map(p => {
    const profile = (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles) as any || {}
    return {
      ...p,
      profiles: profile,
      portfolio_items: profile.portfolio_items || []
    }
  })

  // Standard high-fidelity mock data fallback for immediate visual wow and testing
  const fallbackJobs = [
    {
      id: 'mock-job-1',
      title: 'Solar Panel Maintenance Technician',
      category: 'Engineering',
      location_address: 'Aberdeen, Freetown',
      budget: 800,
      created_at: new Date().toISOString(),
      company_details: {
        company_name: 'Solon Leone Energy',
        logo_cloudinary_url: 'https://res.cloudinary.com/demo/image/upload/v1652345767/docs/demo_image2.jpg',
      },
    },
    {
      id: 'mock-job-2',
      title: 'Emergency Commercial Electrical Wiring',
      category: 'Electrical Work',
      location_address: 'Kongo Town, Freetown',
      budget: 1200,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      company_details: {
        company_name: 'Sierra Build Corporation',
        logo_cloudinary_url: 'https://res.cloudinary.com/demo/image/upload/v1652345767/docs/demo_image3.jpg',
      },
    },
  ]

  const fallbackProfessionals = [
    {
      id: 'mock-prof-1',
      title: 'Senior Plumber & Pipefitter',
      bio: 'Over 8 years experience servicing residential and commercial plumbing networks across Freetown. Fast emergency response and leak repairs.',
      hourly_rate: 150,
      skills: ['Leak Detection', 'Pipe Installation', 'Water Pumps'],
      availability: true,
      profiles: {
        full_name: 'Abu Bakarr Kamara',
        age: 32,
        address: '24 Wilkinson Road',
        city: 'Freetown, Western Area',
        avatar_cloudinary_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      },
      portfolio_items: [
        { id: 'p1', image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=300' }
      ]
    },
    {
      id: 'mock-prof-2',
      title: 'Full-Stack Software Developer',
      bio: 'Building responsive Next.js apps, database design, and mobile-friendly layouts. Available for freelance and contracts.',
      hourly_rate: 350,
      skills: ['Next.js', 'PostgreSQL', 'Tailwind CSS'],
      availability: true,
      profiles: {
        full_name: 'Mariama Sall',
        age: 26,
        address: '15 Campbell Street',
        city: 'Bo, Southern Province',
        avatar_cloudinary_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      },
      portfolio_items: [
        { id: 'p2', image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=300' }
      ]
    }
  ]

  const activeJobs = jobs && jobs.length > 0 ? jobs : fallbackJobs
  const activeProfs = professionals && professionals.length > 0 ? professionals : fallbackProfessionals

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
          {activeJobs.map((job: any) => (
            <div
              key={job.id}
              className="flex flex-col justify-between p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {job.company_details?.logo_cloudinary_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.company_details.logo_cloudinary_url}
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
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1">{job.title}</h3>
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
            </div>
          ))}
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
          {activeProfs.map((prof: any) => {
            const profile = prof.profiles || {}
            return (
              <div
                key={prof.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40"
              >
                {/* Visual Portfolio Preview */}
                {prof.portfolio_items?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={prof.portfolio_items[0].image_url}
                    alt={prof.portfolio_items[0].title || 'Portfolio'}
                    className="h-44 w-full object-cover group-hover:scale-[1.01] transition-transform"
                  />
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800">
                    <Users className="h-8 w-8 text-emerald-500/40" />
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Public Display Identity Info */}
                  <div className="flex gap-3">
                    {profile.avatar_cloudinary_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_cloudinary_url}
                        alt={profile.full_name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-emerald-500/20"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                        {profile.full_name?.[0] || 'P'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        {profile.full_name || 'Service Pro'}
                        <span className="text-xs font-normal text-zinc-500">({profile.age ? `${profile.age} yrs` : 'N/A'})</span>
                      </h3>
                      <p className="text-xs text-emerald-500 font-semibold">{prof.title}</p>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{prof.bio}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {prof.skills?.slice(0, 3).map((skill: string) => (
                      <span key={skill} className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-6 pt-0 mt-auto border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/10">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="line-clamp-1">{profile.address || 'Sierra Leone'}</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 text-sm">
                    Le {prof.hourly_rate}/hr
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
