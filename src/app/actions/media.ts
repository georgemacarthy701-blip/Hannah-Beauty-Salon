'use server'

import cloudinary from '@/lib/cloudinary'

export async function uploadImage(formData: FormData): Promise<{ url: string; publicId: string } | { error: string }> {
  try {
    const file = formData.get('file') as File | null
    if (!file) {
      return { error: 'No file provided' }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const isDoc = file.name.toLowerCase().endsWith('.pdf') || 
                  file.name.toLowerCase().endsWith('.doc') || 
                  file.name.toLowerCase().endsWith('.docx') ||
                  file.type === 'application/pdf' ||
                  file.type.includes('word')

    const resourceType = isDoc ? 'raw' : 'auto'

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'leonelink',
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            resolve({ error: error.message || 'Upload failed' })
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            })
          } else {
            resolve({ error: 'Upload failed' })
          }
        }
      )

      uploadStream.end(buffer)
    })
  } catch (err: any) {
    console.error('Upload action error:', err)
    return { error: err.message || 'Server error uploading file' }
  }
}
