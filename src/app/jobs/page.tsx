import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Search, MapPin, Calendar, Filter, Briefcase } from 'lucide-react'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JobsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : ''
  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : ''
  const type = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : ''

  const supabase = await createClient()

  // Query jobs joining company profile details
  let query = supabase
    .from('jobs')
    .select('*, company_details:profiles!jobs_company_id_fkey(company_name:full_name, logo_cloudinary_url:avatar_cloudinary_url)')
    .eq('status', 'open')

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const { data: jobs } = await query.order('created_at', { ascending: false })

  const fallbackJobs = [
    {
      id: 'mock-job-1',
      title: 'Solar Panel Maintenance Technician',
      category: 'Engineering',
      location_address: 'Aberdeen, Freetown',
      budget: 800,
      description: 'We are seeking a solar professional to clean, calibrate, and inspect a 15kW off-grid solar system. Experience with SMA and Victron hardware preferred.',
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
      description: 'Urgent wiring repairs required for commercial storefront. Faulty circuit breakers and wire shorts need replacement within 48 hours.',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      company_details: {
        company_name: 'Sierra Build Corporation',
        logo_cloudinary_url: 'https://res.cloudinary.com/demo/image/upload/v1652345767/docs/demo_image3.jpg',
      },
    },
  ]

  const activeJobs = jobs && jobs.length > 0 ? jobs : fallbackJobs

  // Define unique categories for filtering
  const categories = ['All Categories', 'Electrical Work', 'Plumbing', 'Construction', 'Engineering', 'IT / Software', 'Creative / Design', 'Education']

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">LeoneLink Job Board</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Discover and apply for matching opportunities across Sierra Leone</p>
      </div>

      {/* Filter Form (GET submission updates URL params) */}
      <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="relative">
          <Search className="absolute top-3 left-3 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search keywords..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <select
            name="category"
            defaultValue={category}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c === 'All Categories' ? '' : c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div></div>

        <div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </form>

      {/* Jobs Listing */}
      <div className="space-y-4">
        {activeJobs.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <Briefcase className="h-10 w-10 mx-auto text-zinc-400 mb-2" />
            <p className="font-semibold text-zinc-600 dark:text-zinc-400">No job openings found matching your criteria.</p>
          </div>
        ) : (
          activeJobs.map((job: any) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block group rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all dark:border-zinc-800/80 dark:bg-zinc-900/40"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  {job.company_details?.logo_cloudinary_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.company_details.logo_cloudinary_url}
                      alt={job.company_details.company_name}
                      className="h-12 w-12 rounded-xl object-cover border border-zinc-100 dark:border-zinc-800"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                      {job.company_details?.company_name?.[0] || 'C'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-emerald-500 transition-colors dark:text-white">
                      {job.title}
                    </h3>
                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      {job.company_details?.company_name || 'Anonymous Company'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 font-medium">
                        {job.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-start md:items-end text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                  <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {job.budget > 0 ? `Le ${job.budget}` : 'Budget: TBD'}
                  </span>
                  <div className="flex flex-col gap-1 items-start md:items-end mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                      {job.location_address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{job.description}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
