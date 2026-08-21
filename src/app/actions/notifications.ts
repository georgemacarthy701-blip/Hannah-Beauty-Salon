'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNotificationRead(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const notificationId = formData.get('notificationId') as string

    if (!notificationId) {
      return { success: false, error: 'Notification ID is required.' }
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
