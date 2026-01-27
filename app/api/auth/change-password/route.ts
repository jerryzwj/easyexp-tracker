import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import clientPromise from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '请提供当前密码和新密码' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少为6位' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('EasyExp');
    const userCollection = db.collection('user');

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { password: hashedPassword } });

    return NextResponse.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 });
  }
});