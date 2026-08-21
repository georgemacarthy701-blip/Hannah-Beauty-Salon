import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-xl font-extrabold text-transparent">
              LeoneLink
            </span>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Connecting Skills, Services & Opportunities in Sierra Leone.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/jobs" className="hover:text-emerald-500 transition-colors">
              Browse Jobs
            </Link>
            <Link href="/professionals" className="hover:text-emerald-500 transition-colors">
              Find Professionals
            </Link>
            <Link href="/login" className="hover:text-emerald-500 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
        <div className="mt-6 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} LeoneLink. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
