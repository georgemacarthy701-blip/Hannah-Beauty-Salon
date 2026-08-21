'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function applyToJob(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'You must be logged in to apply.' }
    }

    const jobId = formData.get('jobId') as string
    const coverNote = formData.get('coverNote') as string
    const cvUrl = formData.get('cvUrl') as string || null

    if (!jobId) {
      return { success: false, error: 'Job ID is required.' }
    }

    // 2. Fetch professional profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'professional') {
      return { success: false, error: 'Only Service Professionals can apply to jobs.' }
    }

    // 3. Insert application into job_applications
    const { error: appError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        professional_id: user.id,
        cover_note: coverNote,
        cv_url: cvUrl,
        status: 'submitted',
      })

    if (appError) {
      if (appError.code === '23505') { // unique constraint violation
        return { success: false, error: 'You have already applied to this job.' }
      }
      return { success: false, error: appError.message }
    }

    // 4. Create Notification for the company owner (company_id is profile.id)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('title, company_id')
      .eq('id', jobId)
      .single()

    if (!jobError && job?.company_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: job.company_id,
          type: 'new_application',
          title: 'New Application Received',
          message: `${profile.full_name || 'A professional'} has applied for "${job.title}".`,
        })
    }

    revalidatePath(`/jobs/${jobId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

export async function withdrawApplication(applicationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', applicationId)
      .eq('professional_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/applications')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
