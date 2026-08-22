import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import JobsClient from './JobsClient'

export const revalidate = 0

export default async function DashboardJobsPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'company') {
    redirect('/dashboard')
  }

  // 2. Fetch Company details
  const { data: company } = await supabase
    .from('company_details')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) {
    redirect('/dashboard/profile')
  }

  // 3. Fetch Company's posted jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', user.id)
    .order('created_at', { ascending: false })

  let jobsWithApplications = []

  if (jobs && jobs.length > 0) {
    const jobIds = jobs.map(j => j.id)

    // Fetch applications for these jobs, joining professional profiles
    const { data: applications } = await supabase
      .from('job_applications')
      .select('*, profiles!job_applications_professional_id_fkey(*, professional_details(*))')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false })

    const mappedApps = (applications || []).map(app => {
      const profile = (app as any).profiles || {}
      let profDetails = profile.professional_details || {}
      if (Array.isArray(profDetails)) {
        profDetails = profDetails[0] || {}
      }
      return {
        ...app,
        professional_details: {
          ...profDetails,
          profiles: profile
        }
      }
    })

    jobsWithApplications = jobs.map(job => {
      return {
        ...job,
        applications: mappedApps.filter(app => app.job_id === job.id) || []
      }
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <JobsClient companyId={user.id} initialJobs={JSON.parse(JSON.stringify(jobsWithApplications))} />
    </div>
  )
}
