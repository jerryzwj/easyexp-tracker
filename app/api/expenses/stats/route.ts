import { NextRequest, NextResponse } from 'next/server';
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

    interface StatsQuery {
      userId: string;
      date?: { $gte?: Date; $lte?: Date; };
      reimburseType?: string;
      payType?: string;
    }
    const query: StatsQuery = { userId };

    if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };
    if (reimburseType) query.reimburseType = reimburseType;
    if (payType) query.payType = payType;

    const expenses = await expenseCollection.find(query).toArray();
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pendingReimburse = expenses.filter(exp => exp.reimburseType === '待报销').reduce((sum, exp) => sum + exp.amount, 0);
    const reimbursed = expenses.filter(exp => exp.reimburseType === '已报销').reduce((sum, exp) => sum + (exp.reimburseAmount || 0), 0);
    const balance = totalExpense - reimbursed;

    return NextResponse.json({ totalExpense, pendingReimburse, reimbursed, balance }, { status: 200 });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
});