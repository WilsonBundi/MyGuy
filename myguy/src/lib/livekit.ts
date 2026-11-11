import { AccessToken, EgressClient, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk'

export class LiveKitConfigurationError extends Error {
  constructor() {
    super('Live streaming is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET on the server.')
    this.name = 'LiveKitConfigurationError'
  }
}

function getLiveKitCredentials() {
  const url = process.env.LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  if (!url || !apiKey || !apiSecret) throw new LiveKitConfigurationError()
  return { url: url.replace(/\/+$/, ''), apiKey, apiSecret }
}

export function getLiveKitServerUrl() {
  const { url } = getLiveKitCredentials()
  return url.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:')
}

export function getLiveKitRoomService() {
  const { url, apiKey, apiSecret } = getLiveKitCredentials()
  const httpUrl = url.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:')
  return new RoomServiceClient(httpUrl, apiKey, apiSecret)
}

export function getLiveKitEgressClient() {
  const { url, apiKey, apiSecret } = getLiveKitCredentials()
  const httpUrl = url.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:')
  return new EgressClient(httpUrl, apiKey, apiSecret)
}

export function getLiveKitWebhookReceiver() {
  const { apiKey, apiSecret } = getLiveKitCredentials()
  return new WebhookReceiver(apiKey, apiSecret)
}

export async function createLiveKitToken({
  identity,
  name,
  roomName,
  canPublish,
}: {
  identity: string
  name: string
  roomName: string
  canPublish: boolean
}) {
  const { apiKey, apiSecret } = getLiveKitCredentials()
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: '1h',
  })
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canPublishData: true,
    canSubscribe: true,
  })
  return token.toJwt()
}

export function isLiveKitConfigurationError(error: unknown): error is LiveKitConfigurationError {
  return error instanceof LiveKitConfigurationError
}
