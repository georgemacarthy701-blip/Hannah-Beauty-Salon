'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'You must be logged in to submit a review.' }
    }

    const professionalId = formData.get('professionalId') as string
    const ratingStr = formData.get('rating') as string
    const comment = formData.get('comment') as string

    if (!professionalId || !ratingStr) {
      return { success: false, error: 'Professional ID and Rating are required.' }
    }

    const rating = parseInt(ratingStr)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5.' }
    }

    // 2. Prevent professional reviewing themselves
    if (professionalId === user.id) {
      return { success: false, error: 'You cannot submit a review for your own profile.' }
    }

    // 3. Insert review
    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: user.id,
        professional_id: professionalId,
        rating,
        comment,
      })

    if (reviewError) {
      return { success: false, error: reviewError.message }
    }

    // 4. Create Notification for the professional
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const reviewerName = profile?.full_name || 'A customer'

    await supabase
      .from('notifications')
      .insert({
        user_id: professionalId,
        type: 'general',
        title: 'New Review Received',
        message: `${reviewerName} gave you a ${rating}-star review: "${comment.slice(0, 30)}..."`,
      })

    revalidatePath(`/professionals/${professionalId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
