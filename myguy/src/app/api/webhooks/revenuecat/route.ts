import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { liveCoinProducts } from '@/lib/live-coins'

const webhookSchema = z.object({
  event: z.object({
    id: z.string().min(1),
    type: z.string(),
    app_user_id: z.string().min(1),
    product_id: z.string().min(1),
    transaction_id: z.string().min(1).optional(),
    store: z.string().optional(),
  }),
})

export async function POST(request: Request) {
  const expectedAuthorization = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION
  if (!expectedAuthorization) {
    return NextResponse.json({ error: 'RevenueCat webhook authorization is not configured.' }, { status: 503 })
  }
  const authorization = request.headers.get('authorization')
  if (authorization !== expectedAuthorization && authorization !== `Bearer ${expectedAuthorization}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const parsed = webhookSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid purchase event.' }, { status: 400 })
    const { event } = parsed.data
    if (event.type !== 'NON_RENEWING_PURCHASE') {
      return NextResponse.json({ received: true, ignored: true })
    }
    const product = liveCoinProducts.find(({ productId }) => productId === event.product_id)
    const transactionId = event.transaction_id || event.id
    if (!product || !transactionId) {
      return NextResponse.json({ received: true, ignored: true })
    }
    const user = await prisma.user.findUnique({
      where: { id: event.app_user_id },
      select: { id: true },
    })
    if (!user) {
      console.error('Ignoring RevenueCat coin purchase for an unknown app user.')
      return NextResponse.json({ received: true, ignored: true })
    }
    const previous = await prisma.liveCoinPurchase.findUnique({
      where: { transactionId },
      select: { id: true },
    })
    if (previous) return NextResponse.json({ received: true, duplicate: true })

    try {
      await prisma.$transaction(async (tx) => {
        await tx.liveCoinPurchase.create({
          data: {
            userId: user.id,
            transactionId,
            productId: product.productId,
            store: event.store,
            coins: product.coins,
          },
        })
        await tx.giftWallet.upsert({
          where: { userId: user.id },
          create: { userId: user.id, balance: product.coins },
          update: { balance: { increment: product.coins } },
        })
        await tx.coinLedgerEntry.create({
          data: {
            userId: user.id,
            amount: product.coins,
            reason: 'store_purchase',
            reference: transactionId,
          },
        })
      })
    } catch (transactionError) {
      if (transactionError && typeof transactionError === 'object' && 'code' in transactionError && transactionError.code === 'P2002') {
        return NextResponse.json({ received: true, duplicate: true })
      }
      throw transactionError
    }
    return NextResponse.json({ received: true, credited: product.coins })
  } catch (error) {
    console.error('Error processing RevenueCat purchase webhook:', error)
    return NextResponse.json({ error: 'Could not process purchase event.' }, { status: 500 })
  }
}
