import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false

  const configuredOrigins = (process.env.MOBILE_CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (configuredOrigins.includes(origin)) return true
  if (process.env.NODE_ENV === 'production') return false

  try {
    const url = new URL(origin)
    const host = url.hostname
    const isPrivateHost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    return isPrivateHost && ['8081', '19006'].includes(url.port)
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const originAllowed = isAllowedOrigin(origin)

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    if (originAllowed && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Vary', 'Origin')
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
    return response
  }

  const response = NextResponse.next()
  if (originAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Vary', 'Origin')
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type')
  }
  return response
}

export const config = {
  matcher: '/api/:path*',
}
