import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const client = await clientPromise;
    const db = client.db('EasyExp');
    const configCollection = db.collection('config');

    const config = await configCollection.findOne({ userId });
    if (!config) {
      return NextResponse.json({ reimburseTypes: [], payTypes: [] }, { status: 200 });
    }

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { type, options } = await request.json();
    if (!type || !options || !Array.isArray(options)) {
      return NextResponse.json({ error: '无效的配置参数' }, { status: 400 });
    }

    if (!['reimburseType', 'payType'].includes(type)) {
      return NextResponse.json({ error: '无效的配置类型' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('EasyExp');
    const configCollection = db.collection('config');

    await configCollection.updateOne({ userId, type }, { $set: { options, updateTime: new Date() } }, { upsert: true });

    return NextResponse.json({ message: '配置更新成功' }, { status: 200 });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 });
  }
});