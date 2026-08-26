'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Menu, X, Briefcase, Users, LayoutDashboard, LogOut, ShieldAlert, Rss, Mail, Store } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(profile?.role || 'professional')
        fetchUnreadCount(user.id)
      }
    }

    async function fetchUnreadCount(userId: string) {
      const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    getSession()

    let channel: any = null

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const activeUser = session?.user || null
      setUser(activeUser)
      if (activeUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', activeUser.id)
          .single()
        setRole(profile?.role || 'professional')
        fetchUnreadCount(activeUser.id)

        // Realtime subscription to dynamic message tables changes
        channel = supabase
          .channel('navbar-unread-messages')
          .on(
            'postgres_changes' as any,
            { event: 'insert', schema: 'public', tableName: 'direct_messages' },
            (payload: any) => {
              if (payload.new.receiver_id === activeUser.id) {
                setUnreadCount((prev) => prev + 1)
              }
            }
          )
          .on(
            'postgres_changes' as any,
            { event: 'update', schema: 'public', tableName: 'direct_messages' },
            () => {
              fetchUnreadCount(activeUser.id)
            }
          )
          .subscribe()
      } else {
        setRole(null)
        setUnreadCount(0)
        if (channel) {
          supabase.removeChannel(channel)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex flex-1 items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-2xl font-black tracking-tight text-transparent">
                LeoneLink
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1 lg:space-x-4">
              <Link
                href="/feed"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/feed')
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <Rss className="h-4 w-4" />
                Feed
              </Link>
              {user && (
                <Link
                  href="/messages"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative ${
                    isActive('/messages')
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <Link
                href="/jobs"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/jobs')
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Find Jobs
              </Link>
              <Link
                href="/professionals"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/professionals')
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <Users className="h-4 w-4" />
                Professionals
              </Link>
              <Link
                href="/marketplace"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/marketplace')
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <Store className="h-4 w-4" />
                Marketplace
              </Link>
            </div>
          </div>

          {/* User Auth Info (Desktop) */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {user ? (
              <>
                {role === 'admin' && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive('/admin')
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                        : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Admin Portal
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join LeoneLink
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-t border-zinc-200 bg-white px-2 pt-2 pb-4 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          <div className="space-y-1">
            <Link
              href="/feed"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium ${
                isActive('/feed')
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Rss className="h-5 w-5" />
              Feed
            </Link>
            {user && (
              <Link
                href="/messages"
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-base font-medium ${
                  isActive('/messages')
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <span>Messages</span>
                </div>
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/jobs"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium ${
                isActive('/jobs')
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Briefcase className="h-5 w-5" />
              Find Jobs
            </Link>
            <Link
              href="/professionals"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium ${
                isActive('/professionals')
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Users className="h-5 w-5" />
              Professionals
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium ${
                isActive('/marketplace')
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Store className="h-5 w-5" />
              Marketplace
            </Link>

            {user ? (
              <>
                {role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium ${
                      isActive('/admin')
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    <ShieldAlert className="h-5 w-5" />
                    Admin Portal
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium ${
                    isActive('/dashboard')
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    handleLogout()
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-base font-medium text-rose-600 dark:text-rose-400"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800 space-y-2 px-3">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-center rounded-lg border border-zinc-300 dark:border-zinc-700 py-2 text-base font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block text-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-2 text-base font-semibold text-white shadow-md"
                >
                  Join LeoneLink
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
