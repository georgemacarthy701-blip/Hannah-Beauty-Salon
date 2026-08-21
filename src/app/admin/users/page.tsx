import { createClient } from '@/utils/supabase/server'
import UserModerationClient from './UserModerationClient'

export const revalidate = 0

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Fetch all registered user profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, age, address, city, suspended, verified, created_at')
    .order('created_at', { ascending: false })

  const serializedUsers = JSON.parse(JSON.stringify(profiles || []))

  return (
    <UserModerationClient initialUsers={serializedUsers} />
  )
}
