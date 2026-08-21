'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Create a New Job listing
export async function createJob(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Fetch user profile role to verify
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'company') {
      return { success: false, error: 'Only registered Companies can publish jobs.' }
    }

    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const jobType = formData.get('jobType') as string
    const location = formData.get('location') as string
    const budget = formData.get('budget') as string
    const description = formData.get('description') as string

    if (!title || !category || !jobType || !location || !description) {
      return { success: false, error: 'All fields except budget are required.' }
    }

    // Insert job record
    const { error: insertError } = await supabase
      .from('jobs')
      .insert({
        company_id: user.id,
        title,
        description,
        category,
        location_address: location,
        budget: budget ? parseFloat(budget) : 0,
        status: 'open',
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath('/dashboard/jobs')
    revalidatePath('/jobs')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 2. Change Job Status
export async function updateJobStatus(jobId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', jobId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/jobs')
    revalidatePath(`/jobs/${jobId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 3. Update Application Status & Notify Professional
export async function updateApplicationStatus(applicationId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Update application
    const { data: app, error: appError } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', applicationId)
      .select('*, jobs(title)')
      .single()

    if (appError || !app) {
      return { success: false, error: appError?.message || 'Application not found.' }
    }

    // Notify Professional
    if (app.professional_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: app.professional_id,
          type: 'application_status',
          title: 'Application Status Updated',
          message: `Your application status for "${app.jobs.title}" has been updated to "${status}".`,
        })
    }

    revalidatePath('/dashboard/jobs')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
