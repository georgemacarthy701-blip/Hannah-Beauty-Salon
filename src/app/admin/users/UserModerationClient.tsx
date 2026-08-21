'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleUserSuspension, toggleUserVerification, deleteUserAdmin } from '@/app/actions/admin'
import { Search, ShieldAlert, CheckCircle, AlertCircle, Trash2, Shield, User, Award, EyeOff, Eye, Users } from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  role: string
  phone: string | null
  age: number | null
  address: string | null
  city: string | null
  suspended: boolean
  verified: boolean
  created_at: string
}

interface UserModerationClientProps {
  initialUsers: UserProfile[]
}

export default function UserModerationClient({ initialUsers }: UserModerationClientProps) {
  const router = useRouter()
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Alert state
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Filter Logic
  const filteredUsers = initialUsers.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.phone && user.phone.includes(searchTerm))
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    
    let matchesStatus = true
    if (selectedStatus === 'suspended') matchesStatus = user.suspended
    else if (selectedStatus === 'active') matchesStatus = !user.suspended
    else if (selectedStatus === 'verified') matchesStatus = user.verified
    else if (selectedStatus === 'unverified') matchesStatus = !user.verified

    return matchesSearch && matchesRole && matchesStatus
  })

  // Handle Suspend Toggle
  const handleToggleSuspend = async (userId: string, currentSuspended: boolean) => {
    setLoadingId(userId)
    setError(null)
    setSuccess(null)

    try {
      const nextSuspended = !currentSuspended
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('suspended', nextSuspended.toString())

      const res = await toggleUserSuspension(formData)
      if (res.success) {
        setSuccess(`User status successfully updated to ${nextSuspended ? 'Suspended' : 'Active'}.`)
        router.refresh()
      } else {
        setError(res.error || 'Failed to toggle suspension status.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoadingId(null)
    }
  }

  // Handle Verify Toggle
  const handleToggleVerify = async (userId: string, currentVerified: boolean) => {
    setLoadingId(userId)
    setError(null)
    setSuccess(null)

    try {
      const nextVerified = !currentVerified
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('verified', nextVerified.toString())

      const res = await toggleUserVerification(formData)
      if (res.success) {
        setSuccess(`User verification updated successfully.`)
        router.refresh()
      } else {
        setError(res.error || 'Failed to update verification status.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoadingId(null)
    }
  }

  // Handle Delete Action
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`CAUTION: Are you sure you want to permanently delete the account of "${userName}"? This will delete all their listings, profile details, applications, and their auth login credential. This action is irreversible.`)) return
    
    setLoadingId(userId)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('userId', userId)

      const res = await deleteUserAdmin(formData)
      if (res.success) {
        setSuccess(`User account "${userName}" has been permanently purged from the system.`)
        router.refresh()
      } else {
        setError(res.error || 'Failed to purge user account.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-500" />
          User Account Moderation
        </h1>
        <p className="text-sm text-zinc-500">Suspend accounts, grant verification badges, or permanently wipe abusive users.</p>
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
        <div>
          <input
            type="text"
            placeholder="Search by name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="professional">Professional</option>
            <option value="company">Company</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
            <option value="verified">Verified Users</option>
            <option value="unverified">Unverified Users</option>
          </select>
        </div>

        <div className="flex items-center text-zinc-400 gap-1.5 justify-end pr-2 font-medium">
          <span>{filteredUsers.length} Users found</span>
        </div>
      </div>

      {/* Users Listing Table */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80 font-semibold text-zinc-500">
                <th className="p-4">Full Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Age</th>
                <th className="p-4">Location</th>
                <th className="p-4">Verification</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4 font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <User className="h-4 w-4" />
                      </div>
                      <span>{user.full_name}</span>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        user.role === 'admin'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                          : user.role === 'company'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500">{user.phone || 'N/A'}</td>
                    <td className="p-4 text-zinc-500">{user.age || 'N/A'}</td>
                    <td className="p-4 text-zinc-500 max-w-[150px] truncate">
                      {user.address ? `${user.address}, ${user.city || ''}` : 'Sierra Leone'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 font-bold ${user.verified ? 'text-emerald-500' : 'text-zinc-400'}`}>
                        <Award className="h-4.5 w-4.5" />
                        {user.verified ? 'Verified' : 'Standard'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        user.suspended
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {user.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleVerify(user.id, user.verified)}
                          disabled={loadingId === user.id}
                          className="rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-1.5 font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
                          title={user.verified ? 'Revoke Verification' : 'Verify Account / Badge'}
                        >
                          <Award className={`h-4 w-4 ${user.verified ? 'text-emerald-500' : 'text-zinc-400'}`} />
                        </button>
                        <button
                          onClick={() => handleToggleSuspend(user.id, user.suspended)}
                          disabled={loadingId === user.id}
                          className={`rounded-lg p-1.5 font-bold transition-colors ${
                            user.suspended
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/30'
                          }`}
                          title={user.suspended ? 'Unsuspend Account' : 'Suspend / Block Login'}
                        >
                          {user.suspended ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            disabled={loadingId === user.id}
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 p-1.5 transition-colors"
                            title="Purge / Delete User Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
