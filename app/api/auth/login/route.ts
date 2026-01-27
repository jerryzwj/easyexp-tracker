import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import clientPromise from '@/lib/mongodb';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('EasyExp');
    const userCollection = db.collection('user');

    const user = await userCollection.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const token = generateToken(user._id.toString());

    return NextResponse.json({
      message: '登录成功',
      user: { id: user._id.toString(), username: user.username },
      token
    }, { status: 200 });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}