import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLiveKitWebhookReceiver, isLiveKitConfigurationError } from '@/lib/livekit'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const event = await getLiveKitWebhookReceiver().receive(
      body,
      request.headers.get('Authorization') || undefined
    )
    const egress = event.egressInfo
    if (!egress?.egressId || !['egress_started', 'egress_updated', 'egress_ended'].includes(event.event)) {
      return NextResponse.json({ received: true })
    }
    const replay = await prisma.liveReplay.findUnique({
      where: { egressId: egress.egressId },
      select: { id: true },
    })
    if (!replay) return NextResponse.json({ received: true, ignored: true })

    if (event.event === 'egress_ended') {
      const file = egress.fileResults.find((result) => Boolean(result.location))
      const hasFile = Boolean(file)
      const failed = Boolean(egress.error) || !hasFile
      await prisma.liveReplay.update({
        where: { id: replay.id },
        data: {
          status: failed ? 'failed' : 'ready',
          durationSeconds: file && file.duration > BigInt(0)
            ? Math.floor(Number(file.duration) / 1_000_000_000)
            : null,
          error: failed ? egress.error || 'The recording did not produce a replay file.' : null,
        },
      })
    } else if (event.event === 'egress_started') {
      await prisma.liveReplay.update({
        where: { id: replay.id },
        data: { status: 'recording' },
      })
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    if (isLiveKitConfigurationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Error processing LiveKit webhook:', error)
    return NextResponse.json({ error: 'Could not process LiveKit webhook.' }, { status: 400 })
  }
}
