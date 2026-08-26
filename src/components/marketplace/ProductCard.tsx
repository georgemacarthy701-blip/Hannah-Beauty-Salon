'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatImageUrl } from '@/utils/image'
import { MapPin, MessageSquare, Phone, Trash2, X, ExternalLink, Loader2 } from 'lucide-react'
import { deleteProduct } from '@/app/actions/products'
import { getOrCreateConversation } from '@/app/actions/messages'
import Link from 'next/link'

interface ProductCardProps {
  product: any
  currentUser: any
  isAdmin: boolean
  onProductDeleted: () => void
}

export default function ProductCard({ product, currentUser, isAdmin, onProductDeleted }: ProductCardProps) {
  const router = useRouter()
  const [showDetail, setShowDetail] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)

  const seller = product.profiles || {}
  const sellerAvatar = seller.avatar_cloudinary_url || seller.avatar_url || seller.image || null
  const canDelete = currentUser && (product.seller_id === currentUser.id || isAdmin)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this product listing?')) return

    setIsDeleting(true)
    try {
      const res = await deleteProduct(product.id)
      if (!res.error) {
        onProductDeleted()
      } else {
        alert(res.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMessageSeller = async () => {
    if (!currentUser) {
      router.push('/login?redirectTo=/marketplace')
      return
    }

    setIsStartingChat(true)
    try {
      const res = await getOrCreateConversation(product.seller_id)
      if (res && 'conversationId' in res && res.conversationId) {
        router.push(`/messages?conversationId=${res.conversationId}`)
      } else if (res && 'error' in res) {
        alert(res.error)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to start chat thread.')
    } finally {
      setIsStartingChat(false)
    }
  }

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 hover:shadow-md transition-all cursor-pointer relative"
      >
        {/* Product image */}
        <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={formatImageUrl(product.image_url, { width: 500, height: 350, crop: 'fill' })}
            alt={product.title}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />

          {/* Delete listing badge */}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-rose-600 text-white rounded-full p-2 transition-colors z-10"
              title="Delete product listing"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Category tag */}
          <div className="absolute bottom-2.5 left-2.5 bg-black/60 text-emerald-400 font-bold px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
            {product.category}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col space-y-2.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">
              {product.title}
            </h3>
            <span className="text-sm font-black text-emerald-500 shrink-0">
              NLe {product.price}
            </span>
          </div>

          {product.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{product.location}</span>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {sellerAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formatImageUrl(sellerAvatar, { width: 48, height: 48, crop: 'fill' })}
                  alt={seller.full_name}
                  className="h-6 w-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                  {seller.full_name?.[0] || 'U'}
                </div>
              )}
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold truncate max-w-[120px]">
                {seller.full_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Overlay Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header image banner */}
            <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formatImageUrl(product.image_url, { width: 800 })}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setShowDetail(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Row */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="inline-block bg-emerald-500/10 text-emerald-500 font-bold px-2.5 py-0.5 rounded-lg text-xs uppercase tracking-wider mb-2">
                    {product.category}
                  </span>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white">{product.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{product.location}</span>
                  </div>
                </div>
                
                <div className="text-left sm:text-right shrink-0">
                  <span className="block text-2xl font-black text-emerald-500">
                    NLe {product.price}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    Listed on {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Description block */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Description</h3>
                  <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Seller Row */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Link href={`/professionals/${product.seller_id}`}>
                    {sellerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formatImageUrl(sellerAvatar, { width: 96, height: 96, crop: 'fill' })}
                        alt={seller.full_name}
                        className="h-11 w-11 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400 text-base">
                        {seller.full_name?.[0] || 'U'}
                      </div>
                    )}
                  </Link>

                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Link href={`/professionals/${product.seller_id}`} className="hover:text-emerald-500 transition-colors">
                        {seller.full_name}
                      </Link>
                    </h4>
                    <p className="text-xs text-zinc-400 capitalize">{seller.role || 'Professional Seller'}</p>
                  </div>
                </div>

                {/* Call & Chat Triggers */}
                <div className="flex gap-3 w-full sm:w-auto">
                  {seller.phone && (
                    <a
                      href={`tel:${seller.phone}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 px-5 py-2.5 text-xs font-semibold transition-colors"
                    >
                      <Phone className="h-4 w-4 text-emerald-500" />
                      <span>Call Seller</span>
                    </a>
                  )}

                  {(!currentUser || currentUser.id !== product.seller_id) && (
                    <button
                      onClick={handleMessageSeller}
                      disabled={isStartingChat}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-5 py-2.5 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {isStartingChat ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      <span>Message Seller</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
