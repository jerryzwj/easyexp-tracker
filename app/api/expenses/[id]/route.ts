import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const GET = withAuth(async (request: NextRequest, userId: string, params: { id: string }) => {
  try {
    const client = await clientPromise;
    const db = client.db('EasyExp');
    const expenseCollection = db.collection('expense');

    const expense = await expenseCollection.findOne({ _id: new ObjectId(params.id), userId });
    if (!expense) {
      return NextResponse.json({ error: '支出记录不存在' }, { status: 404 });
    }

    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    console.error('获取支出记录失败:', error);
    return NextResponse.json({ error: '获取支出记录失败' }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: NextRequest, userId: string, params: { id: string }) => {
  try {
    const { amount, reimburseType, reimburseAmount, payType, date, other } = await request.json();
    const client = await clientPromise;
    const db = client.db('EasyExp');
    const expenseCollection = db.collection('expense');

    const result = await expenseCollection.updateOne(
      { _id: new ObjectId(params.id), userId },
      { $set: { amount, reimburseType, reimburseAmount, payType, date: new Date(date), other, updateTime: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: '支出记录不存在' }, { status: 404 });
    }

    return NextResponse.json({ message: '支出记录更新成功' }, { status: 200 });
  } catch (error) {
    console.error('更新支出记录失败:', error);
    return NextResponse.json({ error: '更新支出记录失败' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: NextRequest, userId: string, params: { id: string }) => {
  try {
    const client = await clientPromise;
    const db = client.db('EasyExp');
    const expenseCollection = db.collection('expense');

    const result = await expenseCollection.deleteOne({ _id: new ObjectId(params.id), userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: '支出记录不存在' }, { status: 404 });
    }

    return NextResponse.json({ message: '支出记录删除成功' }, { status: 200 });
  } catch (error) {
    console.error('删除支出记录失败:', error);
    return NextResponse.json({ error: '删除支出记录失败' }, { status: 500 });
  }
});