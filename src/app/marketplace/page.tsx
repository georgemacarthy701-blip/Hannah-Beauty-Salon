import { createClient } from '@/utils/supabase/server'
import MarketplaceClient from './MarketplaceClient'

export const revalidate = 0

export default async function MarketplacePage() {
  const supabase = await createClient()

  // 1. Fetch current authenticated user credentials & profile roles
  const { data: { user } } = await supabase.auth.getUser()
  let currentUser = null
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      currentUser = profile
      isAdmin = profile.role === 'admin'
    }
  }

  // 2. Fetch all products listings with seller relations
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:seller_id(id, full_name, role, avatar_cloudinary_url, phone)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching marketplace products:', error)
  }

  const initialProducts = products || []

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <MarketplaceClient
        initialProducts={initialProducts}
        currentUser={currentUser}
        isAdmin={isAdmin}
      />
    </div>
  )
}
