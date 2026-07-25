import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { withAuth } from '@/lib/auth'

export const runtime = 'edge'

export const GET = withAuth(async (request: NextRequest, userId: string, params: { id: string }) => {
  try {
    const db = await getDb()
    const expense = await db
      .prepare(
        'SELECT id, user_id, amount, reimburse_type, reimburse_amount, pay_type, date, other, create_time, update_time FROM expenses WHERE id = ? AND user_id = ?'
      )
      .bind(params.id, userId)
      .first()

    if (!expense) {
      return NextResponse.json({ error: '支出记录不存在' }, { status: 404 })
    }

    return NextResponse.json(
      {
        _id: expense.id,
        userId: expense.user_id,
        amount: expense.amount,
        reimburseType: expense.reimburse_type,
        reimburseAmount: expense.reimburse_amount,
        payType: expense.pay_type,
        date: expense.date,
        other: expense.other,
        createTime: expense.create_time,
        updateTime: expense.update_time,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取支出记录失败:', error)
    return NextResponse.json({ error: '获取支出记录失败' }, { status: 500 })
  }
})

export const PUT = withAuth(async (request: NextRequest, userId: string, params: { id: string }) => {
  try {
    const { amount, reimburseType, reimburseAmount, payType, date, other } = await request.json() as {
      amount: number
      reimburseType: string
      reimburseAmount?: number
      payType: string
      date: string
      other?: string
    }
    const db = await getDb()
    const now = new Date().toISOString()

    const result = await db
      .prepare(
        `UPDATE expenses SET amount = ?, reimburse_type = ?, reimburse_amount = ?, pay_type = ?, date = ?, other = ?, update_time = ?
         WHERE id = ? AND user_id = ?`
      )
      .bind(
        amount,
        reimburseType,
        reimburseAmount || null,
        payType,
        date,
        other || null,
        now,
        params.id,
        userId
      )
      .run()

    if (result.meta.changes === 0) {
      return NextResponse.json({ error: '支出记录不存在' }, { status: 404 })
    }

    return NextResponse.json({ message: '支出记录更新成功' }, { status: 200 })
  } catch (error) {
    console.error('更新支出记录失败:', error)
    return NextResponse.json({ error: '更新支出记录失败' }, { status: 500 })
  }
})

export const DELETE = withAuth(async (request: NextRequest, userId: string, params: { id: string }) => {
  try {
    const db = await getDb()
    const result = await db
      .prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
      .bind(params.id, userId)
      .run()

    if (result.meta.changes === 0) {
      return NextResponse.json({ error: '支出记录不存在' }, { status: 404 })
    }

    return NextResponse.json({ message: '支出记录删除成功' }, { status: 200 })
  } catch (error) {
    console.error('删除支出记录失败:', error)
    return NextResponse.json({ error: '删除支出记录失败' }, { status: 500 })
  }
})
