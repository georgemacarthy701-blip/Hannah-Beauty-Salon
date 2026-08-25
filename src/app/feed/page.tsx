import { createClient } from '@/utils/supabase/server'
import FeedClient from './FeedClient'

export const revalidate = 0

export default async function FeedPage() {
  const supabase = await createClient()

  // 1. Fetch current authenticated user & role
  const { data: { user } } = await supabase.auth.getUser()
  let currentUser = null
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      currentUser = profile
      isAdmin = profile.role === 'admin'
    }
  }

  // 2. Fetch all posts with relationships (author, likes, comments)
  const { data: posts, error } = await supabase
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

  if (error) {
    console.error('Error fetching posts:', error)
  }

  const initialPosts = posts || []

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <FeedClient
        initialPosts={initialPosts}
        currentUser={currentUser}
        isAdmin={isAdmin}
      />
    </div>
  )
}
