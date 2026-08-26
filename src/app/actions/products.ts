'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/**
 * Creates a new product listing in the marketplace.
 */
export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to list a product.' }
  }

  const title = formData.get('title') as string
  const priceRaw = formData.get('price') as string
  const category = formData.get('category') as string
  const location = formData.get('location') as string
  const description = formData.get('description') as string
  const imageUrl = formData.get('imageUrl') as string

  if (!title || !title.trim()) return { error: 'Title is required.' }
  if (!priceRaw) return { error: 'Price is required.' }
  if (!category || !category.trim()) return { error: 'Category is required.' }
  if (!location || !location.trim()) return { error: 'Location is required.' }
  if (!imageUrl || !imageUrl.trim()) return { error: 'Product photo is required.' }

  const price = parseFloat(priceRaw)
  if (isNaN(price) || price < 0) {
    return { error: 'Price must be a valid positive number.' }
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      price,
      currency: 'NLE',
      category: category.trim(),
      location: location.trim(),
      image_url: imageUrl.trim(),
      is_available: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return { error: error.message }
  }

  revalidatePath('/marketplace')
  return { success: true, product: data }
}

/**
 * Deletes a product listing. Seller owner or admins only.
 */
export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to delete a product listing.' }
  }

  // Fetch product to verify ownership
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single()

  if (fetchError || !product) {
    return { error: 'Product listing not found.' }
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isOwner = product.seller_id === user.id

  if (!isOwner && !isAdmin) {
    return { error: 'You are not authorized to delete this product listing.' }
  }

  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (deleteError) {
    console.error('Error deleting product:', deleteError)
    return { error: deleteError.message }
  }

  revalidatePath('/marketplace')
  return { success: true }
}
