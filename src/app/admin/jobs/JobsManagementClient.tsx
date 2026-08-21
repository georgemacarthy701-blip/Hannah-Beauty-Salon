'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { postJobAdmin, editJobAdmin, deleteJobAdmin } from '@/app/actions/admin'
import { Plus, Search, Filter, Edit, Trash2, X, AlertCircle, CheckCircle, Briefcase, HelpCircle, Loader2 } from 'lucide-react'

interface Job {
  id: string
  company_id: string
  company_name: string
  title: string
  description: string
  category: string
  budget: number
  location_address: string
  status: string
  created_at: string
}

interface Company {
  id: string
  full_name: string
  role: string
}

interface JobsManagementClientProps {
  initialJobs: Job[]
  companies: Company[]
}

const CATEGORIES = [
  'Construction & Carpentry',
  'Plumbing',
  'Electrical Work',
  'Air Conditioning & Cooling',
  'House Painting',
  'Masonry & Bricklaying',
  'Gardening & Landscaping',
  'Cleaning Services',
  'General Maintenance & Repairs',
  'Other Services'
]

export default function JobsManagementClient({ initialJobs, companies }: JobsManagementClientProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  
  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  
  // Form loading / alerts state
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add Job Form fields
  const [postTitle, setPostTitle] = useState('')
  const [postCategory, setPostCategory] = useState(CATEGORIES[0])
  const [postDescription, setPostDescription] = useState('')
  const [postBudget, setPostBudget] = useState('')
  const [postLocation, setPostLocation] = useState('')
  const [postCompanyId, setPostCompanyId] = useState(companies[0]?.id || '')

  // Edit Job Form fields
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editCompanyId, setEditCompanyId] = useState('')

  // Filter & Search Logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Open Edit Modal
  const openEditModal = (job: Job) => {
    setSelectedJob(job)
    setEditTitle(job.title)
    setEditCategory(job.category)
    setEditDescription(job.description)
    setEditBudget(job.budget.toString())
    setEditLocation(job.location_address)
    setEditStatus(job.status)
    setEditCompanyId(job.company_id)
    setIsEditModalOpen(true)
  }

  // Handle Post Action
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('title', postTitle)
      formData.append('category', postCategory)
      formData.append('description', postDescription)
      formData.append('budget', postBudget)
      formData.append('location_address', postLocation)
      formData.append('company_id', postCompanyId)

      const res = await postJobAdmin(formData)
      if (res.success) {
        setSuccess('Job posting published successfully to LeoneLink feed.')
        setIsPostModalOpen(false)
        // Reset form
        setPostTitle('')
        setPostDescription('')
        setPostBudget('')
        setPostLocation('')
        router.refresh()
      } else {
        setError(res.error || 'Failed to post job.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Edit Action
  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('jobId', selectedJob.id)
      formData.append('title', editTitle)
      formData.append('category', editCategory)
      formData.append('description', editDescription)
      formData.append('budget', editBudget)
      formData.append('location_address', editLocation)
      formData.append('status', editStatus)
      formData.append('company_id', editCompanyId)

      const res = await editJobAdmin(formData)
      if (res.success) {
        setSuccess('Job listing updated successfully.')
        setIsEditModalOpen(false)
        router.refresh()
      } else {
        setError(res.error || 'Failed to update job.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete Action
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to permanently delete this job listing? Associated applications will be deleted.')) return
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('jobId', jobId)

      const res = await deleteJobAdmin(formData)
      if (res.success) {
        setSuccess('Job listing deleted successfully.')
        router.refresh()
      } else {
        setError(res.error || 'Failed to delete job.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-500" />
            Job Listings CMS
          </h1>
          <p className="text-sm text-zinc-500">Edit active job boards, delete expired jobs, or post new ones directly.</p>
        </div>
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Post Job as Admin
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs">
        <div className="relative">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-zinc-400" />
          <input
            type="text"
            placeholder="Search by job title, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center text-zinc-400 gap-1.5 justify-end pr-2">
          <Filter className="h-4 w-4" />
          <span>{filteredJobs.length} Listings matches</span>
        </div>
      </div>

      {/* Jobs Listing Table */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80 font-semibold text-zinc-500">
                <th className="p-4">Job Title</th>
                <th className="p-4">Employer / Company</th>
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Status</th>
                <th className="p-4">Posted Date</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-400">
                    No matching listings found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4 font-bold text-zinc-900 dark:text-white max-w-[200px] truncate">{job.title}</td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">{job.company_name}</td>
                    <td className="p-4 text-zinc-500">{job.category}</td>
                    <td className="p-4 text-zinc-500 truncate max-w-[150px]">{job.location_address}</td>
                    <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">Le {job.budget}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        job.status === 'open'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : job.status === 'closed'
                          ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">{new Date(job.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(job)}
                          className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 transition-colors"
                          title="Edit Listing"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="rounded p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-700 transition-colors"
                          title="Delete Listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Post Job Listing as Admin</h3>
              <button onClick={() => setIsPostModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePostJob} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Expert Home Plumber"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Budget (SLE)</label>
                  <input
                    type="number"
                    required
                    value={postBudget}
                    onChange={(e) => setPostBudget(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Location Address</label>
                <input
                  type="text"
                  required
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="e.g. 45 Wilkinson Rd, Freetown"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Attribute to Registered Company/Admin</label>
                <select
                  value={postCompanyId}
                  onChange={(e) => setPostCompanyId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  placeholder="Provide explicit responsibilities, expectations, and timing details..."
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Edit Job Listing</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditJob} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Budget (SLE)</label>
                  <input
                    type="number"
                    required
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Location Address</label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Reassign Employer/Company</label>
                <select
                  value={editCompanyId}
                  onChange={(e) => setEditCompanyId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
