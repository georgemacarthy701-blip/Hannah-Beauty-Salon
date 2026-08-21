'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadImage } from '@/app/actions/media'
import { updateProfile, updateProfessional, updateCompany, addPortfolioItem, deletePortfolioItem } from '@/app/actions/profiles'
import { User, Image as ImageIcon, CheckCircle, AlertCircle, Trash2, Plus, Loader2 } from 'lucide-react'

interface ProfileClientProps {
  role: string
  profile: any
  professional: any
  company: any
  portfolio: any[]
}

export default function ProfileClient({ role, profile, professional, company, portfolio }: ProfileClientProps) {
  const router = useRouter()

  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'role' | 'portfolio'>('general')

  // Error/Success state
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // General profile state
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [dob, setDob] = useState(profile?.date_of_birth || '')
  const [age, setAge] = useState(profile?.age?.toString() || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [cityRegion, setCityRegion] = useState(profile?.city || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_cloudinary_url || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Professional state
  const [professionTitle, setProfessionTitle] = useState(professional?.title || '')
  const [rate, setRate] = useState(professional?.hourly_rate?.toString() || '')
  const [skills, setSkills] = useState(professional?.skills?.join(', ') || '')
  const [bio, setBio] = useState(professional?.bio || '')
  const [availability, setAvailability] = useState(professional?.availability ?? true)

  // Company state
  const [companyName, setCompanyName] = useState(company?.company_name || '')
  const [website, setWebsite] = useState(company?.website || '')
  const [description, setDescription] = useState(company?.description || '')

  // Portfolio addition state
  const [portTitle, setPortTitle] = useState('')
  const [portDesc, setPortDesc] = useState('')
  const [portFile, setPortFile] = useState<File | null>(null)
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)

  // Age calculation
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDob(val)
    if (val) {
      const birthDate = new Date(val)
      const ageDiff = Date.now() - birthDate.getTime()
      const ageDate = new Date(ageDiff)
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970)
      setAge(calculatedAge.toString())
    } else {
      setAge('')
    }
  }

  // Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadImage(formData)
    if ('error' in res) {
      setError(res.error)
    } else {
      setAvatarUrl(res.url)
      setSuccess('Image uploaded to Cloudinary successfully! Press Save to finalize.')
    }
    setUploadingAvatar(false)
  }

  // General form save
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('age', age)
    formData.append('dob', dob)
    formData.append('address', address)
    formData.append('cityRegion', cityRegion)
    formData.append('phone', phone)
    formData.append('avatarUrl', avatarUrl)

    const res = await updateProfile(formData)
    if (res.success) {
      setSuccess('General profile details updated successfully!')
      router.refresh()
    } else {
      setError(res.error || 'Failed to update profile.')
    }
    setLoading(false)
  }

  // Role details save
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    let res
    if (role === 'professional') {
      const formData = new FormData()
      formData.append('professionTitle', professionTitle)
      formData.append('rate', rate)
      formData.append('skills', skills)
      formData.append('bio', bio)
      formData.append('availability', availability.toString())
      res = await updateProfessional(formData)
    } else {
      const formData = new FormData()
      formData.append('companyName', companyName)
      formData.append('website', website)
      formData.append('description', description)
      res = await updateCompany(formData)
    }

    if (res.success) {
      setSuccess('Role details saved successfully!')
      router.refresh()
    } else {
      setError(res.error || 'Failed to save details.')
    }
    setLoading(false)
  }

  // Add Portfolio item
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!portTitle || !portFile) {
      setError('Title and Image file are required for new portfolio items.')
      return
    }

    setUploadingPortfolio(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('title', portTitle)
    formData.append('description', portDesc)
    formData.append('file', portFile)

    const res = await addPortfolioItem(formData)
    if (res.success) {
      setSuccess('Portfolio item added successfully!')
      setPortTitle('')
      setPortDesc('')
      setPortFile(null)
      router.refresh()
    } else {
      setError(res.error || 'Failed to add portfolio item.')
    }
    setUploadingPortfolio(false)
  }

  // Delete Portfolio item
  const handleDeletePortfolio = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return

    setError(null)
    setSuccess(null)

    const res = await deletePortfolioItem(itemId)
    if (res.success) {
      setSuccess('Portfolio item removed.')
      router.refresh()
    } else {
      setError(res.error || 'Failed to delete portfolio item.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Profile Management</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Edit public records, availability, and showcase portfolio images</p>
      </div>

      {/* Alert Panels */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'general'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          General Identity
        </button>
        <button
          onClick={() => setActiveTab('role')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'role'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          {role === 'professional' ? 'Professional Trade' : 'Company Details'}
        </button>
        {role === 'professional' && (
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'portfolio'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Portfolio Images
          </button>
        )}
      </div>

      {/* Tab Content 1: General Info */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-6">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Identity, Age & Address</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Name</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone Number</label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date of Birth</label>
              <input
                id="dob"
                type="date"
                required
                value={dob}
                onChange={handleDobChange}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Age</label>
              <input
                id="age"
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Address</label>
              <input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="cityRegion" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">City / Region</label>
              <input
                id="cityRegion"
                type="text"
                required
                value={cityRegion}
                onChange={(e) => setCityRegion(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Avatar upload using Cloudinary */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {role === 'professional' ? 'Profile Avatar' : 'Company Logo'}
            </label>
            <div className="mt-2 flex items-center gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar Preview" className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <label className="relative cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" disabled={uploadingAvatar} />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingAvatar}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Settings
          </button>
        </form>
      )}

      {/* Tab Content 2: Professional Trade Details OR Company profile */}
      {activeTab === 'role' && (
        <form onSubmit={handleSaveRole} className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-6">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
            {role === 'professional' ? 'Service Professional Specifics' : 'Employer Profile details'}
          </h3>

          {role === 'professional' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="trade" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Profession / Trade Title</label>
                  <input
                    id="trade"
                    type="text"
                    required
                    value={professionTitle}
                    onChange={(e) => setProfessionTitle(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="rate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Hourly Rate (SLL)</label>
                  <input
                    id="rate"
                    type="number"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Skills (Comma-separated)</label>
                <input
                  id="skills"
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Availability status</label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="availability"
                      checked={availability === true}
                      onChange={() => setAvailability(true)}
                      className="h-4 w-4 border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium">Available for hire</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="availability"
                      checked={availability === false}
                      onChange={() => setAvailability(false)}
                      className="h-4 w-4 border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium">Busy / Unavailable</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Biography / Services Description</label>
                <textarea
                  id="bio"
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="compName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Name</label>
                  <input
                    id="compName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Website URL</label>
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="desc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Description</label>
                <textarea
                  id="desc"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Details
          </button>
        </form>
      )}

      {/* Tab Content 3: Portfolio Manager (Professional only) */}
      {activeTab === 'portfolio' && role === 'professional' && (
        <div className="space-y-8">
          {/* Add item */}
          <form onSubmit={handleAddPortfolio} className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Add New Portfolio Project</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pTitle" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Project Title</label>
                <input
                  id="pTitle"
                  type="text"
                  required
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  placeholder="Wiring at Aberdeen Store..."
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Project Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setPortFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-zinc-500 border border-zinc-300 rounded-lg cursor-pointer bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pDesc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea
                id="pDesc"
                value={portDesc}
                onChange={(e) => setPortDesc(e.target.value)}
                placeholder="Details of the materials, size, client requests..."
                rows={2}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={uploadingPortfolio}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {uploadingPortfolio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading portfolio...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add to Gallery
                </>
              )}
            </button>
          </form>

          {/* List items */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Active Portfolio Gallery ({portfolio.length})</h3>

            {portfolio.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No projects uploaded to your gallery.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {portfolio.map((item) => (
                  <div key={item.id} className="relative group overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt={item.title} className="h-48 w-full object-cover" />
                    <div className="p-4 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">{item.title}</h4>
                        <button
                          onClick={() => handleDeletePortfolio(item.id)}
                          className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.description && <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
