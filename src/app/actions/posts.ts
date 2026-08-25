'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/**
 * Creates a new post in the feed.
 */
export async function createPost(content: string, imageUrl?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to create a post.' }
  }

  if (!content || content.trim().length === 0) {
    return { error: 'Post content cannot be empty.' }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content: content.trim(),
      image_url: imageUrl || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating post:', error)
    return { error: error.message }
  }

  revalidatePath('/feed')
  return { success: true, post: data }
}

/**
 * Deletes a post. Post author or admins only.
 */
export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to delete posts.' }
  }

  // Fetch post to check authorship
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    return { error: 'Post not found.' }
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isAuthor = post.author_id === user.id

  if (!isAuthor && !isAdmin) {
    return { error: 'You are not authorized to delete this post.' }
  }

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (deleteError) {
    console.error('Error deleting post:', deleteError)
    return { error: deleteError.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

/**
 * Toggles a like on a post.
 */
export async function toggleLike(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to like posts.' }
  }

  // Check if already liked
  const { data: existingLike, error: fetchError } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (existingLike) {
    // Unlike
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('id', existingLike.id)

    if (deleteError) {
      return { error: deleteError.message }
    }
  } else {
    // Like
    const { error: insertError } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.id
      })

    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath('/feed')
  return { success: true }
}

/**
 * Adds a comment to a post.
 */
export async function addComment(postId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to comment.' }
  }

  if (!content || content.trim().length === 0) {
    return { error: 'Comment content cannot be empty.' }
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content: content.trim()
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return { error: error.message }
  }

  revalidatePath('/feed')
  return { success: true, comment: data }
}

/**
 * Deletes a comment. Comment author or admins only.
 */
export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to delete comments.' }
  }

  // Fetch comment to check authorship
  const { data: comment, error: fetchError } = await supabase
    .from('post_comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (fetchError || !comment) {
    return { error: 'Comment not found.' }
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isAuthor = comment.author_id === user.id

  if (!isAuthor && !isAdmin) {
    return { error: 'You are not authorized to delete this comment.' }
  }

  const { error: deleteError } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)

  if (deleteError) {
    console.error('Error deleting comment:', deleteError)
    return { error: deleteError.message }
  }

  revalidatePath('/feed')
  return { success: true }
}
