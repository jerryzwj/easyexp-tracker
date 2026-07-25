import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, comparePassword } from '@/lib/password'
import { getDb } from '@/lib/db'
import { withAuth } from '@/lib/auth'

export const runtime = 'edge'

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { currentPassword, newPassword } = await request.json() as { currentPassword: string; newPassword: string }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '请提供当前密码和新密码' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少为6位' }, { status: 400 })
    }

    const db = await getDb()

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password as string)
    if (!isPasswordValid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 401 })
    }

    const hashedPassword = await hashPassword(newPassword)
    await db.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashedPassword, userId).run()

    return NextResponse.json({ message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码失败:', error)
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 })
  }
})
