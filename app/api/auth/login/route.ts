import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, comparePassword } from '@/lib/password'
import { getDb, generateId } from '@/lib/db'
import { generateToken } from '@/lib/jwt'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json() as { username: string; password: string }

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    const db = await getDb()

    const existingUser = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
    if (!existingUser) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const isPasswordValid = await comparePassword(password, existingUser.password as string)
    if (!isPasswordValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const token = await generateToken(existingUser.id as string)

    return NextResponse.json(
      {
        message: '登录成功',
        user: { id: existingUser.id, username: existingUser.username },
        token,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
