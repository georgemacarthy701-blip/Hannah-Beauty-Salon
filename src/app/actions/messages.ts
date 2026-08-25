'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/**
 * Retrieves the unique conversation ID between the current user and target user.
 * If one does not exist, it creates a new conversation thread.
 */
export async function getOrCreateConversation(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to send a message.' }
  }

  if (user.id === targetUserId) {
    return { error: 'You cannot start a conversation with yourself.' }
  }

  // Sort participant IDs lexicographically to respect the database UNIQUE constraint
  const [participant_one, participant_two] = [user.id, targetUserId].sort()

  // Check if conversation already exists
  const { data: existingConv, error: fetchError } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_one', participant_one)
    .eq('participant_two', participant_two)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching conversation:', fetchError)
    return { error: fetchError.message }
  }

  if (existingConv) {
    return { success: true, conversationId: existingConv.id }
  }

  // Insert a new conversation pair
  const { data: newConv, error: createError } = await supabase
    .from('conversations')
    .insert({
      participant_one,
      participant_two,
      last_message_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (createError) {
    console.error('Error creating conversation:', createError)
    return { error: createError.message }
  }

  revalidatePath('/messages')
  return { success: true, conversationId: newConv.id }
}

/**
 * Sends a direct 1-on-1 message in a conversation.
 */
export async function sendDirectMessage(conversationId: string, receiverId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to send messages.' }
  }

  const trimmedMessage = message.trim()
  if (!trimmedMessage) {
    return { error: 'Message content cannot be empty.' }
  }

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      message: trimmedMessage
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return { error: error.message }
  }

  // Update conversation last_message_at timestamp
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath('/messages')
  return { success: true, message: data }
}

/**
 * Marks all incoming messages in a conversation as read.
 */
export async function markConversationAsRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from('direct_messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking conversation as read:', error)
  }

  revalidatePath('/messages')
}

/**
 * Gets the total count of unread messages across all conversations.
 */
export async function getUnreadMessagesCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 0

  const { count, error } = await supabase
    .from('direct_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error counting unread messages:', error)
    return 0
  }

  return count || 0
}
