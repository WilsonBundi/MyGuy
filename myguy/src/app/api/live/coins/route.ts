import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/mobile-auth'
import { liveCoinProducts } from '@/lib/live-coins'

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const wallet = await prisma.giftWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { balance: true },
    })
    return NextResponse.json({ balance: wallet.balance, products: liveCoinProducts })
  } catch (error) {
    console.error('Error loading live coin wallet:', error)
    return NextResponse.json({ error: 'Could not load your live coin balance.' }, { status: 500 })
  }
}
