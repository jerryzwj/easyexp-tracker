import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { withAuth } from '@/lib/auth'

export const runtime = 'edge'

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const db = await getDb()
    const searchParams = request.nextUrl.searchParams
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

    const { results } = await db
      .prepare(`SELECT amount, reimburse_type, reimburse_amount FROM expenses WHERE ${whereClause}`)
      .bind(...params)
      .all()

    let totalExpense = 0
    let pendingReimburse = 0
    let reimbursed = 0

    for (const exp of results as any[]) {
      totalExpense += exp.amount || 0
      if (exp.reimburse_type === '待报销') {
        pendingReimburse += exp.amount || 0
      }
      if (exp.reimburse_type === '已报销') {
        reimbursed += exp.reimburse_amount || 0
      }
    }

    const balance = totalExpense - reimbursed

    return NextResponse.json({ totalExpense, pendingReimburse, reimbursed, balance }, { status: 200 })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
})
