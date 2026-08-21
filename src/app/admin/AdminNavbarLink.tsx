'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminNavbarLinkProps {
  href: string
  children: React.ReactNode
}

export default function AdminNavbarLink({ href, children }: AdminNavbarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        isActive
          ? 'bg-emerald-500 text-white dark:bg-emerald-600'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
      }`}
    >
      {children}
    </Link>
  )
}
