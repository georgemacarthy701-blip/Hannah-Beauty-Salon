'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendInquiry(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const professionalId = formData.get('professionalId') as string
    const clientName = formData.get('clientName') as string
    const clientPhone = formData.get('clientPhone') as string
    const message = formData.get('message') as string

    if (!professionalId || !clientName || !message) {
      return { success: false, error: 'Name and message are required.' }
    }

    // Create Notification for the professional
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: professionalId,
        type: 'general',
        title: 'New Service Inquiry',
        message: `Inquiry from ${clientName} (${clientPhone || 'No phone provided'}): "${message}"`,
      })

    if (notifError) {
      return { success: false, error: notifError.message }
    }

    revalidatePath(`/professionals/${professionalId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
