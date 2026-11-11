import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const purpose = formData.get('purpose')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const imageTypes: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    }
    const videoTypes: Record<string, string> = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov'
    }
    const documentTypes: Record<string, string> = {
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/rtf': 'rtf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/zip': 'zip'
    }
    const isChat = purpose === 'chat'
    const isVideo = (purpose === 'ping' || purpose === 'status' || isChat) && file.type in videoTypes
    const isImage = file.type in imageTypes
    const isDocument = isChat && file.type in documentTypes
    if ((purpose !== 'ping' && purpose !== 'status' && purpose !== 'chat' && purpose !== 'avatar' && purpose !== 'cover' && purpose !== 'crew') ||
      (!isImage && !isVideo && !isDocument) ||
      (purpose !== 'ping' && purpose !== 'status' && !isChat && !isImage)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const maxSize = isVideo ? 100 * 1024 * 1024 : isDocument ? 25 * 1024 * 1024 : 15 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        error: isVideo ? 'Video is too large (max 100MB)' : isDocument ? 'File is too large (max 25MB)' : 'Image is too large (max 15MB)'
      }, { status: 400 })
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const ext = isVideo ? videoTypes[file.type] : isDocument ? documentTypes[file.type] : imageTypes[file.type]
    const filename = `${userId}-${randomUUID()}.${ext}`
    const filepath = join(uploadsDir, filename)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/${filename}`

    return NextResponse.json({
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
      mediaType: isVideo ? 'video' : isDocument ? 'file' : 'image'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
