import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/password'
import { getDb, generateId } from '@/lib/db'
import { generateToken } from '@/lib/jwt'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json() as { username: string; password: string }

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少为6位' }, { status: 400 })
    }

    const db = await getDb()

    const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const userId = generateId()
    const now = new Date().toISOString()

    await db
      .prepare('INSERT INTO users (id, username, password, create_time) VALUES (?, ?, ?, ?)')
      .bind(userId, username, hashedPassword, now)
      .run()

    const token = await generateToken(userId)

    return NextResponse.json(
      {
        message: '注册成功',
        user: { id: userId, username },
        token,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
