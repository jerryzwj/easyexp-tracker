import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export async function verifyAuth(request: NextRequest): Promise<{ userId: string } | null> {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }
  return verifyToken(token)
}

export function withAuth(handler: (request: NextRequest, userId: string, params?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: { params: any }): Promise<NextResponse> => {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }
    return handler(request, auth.userId, context?.params)
  }
}
