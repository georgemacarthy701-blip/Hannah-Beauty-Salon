import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'

export const revalidate = 0

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role || 'professional'

  // 2. Fetch Profile Info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Fetch Role-Specific Details
  let professionalDetails = null
  let companyDetails = null
  let portfolioItems = []

  if (role === 'professional') {
    const { data: prof } = await supabase
      .from('professional_details')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    professionalDetails = prof

    if (prof) {
      const { data: portfolio } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      portfolioItems = portfolio || []
    }
  } else if (role === 'company') {
    const { data: comp } = await supabase
      .from('company_details')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    companyDetails = comp
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <ProfileClient
        role={role}
        profile={JSON.parse(JSON.stringify(profile))}
        professional={JSON.parse(JSON.stringify(professionalDetails))}
        company={JSON.parse(JSON.stringify(companyDetails))}
        portfolio={JSON.parse(JSON.stringify(portfolioItems))}
      />
    </div>
  )
}
