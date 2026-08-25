'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Globe, Rss, Briefcase, Users, LayoutDashboard } from 'lucide-react'
import CreatePostCard from '@/components/feed/CreatePostCard'
import PostCard from '@/components/feed/PostCard'
import Link from 'next/link'

interface FeedClientProps {
  initialPosts: any[]
  currentUser: any
  isAdmin: boolean
}

export default function FeedClient({ initialPosts, currentUser, isAdmin }: FeedClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>(initialPosts)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sync state if initialPosts changes server-side
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const refreshFeed = async () => {
    setIsRefreshing(true)
    try {
      // 1. Trigger Next.js server component data revalidation
      router.refresh()

      // 2. Fetch directly client-side to instantly update local state
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id(id, full_name, role, avatar_cloudinary_url),
          post_likes(id, user_id),
          post_comments(
            id,
            content,
            created_at,
            author_id,
            profiles:author_id(id, full_name, avatar_cloudinary_url)
          )
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPosts(data)
      }
    } catch (err) {
      console.error('Error refreshing feed:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const userAvatar = currentUser?.avatar_cloudinary_url || currentUser?.avatar_url || currentUser?.image || null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (User Sidebar Info) - Hidden on Mobile */}
        <div className="hidden md:block space-y-6">
          {currentUser ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
              {/* Card Banner Background */}
              <div className="h-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              
              <div className="px-5 pb-5 relative flex flex-col items-center text-center">
                {/* Overlapping Avatar */}
                <div className="relative -mt-10 mb-3 shrink-0">
                  {userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userAvatar}
                      alt={currentUser.full_name}
                      className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-md"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold border-4 border-white dark:border-zinc-900 shadow-md text-2xl dark:bg-emerald-950/30 dark:text-emerald-400">
                      {currentUser.full_name?.[0] || 'U'}
                    </div>
                  )}
                </div>

                <Link
                  href={`/professionals/${currentUser.id}`}
                  className="font-black text-zinc-900 dark:text-white hover:text-emerald-500 transition-colors block text-base"
                >
                  {currentUser.full_name}
                </Link>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize mt-0.5">
                  {currentUser.role || 'Member'}
                </p>

                <div className="w-full border-t border-zinc-100 dark:border-zinc-800 my-4" />

                <div className="w-full space-y-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-450 dark:hover:bg-zinc-800/40 dark:hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                    <span>My Dashboard</span>
                  </Link>
                  <Link
                    href="/professionals"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-450 dark:hover:bg-zinc-800/40 dark:hover:text-white transition-colors"
                  >
                    <Users className="h-4 w-4 text-zinc-400" />
                    <span>Directory</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">LeoneLink Community</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Connect with professional tradespeople, companies, and employers in Sierra Leone. Share work updates, ask questions, or announce job vacancies.
              </p>
            </div>
          )}
        </div>

        {/* Center/Right Feed Stream Column */}
        <div className="md:col-span-2 space-y-6">
          <CreatePostCard user={currentUser} onPostCreated={refreshFeed} />

          {/* Posts Stream */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <Rss className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
                  Welcome to LeoneLink Feed
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  No one has posted yet. Be the first to share an update, milestone, or vacancy with the community!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onPostAction={refreshFeed}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
