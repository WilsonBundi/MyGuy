// Video compression utility
// This compresses videos before upload to reduce file size

export async function compressVideo(file: File): Promise<File> {
  const MAX_SIZE = 50 * 1024 * 1024 // 50MB limit
  const COMPRESSION_THRESHOLD = 10 * 1024 * 1024 // 10MB threshold for compression

  // If file is small enough, return as-is
  if (file.size < COMPRESSION_THRESHOLD) {
    return file
  }

  // If file is too large even after compression, reject it
  if (file.size > MAX_SIZE) {
    throw new Error('Video file is too large. Maximum size is 50MB.')
  }

  try {
    // Create a video element to compress
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    
    return new Promise((resolve, reject) => {
      video.src = url
      video.onloadedmetadata = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculate dimensions (reduce to 720p max)
        const maxWidth = 1280
        const maxHeight = 720
        let width = video.videoWidth
        let height = video.videoHeight
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw video frame to canvas
        ctx?.drawImage(video, 0, 0, width, height)
        
        // Convert to blob with reduced quality
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'video/mp4',
              lastModified: Date.now()
            })
            URL.revokeObjectURL(url)
            resolve(compressedFile)
          } else {
            reject(new Error('Failed to compress video'))
          }
        }, 'video/mp4', 0.7) // 70% quality
      }
      
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load video'))
      }
    })
  } catch (error) {
    // If canvas compression fails, return original file
    console.warn('Video compression failed, using original:', error)
    return file
  }
}

export function validateVideoSize(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 50 * 1024 * 1024 // 50MB
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `Video file is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
    }
  }
  
  return { valid: true }
}
