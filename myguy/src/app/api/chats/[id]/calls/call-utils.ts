import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function getDirectChatParticipant(chatId: string, userId: string) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: {
      chat: {
        select: {
          isGroup: true,
          members: {
            select: {
              userId: true,
              user: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } }
            }
          }
        }
      }
    }
  })
  if (!member || member.chat.isGroup || member.chat.members.length !== 2) return null
  return member.chat.members.find((candidate) => candidate.userId !== userId) ?? null
}

export async function authorizeCallParticipant(callId: string, chatId: string, userId: string) {
  const call = await prisma.chatCall.findFirst({
    where: { id: callId, chatId },
    include: {
      caller: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } },
      callee: { select: { id: true, username: true, profile: { select: { displayName: true, avatar: true } } } }
    }
  })
  if (!call || (call.callerId !== userId && call.calleeId !== userId)) {
    const response = NextResponse.json({ error: 'Call not found' }, { status: 404 })
    return { response }
  }
  return { call } as const
}

export async function expireStaleCallsForUsers(userIds: string[], now = new Date()) {
  const staleAfter = 25_000
  const ringingAfter = 60_000
  const calls = await prisma.chatCall.findMany({
    where: {
      status: { in: ['ringing', 'active'] },
      OR: [{ callerId: { in: userIds } }, { calleeId: { in: userIds } }]
    },
    select: { id: true, status: true, createdAt: true, callerLastSeenAt: true, calleeLastSeenAt: true }
  })
  const staleIds = calls.filter((call) =>
    call.status === 'ringing'
      ? now.getTime() - call.createdAt.getTime() > ringingAfter
      : !call.calleeLastSeenAt ||
        now.getTime() - call.callerLastSeenAt.getTime() > staleAfter ||
        now.getTime() - call.calleeLastSeenAt.getTime() > staleAfter
  ).map((call) => call.id)
  if (staleIds.length) {
    await prisma.chatCall.updateMany({
      where: { id: { in: staleIds }, status: { in: ['ringing', 'active'] } },
      data: { status: 'ended' }
    })
  }
}

export function serializeCall(call: {
  id: string;
  chatId: string;
  callerId: string;
  calleeId: string;
  type: string;
  status: string;
  offer: unknown;
  answer: unknown;
  createdAt: Date;
  caller: { id: string; username: string; profile: { displayName: string | null; avatar: string | null } | null };
  callee: { id: string; username: string; profile: { displayName: string | null; avatar: string | null } | null };
}) {
  return {
    id: call.id,
    chatId: call.chatId,
    callerId: call.callerId,
    calleeId: call.calleeId,
    type: call.type,
    status: call.status,
    offer: call.offer,
    answer: call.answer,
    createdAt: call.createdAt,
    caller: call.caller,
    callee: call.callee
  }
}
