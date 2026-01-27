import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import clientPromise from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const client = await clientPromise;
    const db = client.db('EasyExp');
    const expenseCollection = db.collection('expense');

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reimburseType = searchParams.get('reimburseType');
    const payType = searchParams.get('payType');

    interface ExportQuery { userId: string; date?: { $gte?: Date; $lte?: Date }; reimburseType?: string; payType?: string; }
    const query: ExportQuery = { userId };

    if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };
    if (reimburseType) query.reimburseType = reimburseType;
    if (payType) query.payType = payType;

    const expenses = await expenseCollection.find(query).sort({ date: -1 }).toArray();

    const exportData = expenses.map(expense => ({
      日期: new Date(expense.date).toLocaleDateString('zh-CN'),
      金额: expense.amount,
      报销类型: expense.reimburseType,
      支付类型: expense.payType,
      报销金额: expense.reimburseAmount || '',
      备注: expense.other || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, '支出记录');

    try {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      const response = new NextResponse(excelBuffer as Buffer);
      response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      response.headers.set('Content-Disposition', 'attachment; filename=expenses.xlsx');
      return response;
    } catch (excelError) {
      console.error('生成 Excel 文件失败:', excelError);
      return NextResponse.json({ error: '生成 Excel 文件失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('导出支出记录失败:', error);
    return NextResponse.json({ error: '导出支出记录失败' }, { status: 500 });
  }
});