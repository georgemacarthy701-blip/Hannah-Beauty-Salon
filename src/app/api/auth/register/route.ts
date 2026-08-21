import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: NextRequest) {
  const adminClient = createAdminClient()

  try {
    const body = await req.json()
    const {
      email,
      password,
      role,
      fullName,
      phone,
      avatarUrl,
      age,
      dob,
      address,
      city,
      // Professional specifics
      professionTitle,
      bio,
      rate,
      skills,
      // Company specifics
      companyName,
      website,
      description,
      industry,
    } = body

    // 1. Basic validation
    if (!email || !password || !role || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required signup fields (email, password, role, fullName).' },
        { status: 400 }
      )
    }

    // 2. Create the user in Supabase auth with auto-confirm enabled
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: fullName,
        phone,
        avatar_cloudinary_url: avatarUrl || null,
      },
    })

    if (authError || !authData.user) {
      console.error('SERVER_REGISTRATION_AUTH_FAILED:', authError)
      return NextResponse.json(
        {
          success: false,
          error: authError?.message || 'Failed to create auth user account.',
          details: authError,
        },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Helper to delete user on rollback
    const rollback = async () => {
      await adminClient.auth.admin.deleteUser(userId)
    }

    // 3. Insert into public.profiles
    const parsedAge = age ? parseInt(age, 10) : null
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        role,
        full_name: fullName,
        phone: phone || null,
        age: isNaN(Number(parsedAge)) ? null : parsedAge,
        address: address || null,
        city: city || null,
        avatar_cloudinary_url: avatarUrl || null,
      })

    if (profileError) {
      console.error('SERVER_REGISTRATION_PROFILE_FAILED:', profileError)
      await rollback()
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save profile details: ${profileError.message}`,
          details: profileError,
        },
        { status: 500 }
      )
    }

    // 4. Insert role-specific profile details
    if (role === 'professional') {
      const parsedSkills = Array.isArray(skills)
        ? skills
        : skills
        ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
      const parsedRate = rate ? parseFloat(rate) : 0.00

      const { error: profError } = await adminClient
        .from('professional_details')
        .insert({
          user_id: userId,
          title: professionTitle || '',
          bio: bio || '',
          skills: parsedSkills,
          hourly_rate: isNaN(parsedRate) ? 0.00 : parsedRate,
          experience_years: 0, // default placeholder
        })

      if (profError) {
        console.error('SERVER_REGISTRATION_PROFESSIONAL_FAILED:', profError)
        await rollback()
        return NextResponse.json(
          {
            success: false,
            error: `Failed to save professional details: ${profError.message}`,
            details: profError,
          },
          { status: 500 }
        )
      }
    } else if (role === 'company') {
      const { error: compError } = await adminClient
        .from('company_details')
        .insert({
          user_id: userId,
          company_name: companyName || fullName,
          industry: industry || '',
          description: description || '',
          website: website || '',
          logo_cloudinary_url: avatarUrl || null,
        })

      if (compError) {
        console.error('SERVER_REGISTRATION_COMPANY_FAILED:', compError)
        await rollback()
        return NextResponse.json(
          {
            success: false,
            error: `Failed to save company details: ${compError.message}`,
            details: compError,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (err: any) {
    console.error('SERVER_REGISTRATION_CRASH:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
