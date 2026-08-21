'use server'

import { createClient } from '@/utils/supabase/server'
import { uploadImage } from '@/app/actions/media'
import { revalidatePath } from 'next/cache'

// 1. Update Core Profile details
export async function updateProfile(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const fullName = formData.get('fullName') as string
    const age = formData.get('age') as string
    const dob = formData.get('dob') as string
    const address = formData.get('address') as string
    const cityRegion = formData.get('cityRegion') as string
    const phone = formData.get('phone') as string
    const avatarUrl = formData.get('avatarUrl') as string

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        age: age ? parseInt(age) : null,
        address,
        city: cityRegion,
        phone,
        avatar_cloudinary_url: avatarUrl || null,
      })
      .eq('id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 2. Update Professional Trade details
export async function updateProfessional(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const professionTitle = formData.get('professionTitle') as string
    const rate = formData.get('rate') as string
    const skills = formData.get('skills') as string
    const bio = formData.get('bio') as string
    const availability = formData.get('availability') === 'true'

    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []

    const { error } = await supabase
      .from('professional_details')
      .update({
        title: professionTitle,
        hourly_rate: rate ? parseFloat(rate) : 0,
        skills: skillsArray,
        bio,
        availability,
      })
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 3. Update Company corporate details
export async function updateCompany(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const companyName = formData.get('companyName') as string
    const website = formData.get('website') as string
    const description = formData.get('description') as string

    const { error } = await supabase
      .from('company_details')
      .update({
        company_name: companyName,
        website,
        description,
      })
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 4. Add Portfolio Item (Includes Cloudinary upload in action)
export async function addPortfolioItem(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File | null

    if (!title || !file) {
      return { success: false, error: 'Title and Image file are required.' }
    }

    // B. Upload to Cloudinary
    const uploadForm = new FormData()
    uploadForm.append('file', file)
    const res = await uploadImage(uploadForm)

    if ('error' in res) {
      return { success: false, error: res.error }
    }

    // C. Save to portfolio_items table
    const { error: insertError } = await supabase
      .from('portfolio_items')
      .insert({
        user_id: user.id,
        cloudinary_public_id: res.publicId,
        image_url: res.url,
        title,
        description,
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}

// 5. Delete Portfolio Item
export async function deletePortfolioItem(portfolioId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', portfolioId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error occurred' }
  }
}
