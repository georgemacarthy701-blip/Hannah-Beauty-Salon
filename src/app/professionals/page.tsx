import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Search, MapPin, Star, UserCheck, Filter, Users } from 'lucide-react'
import ProfessionalCard from './ProfessionalCard'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProfessionalsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : ''
  const availableOnly = typeof resolvedSearchParams.available === 'string' ? resolvedSearchParams.available === 'true' : false

  const supabase = await createClient()

  // Query professional details
  let query = supabase
    .from('professional_details')
    .select('*, profiles(full_name, age, address, city, avatar_cloudinary_url, portfolio_items(id, image_url, title))')

  if (search) {
    query = query.or(`title.ilike.%${search}%,skills.cs.{${search}}`)
  }
  if (availableOnly) {
    query = query.eq('availability', true)
  }

  const { data: professionals } = await query

  const fallbackProfessionals = [
    {
      id: 'mock-prof-1',
      user_id: 'mock-prof-user-1',
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
        portfolio_items: [
          { id: 'p1', image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=300' }
        ]
      }
    },
    {
      id: 'mock-prof-2',
      user_id: 'mock-prof-user-2',
      title: 'Full-Stack Software Developer',
      bio: 'Building responsive Next.js apps, database design, and mobile-friendly layouts. Available for freelance and contracts.',
      hourly_rate: 350,
      skills: ['Next.js', 'PostgreSQL', 'Tailwind CSS'],
      availability: true,
      profiles: {
        full_name: 'Mariama Sall',
        age: 26,
        address: '15 Siaka Stevens St',
        city: 'Freetown, Western Area',
        avatar_cloudinary_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        portfolio_items: []
      }
    },
  ]

  const activeProfs = professionals && professionals.length > 0 ? professionals : fallbackProfessionals

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Service Professionals</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Discover and hire skilled, verified service providers in your region</p>
      </div>

      {/* Filter and Search Form */}
      <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="relative md:col-span-2">
          <Search className="absolute top-3 left-3 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search trades or skills (e.g. Electrician, Plumbing, React)..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 items-center gap-2 px-3 border border-zinc-300 rounded-lg bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <input
              type="checkbox"
              id="avail"
              name="available"
              value="true"
              defaultChecked={availableOnly}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="avail" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 select-none">
              Available Now
            </label>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </form>

      {/* Professionals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeProfs.length === 0 ?
          <div className="md:col-span-3 text-center py-12 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <Users className="h-10 w-10 mx-auto text-zinc-400 mb-2" />
            <p className="font-semibold text-zinc-600 dark:text-zinc-400">No professionals found matching your filters.</p>
          </div>
        :
          activeProfs.map((prof: any) => (
            <ProfessionalCard key={prof.id} prof={prof} />
          ))
        }
      </div>
    </div>
  )
}
