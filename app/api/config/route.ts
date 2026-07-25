import { NextRequest, NextResponse } from 'next/server'
import { getDb, generateId } from '@/lib/db'
import { withAuth } from '@/lib/auth'

export const runtime = 'edge'

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const db = await getDb()

    const { results } = await db
      .prepare('SELECT type, options FROM configs WHERE user_id = ?')
      .bind(userId)
      .all()

    const config: Record<string, any> = {
      reimburseTypes: [],
      payTypes: [],
    }

    for (const row of results as any[]) {
      try {
        const options = JSON.parse(row.options)
        if (row.type === 'reimburseType') {
          config.reimburseTypes = options
        } else if (row.type === 'payType') {
          config.payTypes = options
        }
      } catch {
        // skip invalid JSON
      }
    }

    return NextResponse.json(config, { status: 200 })
  } catch (error) {
    console.error('获取配置失败:', error)
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 })
  }
})

export const PUT = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { type, options } = await request.json() as { type: string; options: string[] }
    if (!type || !options || !Array.isArray(options)) {
      return NextResponse.json({ error: '无效的配置参数' }, { status: 400 })
    }

    if (!['reimburseType', 'payType'].includes(type)) {
      return NextResponse.json({ error: '无效的配置类型' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const optionsJson = JSON.stringify(options)

    const existing = await db
      .prepare('SELECT id FROM configs WHERE user_id = ? AND type = ?')
      .bind(userId, type)
      .first()

    if (existing) {
      await db
        .prepare('UPDATE configs SET options = ?, update_time = ? WHERE user_id = ? AND type = ?')
        .bind(optionsJson, now, userId, type)
        .run()
    } else {
      const configId = generateId()
      await db
        .prepare('INSERT INTO configs (id, user_id, type, options, update_time) VALUES (?, ?, ?, ?, ?)')
        .bind(configId, userId, type, optionsJson, now)
        .run()
    }

    return NextResponse.json({ message: '配置更新成功' }, { status: 200 })
  } catch (error) {
    console.error('更新配置失败:', error)
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 })
  }
})
