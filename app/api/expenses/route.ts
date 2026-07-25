import { NextRequest, NextResponse } from 'next/server'
import { getDb, generateId } from '@/lib/db'
import { withAuth } from '@/lib/auth'

export const runtime = 'edge'

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const db = await getDb()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reimburseType = searchParams.get('reimburseType')
    const payType = searchParams.get('payType')

    const conditions: string[] = ['user_id = ?']
    const params: any[] = [userId]

    if (startDate) {
      conditions.push('date >= ?')
      params.push(startDate)
    }
    if (endDate) {
      conditions.push('date <= ?')
      params.push(endDate)
    }
    if (reimburseType) {
      conditions.push('reimburse_type = ?')
      params.push(reimburseType)
    }
    if (payType) {
      conditions.push('pay_type = ?')
      params.push(payType)
    }

    const whereClause = conditions.join(' AND ')
    const offset = (page - 1) * limit

    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM expenses WHERE ${whereClause}`)
      .bind(...params)
      .first()

    const { results } = await db
      .prepare(
        `SELECT id, user_id, amount, reimburse_type, reimburse_amount, pay_type, date, other, create_time, update_time
         FROM expenses WHERE ${whereClause}
         ORDER BY date DESC LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all()

    const expenses = results.map((row: any) => ({
      _id: row.id,
      userId: row.user_id,
      amount: row.amount,
      reimburseType: row.reimburse_type,
      reimburseAmount: row.reimburse_amount,
      payType: row.pay_type,
      date: row.date,
      other: row.other,
      createTime: row.create_time,
      updateTime: row.update_time,
    }))

    return NextResponse.json(
      { expenses, total: (countResult as any).total, page, limit },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取支出记录失败:', error)
    return NextResponse.json({ error: '获取支出记录失败' }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { amount, reimburseType, reimburseAmount, payType, date, other } = await request.json() as {
      amount: number
      reimburseType: string
      reimburseAmount?: number
      payType: string
      date: string
      other?: string
    }

    if (!amount || !reimburseType || !payType || !date) {
      return NextResponse.json({ error: '金额、报销类型、支付类型和日期不能为空' }, { status: 400 })
    }

    const db = await getDb()
    const expenseId = generateId()
    const now = new Date().toISOString()

    await db
      .prepare(
        `INSERT INTO expenses (id, user_id, amount, reimburse_type, reimburse_amount, pay_type, date, other, create_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        expenseId,
        userId,
        amount,
        reimburseType,
        reimburseAmount || null,
        payType,
        date,
        other || null,
        now
      )
      .run()

    return NextResponse.json(
      { message: '支出记录创建成功', expenseId },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建支出记录失败:', error)
    return NextResponse.json({ error: '创建支出记录失败' }, { status: 500 })
  }
})
