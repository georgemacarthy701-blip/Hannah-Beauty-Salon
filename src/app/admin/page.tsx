import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Fetch KPI Counts
  const { count: proUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professional')
  const { count: compUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'company')
  
  const { count: openJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open')
  const { count: closedJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'closed')
  
  const { count: totalApps } = await supabase.from('job_applications').select('*', { count: 'exact', head: true })
  const { count: pendingReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('resolved', false)
  const { count: totalReports } = await supabase.from('reports').select('*', { count: 'exact', head: true })

  // 2. Fetch Recent Activities (limited to 5)
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('id, title, status, created_at, company_profile:profiles!jobs_company_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentApps } = await supabase
    .from('job_applications')
    .select('id, created_at, status, jobs(title), profiles!job_applications_professional_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // 3. Fetch Pending Reports for resolution
  const { data: reports } = await supabase
    .from('reports')
    .select('*, profiles!reports_reporter_id_fkey(full_name)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const serializedData = JSON.parse(JSON.stringify({
    metrics: {
      proUsers: proUsers || 0,
      compUsers: compUsers || 0,
      openJobs: openJobs || 0,
      closedJobs: closedJobs || 0,
      totalApps: totalApps || 0,
      pendingReports: pendingReports || 0,
      totalReports: totalReports || 0,
    },
    recentUsers: recentUsers || [],
    recentJobs: (recentJobs || []).map(j => ({
      id: j.id,
      title: j.title,
      status: j.status,
      created_at: j.created_at,
      company_name: (j as any).company_profile?.full_name || 'Anonymous Company'
    })),
    recentApps: (recentApps || []).map(a => ({
      id: a.id,
      created_at: a.created_at,
      status: a.status,
      job_title: (a as any).jobs?.title || 'Job Listing',
      pro_name: (a as any).profiles?.full_name || 'Service Pro'
    })),
    reports: reports || [],
  }))

  return <DashboardClient {...serializedData} />
}
