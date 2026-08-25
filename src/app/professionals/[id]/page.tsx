import InquiryForm from './InquiryForm'
import ReviewForm from './ReviewForm'
import { deleteReviewAdmin } from '@/app/actions/admin'
import { formatImageUrl } from '@/utils/image'
import { MapPin, Star, Calendar, UserCheck, ArrowLeft, Send, Phone, MessageSquare, ShieldAlert } from 'lucide-react'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateConversation } from '@/app/actions/messages'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProfessionalDetailsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch Professional details (using user_id / profile ID)
  const { data: professional } = await supabase
    .from('professional_details')
    .select('*, profiles(*, portfolio_items(*))')
    .eq('user_id', id)
    .single()

  // 2. Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles!reviews_reviewer_id_fkey(full_name)')
    .eq('professional_id', id)
    .order('created_at', { ascending: false })

  if (!professional) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">Professional not found.</p>
          <Link href="/professionals" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  const activeProf = professional
  const activeReviews = reviews || []
  activeProf.portfolio_items = activeProf.profiles?.portfolio_items || []

  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  // Calculate rating stats
  const totalReviews = activeReviews.length
  const avgRating = totalReviews > 0 ? (activeReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews).toFixed(1) : 'N/A'

  const profile = activeProf.profiles || {}
  const avatarUrl = profile.avatar_cloudinary_url || profile.avatar_url || profile.image || null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      <Link href="/professionals" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card & Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
              <div className="flex gap-4 items-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formatImageUrl(avatarUrl, { width: 200, height: 200, crop: 'fill' })}
                    alt={profile.full_name || 'Professional Profile'}
                    className="h-20 w-20 rounded-full object-cover border-2 border-emerald-500/20"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-3xl font-black dark:bg-emerald-950/30 dark:text-emerald-400">
                    {profile.full_name?.[0] || 'P'}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    {activeProf.profiles?.full_name}
                    <span className="text-sm font-normal text-zinc-500">({activeProf.profiles?.age ? `${activeProf.profiles.age} yrs old` : 'N/A'})</span>
                  </h1>
                  <p className="text-emerald-500 font-bold">{activeProf.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-sm font-semibold shrink-0">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{avgRating} ({totalReviews} Reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-zinc-100 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>{activeProf.profiles?.address ? `${activeProf.profiles.address}, ${activeProf.profiles.city || ''}` : 'Sierra Leone'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Le {activeProf.hourly_rate}/hr</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className={activeProf.availability ? 'text-emerald-500 font-medium' : 'text-rose-500'}>
                  {activeProf.availability ? 'Available for Hire' : 'Currently Busy'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>{activeProf.profiles?.phone || 'Private'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg">Biography</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{activeProf.bio}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {activeProf.skills?.map((skill: string) => (
                  <span key={skill} className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Gallery */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
            <h3 className="font-bold text-lg">Professional Portfolio</h3>
            {activeProf.portfolio_items?.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No portfolio items uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeProf.portfolio_items?.map((item: any) => (
                  <div key={item.id} className="group overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-44 w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">{item.title}</h4>
                      {item.description && <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-6">
            <h3 className="font-bold text-lg">Client Reviews ({totalReviews})</h3>
            {activeReviews.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No reviews yet. Be the first to leave feedback!</p>
            ) : (
              <div className="space-y-4 divider-y">
                {activeReviews.map((rev: any) => (
                  <div key={rev.id} className="space-y-2 pb-4 border-b border-zinc-100 last:border-0 last:pb-0 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">{rev.profiles?.full_name || 'Verified Client'}</h4>
                      <div className="flex items-center gap-3">
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < rev.rating ? 'fill-amber-500' : 'text-zinc-200 dark:text-zinc-800'}`} />
                          ))}
                        </div>
                        {isAdmin && (
                          <form action={deleteReviewAdmin as any}>
                            <input type="hidden" name="reviewId" value={rev.id} />
                            <input type="hidden" name="professionalId" value={activeProf.user_id} />
                            <button
                              type="submit"
                              className="text-red-500 hover:text-red-700 text-[10px] font-bold hover:underline transition-colors"
                              title="Delete Review"
                            >
                              Delete
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                    {rev.comment && <p className="text-sm text-zinc-600 dark:text-zinc-400">{rev.comment}</p>}
                    <span className="text-[10px] text-zinc-400 block">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Submit Review & Contact Inquiry */}
        <div className="space-y-6">
          {user && user.id !== activeProf.user_id && (
            <form action={async () => {
              'use server'
              const res = await getOrCreateConversation(activeProf.user_id)
              if (res && 'conversationId' in res && res.conversationId) {
                redirect(`/messages?conversationId=${res.conversationId}`)
              }
            }}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 py-3 text-sm font-bold text-zinc-900 dark:text-white shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                Chat with Professional
              </button>
            </form>
          )}

          {!user && (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 hover:bg-zinc-850 py-3 text-sm font-bold text-zinc-300 shadow-sm transition-colors text-center"
            >
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              Sign in to Message
            </Link>
          )}

          <InquiryForm professionalId={activeProf.user_id} />

          {user && user.id !== activeProf.user_id ? (
            <ReviewForm professionalId={activeProf.user_id} />
          ) : !user ? (
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-100/50 p-6 text-center dark:border-zinc-800/80 dark:bg-zinc-900/20 text-xs">
              <p className="text-zinc-500">Sign in to post a public review on this service profile.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
