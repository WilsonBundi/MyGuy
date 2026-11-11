import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class LiveReplayStorageConfigurationError extends Error {
  constructor() {
    super('Live replay storage is not configured. Set LIVE_REPLAY_BUCKET, LIVE_REPLAY_ACCESS_KEY, LIVE_REPLAY_SECRET_KEY, and LIVE_REPLAY_REGION.')
    this.name = 'LiveReplayStorageConfigurationError'
  }
}

function getStorageConfig() {
  const bucket = process.env.LIVE_REPLAY_BUCKET
  const region = process.env.LIVE_REPLAY_REGION
  const accessKeyId = process.env.LIVE_REPLAY_ACCESS_KEY
  const secretAccessKey = process.env.LIVE_REPLAY_SECRET_KEY
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new LiveReplayStorageConfigurationError()
  }

  return {
    bucket,
    client: new S3Client({
      region,
      endpoint: process.env.LIVE_REPLAY_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.LIVE_REPLAY_ENDPOINT),
      credentials: { accessKeyId, secretAccessKey },
    }),
  }
}

export async function createLiveReplayUrl(storageKey: string) {
  const { bucket, client } = getStorageConfig()
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: storageKey }), {
    expiresIn: 60 * 5,
  })
}

export async function deleteLiveReplayObject(storageKey: string) {
  const { bucket, client } = getStorageConfig()
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }))
}

export function getLiveReplayUploadConfig() {
  const bucket = process.env.LIVE_REPLAY_BUCKET
  const region = process.env.LIVE_REPLAY_REGION
  const accessKey = process.env.LIVE_REPLAY_ACCESS_KEY
  const secret = process.env.LIVE_REPLAY_SECRET_KEY
  if (!bucket || !region || !accessKey || !secret) {
    throw new LiveReplayStorageConfigurationError()
  }
  return {
    bucket,
    region,
    endpoint: process.env.LIVE_REPLAY_ENDPOINT || undefined,
    accessKey,
    secret,
    forcePathStyle: Boolean(process.env.LIVE_REPLAY_ENDPOINT),
  }
}

export function isLiveReplayStorageConfigurationError(
  error: unknown
): error is LiveReplayStorageConfigurationError {
  return error instanceof LiveReplayStorageConfigurationError
}
