import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LayoutDashboard, Briefcase, Users, ArrowLeft, Settings } from 'lucide-react'
import AdminNavbarLink from './AdminNavbarLink'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Verify Admin Role server-side
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shrink-0 hidden md:block">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-1">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-xl font-extrabold text-transparent">
              LeoneLink
            </span>
            <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-1.5 py-0.5 rounded">
              CMS
            </span>
          </Link>
        </div>

        <nav className="space-y-1">
          <AdminNavbarLink href="/admin">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </AdminNavbarLink>

          <AdminNavbarLink href="/admin/jobs">
            <Briefcase className="h-4 w-4" />
            Job Manager
          </AdminNavbarLink>

          <AdminNavbarLink href="/admin/users">
            <Users className="h-4 w-4" />
            User Moderation
          </AdminNavbarLink>

          <AdminNavbarLink href="/admin/settings">
            <Settings className="h-4 w-4" />
            System Settings
          </AdminNavbarLink>
        </nav>

        <div className="mt-auto pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Admin Panels */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}
