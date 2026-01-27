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

    const existingUser = await userCollection.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await userCollection.insertOne({
      username,
      password: hashedPassword,
      createTime: new Date()
    });

    const token = generateToken(result.insertedId.toString());

    return NextResponse.json({
      message: '注册成功',
      user: { id: result.insertedId.toString(), username },
      token
    }, { status: 201 });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}