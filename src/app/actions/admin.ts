'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// Helper to verify user is admin
async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

// 1. Resolve or Dismiss Reports
export async function resolveReport(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized. Administrator access required.' }
    }

    const reportId = formData.get('reportId') as string
    const status = formData.get('status') as string

    if (!reportId) {
      return { success: false, error: 'Report ID is required.' }
    }

    const { error } = await supabase
      .from('reports')
      .update({ resolved: status === 'resolved' || status === 'true' })
      .eq('id', reportId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 2. Toggle Company Verification Status
export async function verifyCompany(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized. Administrator access required.' }
    }

    const companyId = formData.get('companyId') as string
    const verified = formData.get('verified') === 'true'

    if (!companyId) {
      return { success: false, error: 'Company ID is required.' }
    }

    const { error } = await supabase
      .from('company_details')
      .update({ verified })
      .eq('id', companyId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 3. Remove a Job Listing
export async function deleteJobAdmin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized. Administrator access required.' }
    }

    const jobId = formData.get('jobId') as string

    if (!jobId) {
      return { success: false, error: 'Job ID is required.' }
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin')
    revalidatePath('/admin/jobs')
    revalidatePath('/jobs')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 4. Create/Post Job as Admin
export async function postJobAdmin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized.' }
    }

    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const budgetStr = formData.get('budget') as string
    const location_address = formData.get('location_address') as string
    const company_id = formData.get('company_id') as string

    if (!title || !category || !description || !budgetStr || !location_address || !company_id) {
      return { success: false, error: 'All fields are required.' }
    }

    const budget = parseFloat(budgetStr)
    if (isNaN(budget)) {
      return { success: false, error: 'Budget must be a valid number.' }
    }

    const { error } = await supabase
      .from('jobs')
      .insert({
        title,
        category,
        description,
        budget,
        location_address,
        company_id,
        status: 'open',
      })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/jobs')
    revalidatePath('/jobs')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 5. Edit Job as Admin
export async function editJobAdmin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized.' }
    }

    const jobId = formData.get('jobId') as string
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const budgetStr = formData.get('budget') as string
    const location_address = formData.get('location_address') as string
    const status = formData.get('status') as string
    const company_id = formData.get('company_id') as string

    if (!jobId || !title || !category || !description || !budgetStr || !location_address || !status || !company_id) {
      return { success: false, error: 'All fields are required.' }
    }

    const budget = parseFloat(budgetStr)
    if (isNaN(budget)) {
      return { success: false, error: 'Budget must be a valid number.' }
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        title,
        category,
        description,
        budget,
        location_address,
        status,
        company_id,
      })
      .eq('id', jobId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/jobs')
    revalidatePath('/jobs')
    revalidatePath(`/jobs/${jobId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 6. Toggle User Suspension
export async function toggleUserSuspension(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized.' }
    }

    const userId = formData.get('userId') as string
    const suspended = formData.get('suspended') === 'true'

    if (!userId) return { success: false, error: 'User ID is required.' }

    const { error } = await supabase
      .from('profiles')
      .update({ suspended })
      .eq('id', userId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 7. Toggle Professional/User Verification Checkmark
export async function toggleUserVerification(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized.' }
    }

    const userId = formData.get('userId') as string
    const verified = formData.get('verified') === 'true'

    if (!userId) return { success: false, error: 'User ID is required.' }

    // Update verified check on profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ verified })
      .eq('id', userId)

    if (profileError) return { success: false, error: profileError.message }

    // If they are a company, also keep company_details.verified in sync
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role === 'company') {
      await supabase
        .from('company_details')
        .update({ verified })
        .eq('user_id', userId)
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 8. Hard Delete User Account
export async function deleteUserAdmin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized.' }
    }

    const userId = formData.get('userId') as string
    if (!userId) return { success: false, error: 'User ID is required.' }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.auth.admin.deleteUser(userId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 9. Delete a Review directly
export async function deleteReviewAdmin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!(await checkAdmin(supabase))) {
      return { success: false, error: 'Unauthorized.' }
    }

    const reviewId = formData.get('reviewId') as string
    const professionalId = formData.get('professionalId') as string

    if (!reviewId) {
      return { success: false, error: 'Review ID is required.' }
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) return { success: false, error: error.message }

    if (professionalId) {
      revalidatePath(`/professionals/${professionalId}`)
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
