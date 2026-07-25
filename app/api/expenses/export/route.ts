import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
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
      .prepare(
        `SELECT date, amount, reimburse_type, pay_type, reimburse_amount, other
         FROM expenses WHERE ${whereClause}
         ORDER BY date DESC`
      )
      .bind(...params)
      .all()

    const exportData = (results as any[]).map((expense: any) => ({
      日期: expense.date,
      金额: expense.amount,
      报销类型: expense.reimburse_type,
      支付类型: expense.pay_type,
      报销金额: expense.reimburse_amount || '',
      备注: expense.other || '',
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    worksheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(workbook, worksheet, '支出记录')

    try {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const response = new NextResponse(excelBuffer as Uint8Array)
      response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      response.headers.set('Content-Disposition', 'attachment; filename=expenses.xlsx')
      return response
    } catch (excelError) {
      console.error('生成 Excel 文件失败:', excelError)
      return NextResponse.json({ error: '生成 Excel 文件失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('导出支出记录失败:', error)
    return NextResponse.json({ error: '导出支出记录失败' }, { status: 500 })
  }
})
