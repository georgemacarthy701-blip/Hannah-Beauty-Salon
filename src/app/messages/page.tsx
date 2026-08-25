import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MessagesClient from './MessagesClient'

export const revalidate = 0

export default async function MessagesPage() {
  const supabase = await createClient()

  // 1. Fetch current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirectTo=/messages')
  }

  // 2. Fetch current user profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Fetch conversations list for this participant (sorted descending by last_message_at)
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      profile_one:profiles!conversations_participant_one_fkey(id, full_name, role, avatar_cloudinary_url),
      profile_two:profiles!conversations_participant_two_fkey(id, full_name, role, avatar_cloudinary_url),
      direct_messages(id, message, is_read, sender_id, created_at)
    `)
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
  }

  const initialConversations = conversations || []

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <MessagesClient
        initialConversations={initialConversations}
        currentUser={profile || user}
      />
    </div>
  )
}
