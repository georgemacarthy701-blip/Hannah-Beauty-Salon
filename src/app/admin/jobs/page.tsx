import { createClient } from '@/utils/supabase/server'
import JobsManagementClient from './JobsManagementClient'

export const revalidate = 0

export default async function AdminJobsPage() {
  const supabase = await createClient()

  // 1. Fetch all jobs with poster attribution
  const { data: rawJobs } = await supabase
    .from('jobs')
    .select('*, company_profile:profiles!jobs_company_id_fkey(id, full_name)')
    .order('created_at', { ascending: false })

  const jobs = (rawJobs || []).map(j => {
    const profile = (j as any).company_profile || {}
    return {
      ...j,
      company_name: profile.full_name || 'Anonymous'
    }
  })

  // 2. Fetch all companies and admins for job attribution dropdowns
  const { data: companyProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['company', 'admin'])
    .order('full_name')

  const serializedData = JSON.parse(JSON.stringify({
    jobs,
    companies: companyProfiles || []
  }))

  return (
    <JobsManagementClient
      initialJobs={serializedData.jobs}
      companies={serializedData.companies}
    />
  )
}
