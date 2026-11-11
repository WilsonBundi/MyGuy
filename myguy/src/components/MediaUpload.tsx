'use client'

import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faImage, faVideo, faCamera, faSpinner, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { compressVideo, validateVideoSize } from '@/lib/videoCompressor'

interface MediaUploadProps {
  onUploadComplete: (url: string) => void
  accept?: string
  maxSize?: number // in MB
  label?: string
}

export default function MediaUpload({
  onUploadComplete,
  accept = 'image/*,video/*',
  maxSize = 10,
  label = 'Upload Media'
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate video size
    if (file.type.startsWith('video/')) {
      const validation = validateVideoSize(file)
      if (!validation.valid) {
        setError(validation.error || 'Video validation failed')
        return
      }
    }

    // Validate image size
    if (file.type.startsWith('image/') && file.size > maxSize * 1024 * 1024) {
      setError(`Image too large (max ${maxSize}MB)`)
      return
    }

    // Compress video if needed
    let fileToUpload = file
    if (file.type.startsWith('video/')) {
      setCompressing(true)
      try {
        fileToUpload = await compressVideo(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Video compression failed')
        setCompressing(false)
        return
      }
      setCompressing(false)
    }

    // Create preview
    if (fileToUpload.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(fileToUpload)
    } else if (fileToUpload.type.startsWith('video/')) {
      setPreview(null) // No preview for videos
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', fileToUpload)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      onUploadComplete(data.url)
      setPreview(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {!preview ? (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading || compressing}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-orange-500 dark:hover:border-orange-400 transition ${
              uploading || compressing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {compressing ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-orange-500" />
                <span className="text-gray-600 dark:text-gray-300">Compressing video...</span>
              </>
            ) : uploading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-orange-500" />
                <span className="text-gray-600 dark:text-gray-300">Uploading...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="relative">
          {preview?.startsWith('/uploads/') ? (
            preview.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faVideo} className="w-12 h-12 text-gray-400" />
              </div>
            )
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
          )}
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || compressing}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
          <span className="text-sm">Photo</span>
        </button>
        <button
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'video/*'
              fileInputRef.current.click()
            }
          }}
          disabled={uploading || compressing}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faVideo} className="w-4 h-4" />
          <span className="text-sm">Video</span>
        </button>
      </div>
    </div>
  )
}
