'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, Trash2, Send, Loader2 } from 'lucide-react'
import { toggleLike, addComment, deleteComment, deletePost } from '@/app/actions/posts'
import { formatImageUrl } from '@/utils/image'
import FeedImage from './FeedImage'

interface PostCardProps {
  post: any
  currentUser: any
  isAdmin: boolean
  onPostAction: () => void
}

export default function PostCard({ post, currentUser, isAdmin, onPostAction }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  // Optimistic Like State
  const likesList = post.post_likes || []
  const initiallyLiked = currentUser ? likesList.some((l: any) => l.user_id === currentUser.id) : false
  const [isLiked, setIsLiked] = useState(initiallyLiked)
  const [likesCount, setLikesCount] = useState(likesList.length)
  const [isTogglingLike, setIsTogglingLike] = useState(false)

  const author = post.profiles || {}
  const authorAvatar = author.avatar_cloudinary_url || author.avatar_url || author.image || null
  const commentsList = post.post_comments || []

  const handleLikeToggle = async () => {
    if (!currentUser) return
    if (isTogglingLike) return

    // Optimistically update
    setIsLiked(!isLiked)
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)
    setIsTogglingLike(true)

    try {
      const res = await toggleLike(post.id)
      if (res.error) {
        // Rollback on error
        setIsLiked(isLiked)
        setLikesCount(likesCount)
      } else {
        onPostAction()
      }
    } catch (err) {
      // Rollback
      setIsLiked(isLiked)
      setLikesCount(likesCount)
    } finally {
      setIsTogglingLike(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const res = await addComment(post.id, newComment)
      if (!res.error) {
        setNewComment('')
        onPostAction()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId) return
    if (!confirm('Are you sure you want to delete this comment?')) return

    setDeletingCommentId(commentId)
    try {
      const res = await deleteComment(commentId)
      if (!res.error) {
        onPostAction()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingCommentId(null)
    }
  }

  const handleDeletePost = async () => {
    if (isDeletingPost) return
    if (!confirm('Are you sure you want to delete this post?')) return

    setIsDeletingPost(true)
    try {
      const res = await deletePost(post.id)
      if (!res.error) {
        onPostAction()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeletingPost(false)
    }
  }

  // Format timestamp nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateStr
    }
  }

  const canDeletePost = currentUser && (post.author_id === currentUser.id || isAdmin)

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 items-center">
          <Link href={`/professionals/${post.author_id}`} className="shrink-0">
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formatImageUrl(authorAvatar, { width: 96, height: 96, crop: 'fill' })}
                alt={author.full_name}
                className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                {author.full_name?.[0] || 'U'}
              </div>
            )}
          </Link>

          <div>
            <Link
              href={`/professionals/${post.author_id}`}
              className="font-bold text-sm text-zinc-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              {author.full_name}
            </Link>
            {author.role && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                {author.role === 'professional' ? 'Service Professional' : author.role}
              </p>
            )}
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              {formatDate(post.created_at)}
            </span>
          </div>
        </div>

        {canDeletePost && (
          <button
            onClick={handleDeletePost}
            disabled={isDeletingPost}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            title="Delete post"
          >
            {isDeletingPost ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Post content */}
      <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
        {post.content}
      </div>

      {/* Post media image */}
      {post.image_url && (
        <FeedImage src={post.image_url} alt="Post attachment" />
      )}

      {/* Counts */}
      <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-850/60 pt-3">
        <span>{likesCount} likes</span>
        <button
          onClick={() => setShowComments(!showComments)}
          className="hover:underline"
        >
          {commentsList.length} comments
        </button>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-850/60 pt-1">
        <button
          onClick={handleLikeToggle}
          disabled={!currentUser}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
            isLiked
              ? 'text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
              : 'text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
          } ${!currentUser && 'opacity-50 cursor-not-allowed'}`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Comment</span>
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="border-t border-zinc-100 dark:border-zinc-850/60 pt-4 space-y-4">
          {/* Comments List */}
          {commentsList.length > 0 && (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {commentsList.map((comment: any) => {
                const commenter = comment.profiles || {}
                const commenterAvatar = commenter.avatar_cloudinary_url || commenter.avatar_url || commenter.image || null
                const canDeleteComment = currentUser && (comment.author_id === currentUser.id || isAdmin)

                return (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <Link href={`/professionals/${comment.author_id}`} className="shrink-0 mt-0.5">
                      {commenterAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={formatImageUrl(commenterAvatar, { width: 64, height: 64, crop: 'fill' })}
                          alt={commenter.full_name}
                          className="h-7 w-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold dark:bg-emerald-950/30 dark:text-emerald-400">
                          {commenter.full_name?.[0] || 'U'}
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl px-3 py-2 text-xs relative group/comment border border-zinc-100/50 dark:border-zinc-800/40">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/professionals/${comment.author_id}`}
                          className="font-bold text-zinc-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                        >
                          {commenter.full_name}
                        </Link>
                        <span className="text-[10px] text-zinc-400">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-line leading-relaxed">
                        {comment.content}
                      </p>

                      {canDeleteComment && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-rose-500 opacity-0 group-hover/comment:opacity-100 transition-opacity cursor-pointer"
                          title="Delete comment"
                        >
                          {deletingCommentId === comment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Comment Form */}
          {currentUser ? (
            <form onSubmit={handleAddComment} className="flex gap-2.5 items-end">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 px-4 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white p-2 transition-colors cursor-pointer"
              >
                {isSubmittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-2">
              <Link href="/login" className="text-emerald-500 hover:underline">
                Sign in
              </Link>{' '}
              to reply or post a comment.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
