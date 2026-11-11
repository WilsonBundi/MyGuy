import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { EncodedFileOutput, EncodedFileType, S3Upload } from 'livekit-server-sdk'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { getLiveKitEgressClient, isLiveKitConfigurationError } from '@/lib/livekit'
import {
  createLiveReplayUrl,
  deleteLiveReplayObject,
  getLiveReplayUploadConfig,
  isLiveReplayStorageConfigurationError,
} from '@/lib/live-replay-storage'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const room = await prisma.room.findUnique({
      where: { id },
      select: { hostId: true, isLive: true },
    })
    if (!room || room.hostId !== userId) {
      return NextResponse.json({ error: 'Replay not found.' }, { status: 404 })
    }
    const replay = await prisma.liveReplay.findUnique({ where: { roomId: id } })
    if (!replay) return NextResponse.json({ replay: null })
    if (replay.expiresAt <= new Date() && replay.status !== 'deleted') {
      await deleteLiveReplayObject(replay.storageKey)
      const expired = await prisma.liveReplay.update({
        where: { id: replay.id },
        data: { status: 'deleted', error: null },
        select: { id: true, status: true, expiresAt: true, durationSeconds: true },
      })
      return NextResponse.json({ replay: expired })
    }
    return NextResponse.json({
      replay: {
        id: replay.id,
        status: replay.status,
        expiresAt: replay.expiresAt,
        durationSeconds: replay.durationSeconds,
        error: replay.status === 'failed' ? replay.error : null,
        playbackUrl: replay.status === 'ready' ? await createLiveReplayUrl(replay.storageKey) : null,
      },
      live: room.isLive,
    })
  } catch (error) {
    if (isLiveKitConfigurationError(error) || isLiveReplayStorageConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error loading live replay:', error)
    return NextResponse.json({ error: 'Could not load the live replay.' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const room = await prisma.room.findUnique({
      where: { id },
      select: { hostId: true, isLive: true, roomName: true },
    })
    if (!room?.isLive || !room.roomName) {
      return NextResponse.json({ error: 'This live is no longer available.' }, { status: 404 })
    }
    if (room.hostId !== userId) return NextResponse.json({ error: 'Only the host can record a replay.' }, { status: 403 })

    const previous = await prisma.liveReplay.findUnique({ where: { roomId: id } })
    if (previous && previous.status !== 'failed') {
      return NextResponse.json({ error: 'A replay has already been recorded or is in progress.' }, { status: 409 })
    }

    const storage = getLiveReplayUploadConfig()
    const storageKey = `live-replays/${userId}/${id}/${randomUUID()}.mp4`
    const consentedAt = new Date()
    const replay = previous
      ? await prisma.liveReplay.update({
          where: { id: previous.id },
          data: {
            storageKey,
            status: 'starting',
            egressId: null,
            durationSeconds: null,
            error: null,
            consentedAt,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        })
      : await prisma.liveReplay.create({
          data: {
            roomId: id,
            storageKey,
            consentedAt,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        })

    try {
      const egress = await getLiveKitEgressClient().startRoomCompositeEgress(
        room.roomName,
        {
          file: new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath: storageKey,
            output: {
              case: 's3',
              value: new S3Upload({
                accessKey: storage.accessKey,
                secret: storage.secret,
                region: storage.region,
                bucket: storage.bucket,
                endpoint: storage.endpoint,
                forcePathStyle: storage.forcePathStyle,
              }),
            },
          }),
        },
        { layout: 'grid' }
      )
      const updatedReplay = await prisma.liveReplay.update({
        where: { id: replay.id },
        data: { egressId: egress.egressId, status: 'recording' },
        select: { id: true, status: true, expiresAt: true },
      })
      return NextResponse.json({ replay: updatedReplay }, { status: 201 })
    } catch (egressError) {
      await prisma.liveReplay.update({
        where: { id: replay.id },
        data: { status: 'failed', error: 'The recording service could not start.' },
      })
      throw egressError
    }
  } catch (error) {
    if (isLiveKitConfigurationError(error) || isLiveReplayStorageConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error starting live replay recording:', error)
    return NextResponse.json({ error: 'Could not start replay recording.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const room = await prisma.room.findUnique({
      where: { id },
      select: { hostId: true },
    })
    if (!room || room.hostId !== userId) {
      return NextResponse.json({ error: 'Replay not found.' }, { status: 404 })
    }
    const replay = await prisma.liveReplay.findUnique({ where: { roomId: id } })
    if (!replay) return NextResponse.json({ success: true })
    if (replay.status === 'recording' || replay.status === 'starting') {
      return NextResponse.json({ error: 'Wait until recording has finished before deleting the replay.' }, { status: 409 })
    }
    if (replay.status !== 'deleted') await deleteLiveReplayObject(replay.storageKey)
    await prisma.liveReplay.update({
      where: { id: replay.id },
      data: { status: 'deleted', error: null },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isLiveKitConfigurationError(error) || isLiveReplayStorageConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error deleting live replay:', error)
    return NextResponse.json({ error: 'Could not delete the live replay.' }, { status: 500 })
  }
}
