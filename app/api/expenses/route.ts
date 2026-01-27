import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const client = await clientPromise;
    const db = client.db('EasyExp');
    const expenseCollection = db.collection('expense');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reimburseType = searchParams.get('reimburseType');
    const payType = searchParams.get('payType');

    interface ExpenseQuery {
      userId: string;
      date?: { $gte?: Date; $lte?: Date; };
      reimburseType?: string;
      payType?: string;
    }
    const query: ExpenseQuery = { userId };
    
    if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };
    if (reimburseType) query.reimburseType = reimburseType;
    if (payType) query.payType = payType;

    const offset = (page - 1) * limit;
    const expenses = await expenseCollection.find(query).sort({ date: -1 }).skip(offset).limit(limit).toArray();
    const total = await expenseCollection.countDocuments(query);

    return NextResponse.json({ expenses, total, page, limit }, { status: 200 });
  } catch (error) {
    console.error('获取支出记录失败:', error);
    return NextResponse.json({ error: '获取支出记录失败' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { amount, reimburseType, reimburseAmount, payType, date, other } = await request.json();

    if (!amount || !reimburseType || !payType || !date) {
      return NextResponse.json({ error: '金额、报销类型、支付类型和日期不能为空' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('EasyExp');
    const expenseCollection = db.collection('expense');

    const newExpense = { userId, amount, reimburseType, reimburseAmount, payType, date: new Date(date), other, createTime: new Date() };
    const result = await expenseCollection.insertOne(newExpense);

    return NextResponse.json({ message: '支出记录创建成功', expenseId: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error('创建支出记录失败:', error);
    return NextResponse.json({ error: '创建支出记录失败' }, { status: 500 });
  }
});