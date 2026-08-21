'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { uploadImage } from '@/app/actions/media'
import { Loader2, Mail, Lock, Phone, User, Calendar, MapPin, Briefcase, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  // Step state
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'professional' | 'company'>('professional')

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')

  // Profile Identity & Location fields
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [cityRegion, setCityRegion] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  // Professional specific fields
  const [professionTitle, setProfessionTitle] = useState('')
  const [bio, setBio] = useState('')
  const [rate, setRate] = useState('')
  const [skills, setSkills] = useState('')

  // Company specific fields
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')

  // Form Submission/Error State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle Date of Birth Change & Auto-Calculate Age
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

  // Handle Media Upload to Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadImage(formData)
    if ('error' in res) {
      setError(res.error)
    } else {
      setAvatarUrl(res.url)
    }
    setUploading(false)
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (step === 1) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (uploading) {
        setError('Please wait for the image upload to complete.')
        return
      }
      if (!fullName || !dob || !address || !cityRegion) {
        setError('Please fill out all identity and address fields.')
        return
      }
      setStep(3)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Post to Route Handler /api/auth/register
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
          fullName,
          phone,
          avatarUrl,
          age,
          dob,
          address,
          city: cityRegion, // map cityRegion input to city field
          professionTitle,
          bio,
          rate,
          skills,
          companyName,
          website,
          description,
        }),
      })

      const resData = await response.json()

      if (!response.ok || !resData.success) {
        console.error('REGISTRATION_FAILED:', JSON.stringify(resData, null, 2))
        setError(`Registration failed: ${resData.error || 'Server error'}`)
        setLoading(false)
        return
      }

      // 2. Sign user in to establish browser session/cookies
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('SIGNIN_AFTER_REGISTRATION_FAILED:', JSON.stringify(signInError, null, 2))
        setError(`Account created successfully, but automatic login failed: ${signInError.message}`)
        setLoading(false)
        return
      }

      // 3. Force state update & redirect
      startTransition(() => {
        router.push('/dashboard')
        router.refresh()
      })
    } catch (err: any) {
      console.error('REGISTRATION_FAILED:', JSON.stringify(err, null, 2))
      setError(err.message || 'An unexpected error occurred during signup.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-xl space-y-8 rounded-2xl border border-zinc-200/80 bg-white/60 p-8 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60">
        <div className="text-center">
          <h2 className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Step {step} of 3: {step === 1 ? 'Credentials' : step === 2 ? 'Identity & Address' : 'Profile Specifics'}
          </p>

          {/* Progress Indicator */}
          <div className="mt-4 flex justify-center gap-2">
            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Account Type & Credentials */}
        {step === 1 && (
          <form className="space-y-6" onSubmit={handleNextStep}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">I want to register as a:</label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('professional')}
                    className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                      role === 'professional'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800'
                    }`}
                  >
                    <User className="mb-2 h-6 w-6 text-emerald-500" />
                    <span className="font-semibold text-sm">Service Professional</span>
                    <span className="text-xs text-zinc-500 mt-1">Showcase my skills & find jobs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('company')}
                    className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                      role === 'company'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800'
                    }`}
                  >
                    <Briefcase className="mb-2 h-6 w-6 text-emerald-500" />
                    <span className="font-semibold text-sm">Company / Employer</span>
                    <span className="text-xs text-zinc-500 mt-1">Post openings & hire talent</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone Number</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                    placeholder="+232 77 123456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pass" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="pass"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm Password</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="confirm"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95"
              >
                Continue to Identity & Location
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Identity & Location Fields */}
        {step === 2 && (
          <form className="space-y-6" onSubmit={handleNextStep}>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {role === 'professional' ? 'Full Name' : 'Authorized Representative Name'}
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date of Birth</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <input
                      id="dob"
                      type="date"
                      required
                      value={dob}
                      onChange={handleDobChange}
                      className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Age</label>
                  <input
                    id="age"
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3 mt-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Calculated automatically"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Address</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <input
                      id="address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                      placeholder="12 Lumley Beach Road"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cityRegion" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">City / Region</label>
                  <input
                    id="cityRegion"
                    type="text"
                    required
                    value={cityRegion}
                    onChange={(e) => setCityRegion(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3 mt-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Freetown, Western Area"
                  />
                </div>
              </div>

              {/* Avatar Upload (Cloudinary) */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {role === 'professional' ? 'Profile Picture' : 'Company Logo'}
                </label>
                <div className="mt-2 flex items-center gap-4">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Preview" className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <label className="relative cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {uploading ? 'Uploading...' : 'Choose Image'}
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50"
              >
                Next: Profile Specifics
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Professional Specifics OR Company Details */}
        {step === 3 && (
          <form className="space-y-6" onSubmit={handleRegister}>
            {role === 'professional' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="trade" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Profession Title / Primary Trade</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <input
                      id="trade"
                      type="text"
                      required
                      value={professionTitle}
                      onChange={(e) => setProfessionTitle(e.target.value)}
                      className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                      placeholder="Electrician, Web Developer, Plumber..."
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Hourly Rate (SLL / Hour)</label>
                  <input
                    id="rate"
                    type="number"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3 mt-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="150"
                  />
                </div>

                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Skills (Comma-separated)</label>
                  <input
                    id="skills"
                    type="text"
                    required
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3 mt-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Wiring, Maintenance, Solar Installation"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Biography / Short Bio</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start pt-3 pl-3 text-zinc-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <textarea
                      id="bio"
                      required
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                      placeholder="Write a brief introduction about your experience, services, and expertise..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="compName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Name</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <input
                      id="compName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                      placeholder="Leone Trading Ltd"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Website URL</label>
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 px-3 mt-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label htmlFor="desc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Description</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start pt-3 pl-3 text-zinc-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <textarea
                      id="desc"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-zinc-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                      placeholder="Tell job seekers about your company, values, and sector..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Profile...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-emerald-500 hover:text-emerald-600 dark:text-emerald-400">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
